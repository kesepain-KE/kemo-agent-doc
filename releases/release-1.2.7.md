# v1.2.7 更新说明（2026-09-10）

这是一次 Chat 兼容链路加固、传输可靠性与跨平台 CI 稳定性更新。版本范围覆盖 v1.2.6 之后的全部 12 个提交。

## Chat 兼容传输层加固

Chat Compatibles 兼容模式（`provider.type=chat`）在本版完成了系统性的传输层加固：

### 流式工具调用聚合

- `tool_calls[].id` 与 `function.name` 只在首帧赋值：兼容服务每帧重复下发完整标识时不再拼出 `call_xxxcall_xxx`。
- `tool_calls[].index` 允许 null、字符串、负数等宽松取值，非法时安全回退到帧内枚举位置，不再中断整条流。
- `function.arguments` 除标准字符串分片外，兼容服务直接下发完整 JSON 对象时整体采纳并防重复。
- 流结束发布工具事件时透传 `raw_arguments` 原文，多轮工具循环按原文回放，避免重序列化损失。
- 携带 `finish_reason=length` 的截断工具调用进入 INCOMPLETE 终态，永不执行。

### 请求净化

- 不再向上游注入 `reasoning_effort`、`reasoning_enabled` 与 `stream_options.include_usage`：多家 OpenAI 兼容服务会因未知字段拒绝请求。
- Chat 模式推理能力声明修正为不支持（`chat_reasoning_disabled`），运行时不再提交 reasoning 字段。

### 有界输出前网络恢复

- 严格 2 次尝试预算，仅在零输出（无文本、无思考、无工具分片）时重试。
- 可重试：建连失败、读取超时、429、5xx；`Retry-After` 优先采用，单次等待上限 10 秒。
- 不可重试：401、403、409、400 立即失败。
- 已产出任何内容后中断永不重放；预算耗尽后错误标记终态，防止外层运行时放大重试。

### 两个自动降级

- 工具不支持降级：400 错误明确表示 tools 不受支持时，剥离全部工具字段重试一次；普通 400 不降级，降级绝不重复。
- 流式 JSON 降级：`stream=true` 请求收到 `application/json` 响应时按 Content-Type 直接解析并合成事件流，不重发请求。

## 稳定性修复

- 子智能体终态任务清理排序不再用随机任务 id 作为并列裁决键，Windows 时钟同戳场景下清理顺序回归稳定。
- Windows CI 稳定性：路径比较改用 `os.path.samefile`；文件身份识别不再依赖 `st_dev`/`st_ino`；后台清理断言改为轮询等待生效；kemo graph 同步测试改为确定性失败注入。

## 文档结构

- 运行手册（agents.md）新增「全局知识库联动」引导契约与按场景引导索引：手册负责引导，`global_knowledge/` 专题文档是唯一权威正文，行为变更需三处同步（专题文档、引导条目、主索引关键词）。
- `provider-reliability.md` 补齐 Chat 兼容链路的净化、重试、降级与取消边界章节；`project-introduction.md` 新增 Provider 双模式说明；`configuration-reference.md` 标注 Chat 传输行为为代码内置、不提供配置项。

## 升级说明

- 从 1.2.6 升级无需迁移数据。Chat 模式用户会自动获得上述兼容性修复；Kemo 原生模式行为无变化。
