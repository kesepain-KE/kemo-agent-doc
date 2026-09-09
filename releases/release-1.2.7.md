# kemo-agent 1.2.7 — Chat 兼容链路工具调用保真修复

1.2.6 加固了运行环境，1.2.7 回到对话本身：修复 chat 兼容链路（OpenAI Chat Completions 模式）流式
工具调用的三个保真缺陷——原始参数丢失、id 拼接翻倍、畸形 index 打断整条流。修复后工具续轮回放
与 Kemo 原生链路行为一致。

---

## 流式工具调用 raw_arguments 透传

此前 chat 流式链路的 `tool_call_start` 事件不携带原始 arguments JSON，`ToolCallItem.arguments_raw`
系统性为空，工具续轮只能拿到重序列化后的参数。

- 流式事件 metadata 现在透传 `raw_arguments`，兼容层据此还原完整的原始参数；非流式路径原本就有
  raw，本次补齐后两条链路行为一致。
- 工具续轮回放（`run/conversation/helpers.py`）优先使用 `arguments_raw` 原文，无 raw 时才回退
  重序列化；键序与格式跨轮稳定。

## 流式 tool_calls 聚合修复

- id 从「+= 追加」改为「首次赋值」：部分 OpenAI 兼容服务在每个 delta 帧重复下发完整 id，旧行为会把
  id 拼成 `call_abccall_abc`，导致工具调用引用断裂、结果无法对应。
- index 解析改为安全回退：null、字符串、负数或布尔值回退到帧内枚举位置，不再让 int() 抛异常打断
  整条 SSE 流。
- name 保持「+= 拼接」语义：官方服务把 name 拆帧下发（如 history_ + search），拼接是正确行为，
  已有测试锚定。

## 状态空间回归测试

新增 `tests/provider/test_chat_protocol_state_space.py`（42 用例）：

- 脏历史 item id 边界：KemoRequest 对非 msg_/rs_/call_ 前缀 id 的校验行为与错误定位；
- SSE 分片 arguments 聚合 + raw 透传、id 幂等、畸形 index 全分支；
- 重试分类矩阵：400/401/403/409/422 与确定性校验错误 0 次重试；429/5xx/timeout/connection 按策略
  重试；显式 retryable=false 覆盖状态码默认值。

## 验证

- release_check.py 全部 PASS：test_kemo 90、backend_tests 1142 passed + 7 skipped + 125 subtests、
  template_contracts 10、python_compile、git_diff_check、frontend_tests 268（29 files）、
  frontend_build。

## 兼容性

- 仅影响 provider.type=chat；kemo 原生链路不受影响。
- 版本 1.2.6 → 1.2.7（根 + 四组件 + 前端 package.json）。

---

## 第二轮审核修复（2026-09-09 并入，commit 68b3f20）

### 首轮 Item ID 归一化（P1）

- `chat_request_to_kemo()` 的 `_unique_id()` 语义收紧：历史 ID 不带对应语义前缀（msg_/rs_/call_/result_）时在**第一次转换**即重写为请求内唯一新 ID。真实主循环只做一次 Chat → Kemo 转换，脏 ID（item_xxx、legacy_message_1 等）从此不可能进入严格协议层，`Invalid 'input[N].id'` 类错误在入口封死。
- `call_id` 生成前缀从 `callid_` 统一为 `call_`（compat 与 run/history 两处），工具调用/结果引用映射保持不变。
- `validate_request()` 新增 `validate_item_id_prefixes()` 严格不变量：message→msg_、reasoning→rs_、tool_call→call_、tool_result→result_、全局唯一；绕过兼容桥的脏路径立即得到确定性 ProtocolValidationError，绝不进入重试。

### 流式聚合补强（P1）

- `function.name` 重复完整帧防翻倍：片段与累计值相同时视为重复帧丢弃，真实拆帧分片（history_ + search）仍正常拼接；测试补回 `tool_name == "file"` 断言。

### SSE 内嵌错误分类（P2）

- 流中出现 `{"error":{...}}` 帧时按 OpenAI 错误类型归一化：invalid_request_error、authentication_error、permission_error、conflict_error、unprocessable_entity_error 等确定性类型 → 不可重试 category + 显式 retryable=false，外层协调器 0 次重试直接终态提交；未知类型保持默认瞬态分类。

### 协作取消（P2）

- `ChatBridgeProvider.stream()` / `AsyncProviderFacade.stream()` 接受 `cancel_event`；传输层在每次 socket 读前后检查取消标志，命中即抛 `ProviderCancelledError`（category=cancelled、retryable=false），不再等满 HTTP 超时。
- 原生 Kemo 网关 provider 补充 `close()` 透传。

### 第二轮验证

- 全量后端 1148 passed + 7 skipped + 125 subtests；GitHub CI（ubuntu/windows × Python 3.10/3.13 矩阵）与 Security 全部 success。
- 测试重写为真实生产边界：脏历史**首轮转换**后断言全部 ID 前缀正确、唯一、工具引用完整、通过 `validate_request()`，并验证幂等；假 round-trip 测试删除。新增 SSE 错误帧分类参数化测试。

---

## 第三轮修复（2026-09-09，commit f573ff1）

### Chat 取消链路端到端接通（P1-1）

- `run/conversation/provider_events.py` 不再按 `mode == "kemo"` 分叉：统一对两种传输调用 `stream(request, cancel_event=cancel_event)`，旧式自定义 provider 通过 TypeError 回退保持兼容。

### 取消真正中断阻塞读（P1-2）

- Chat 传输层复用 Kemo 的 `start_cancel_watcher`：watcher 线程在取消时关闭阻塞中的 response，`readline()` 立即解除阻塞；read 异常且 cancel 置位时抛 `ProviderCancelledError`（category=cancelled、retryable=false），不再等满 HTTP 超时。`ChatBridgeProvider.stream()` 显式把 cancel_event 传入 `chat_stream()`。

### 畸形 index 按 call_id 隔离（P1-3）

- 流式工具调用槽位解析改为 `_tool_slot()`：可用 index 直接寻址 → 有 call_id 时按 id 稳定映射（重复 id 归原槽、新 id 分配新槽）→ 均不可用时才退回帧内 position，且 position 已被占用即 fail closed（确定性错误、不重试）。两个并行调用 index=null 不会再被合并成一个拼错的工具调用。

### partial-stream 安全重试放宽（P1-4）

- `stream_interrupted` 的 retryable 条件从「无 text 且无 tool_parts」放宽为「无 text」：缓冲中的 tool_parts 尚未发布也未执行（tool_call_start 在流结束后才 yield），中断重试不会产生副作用。

### 新增测试

- 取消端到端（runtime 参数确实进入 ChatBridge/transport）、watcher 关闭解除阻塞 readline、畸形 index 双调用隔离、无 id 歧义 fail closed、`foofoo` 歧义的 schema 感知 name 聚合（注册表中存在 `foofoo` 时拼接、仅存在 `foo` 时判定重复帧）。
- 全量后端 1153 passed + 7 skipped + 125 subtests；GitHub CI 与 Security success。

### 遗留（已知，后续版本处理）

- Chat false-completed continuation guard（模型口头说继续但没有 tool_calls 时仍标记 COMPLETED）——需要独立设计，避免污染 Kemo 原生状态机。
