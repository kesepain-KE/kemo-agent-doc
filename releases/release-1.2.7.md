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
