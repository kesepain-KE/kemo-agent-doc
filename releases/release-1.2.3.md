# kemo-agent 1.2.3 — 工具参数与后台进程边界稳定性补丁

1.2.3 是在 1.2.2 之后的稳定性收口补丁，聚焦工具调用参数安全、后台进程管理和长任务收敛边界，不新增用户配置字段。核心目标是：任何不完整工具参数都必须在执行前被拦截并走恢复链路；后台作业必须可管理、可查询、可安全取消且不泄露宿主机路径；对话轮次在取消、异常、缺失终态和参数重试路径上只归档一次正文与思考。

## Provider 工具参数执行前整批校验

- 新增 `provider/tool_arguments.py`：统一解析 Provider 工具参数，显式区分缺失、空字符串、显式空对象、非法 JSON、根节点非对象等状态；`MISSING` 哨兵替代 `or "{}"` 静默归一化，不再把「上游没给参数」伪装成合法空对象。
- 新增 `validate_tool_call_batch()`：工具名、arguments 类型、required 字段、additionalProperties、基础类型在进入执行循环前整体校验；同批出现任一非法调用时整批不执行，进入 `invalid_tool_arguments` 恢复链路，避免部分副作用。诊断只含名称、字段名、长度，不含原始参数值。
- 主智能体与子代理接入同一预校验链路：无效批次使用新 `request_id` 重试（`invalid_tool_arguments_retries`），失败时返回 `ProviderToolArgumentsError` 终态。
- Chat 与 Kemo 两种协议适配层统一使用 `parse_tool_arguments()`；流式工具参数分片追踪 `arguments_seen`，不再把缺失 arguments 当成合法空对象。
- Schema 校验加入递归深度、节点总数与数组项上限，防止深层或超大参数触发递归崩溃与无界 CPU 消耗。

## Provider 诊断安全加固

- 诊断契约支持更多敏感字段别名、前缀 JSON 错误、循环引用保护，并限制递归深度、节点数、集合项数与消息扫描长度。
- 网关适配层错误路径统一经 `safe_provider_body` / `safe_provider_message` 脱敏后才进入异常 body/message。
- 流式 `tool_call.completed` 事件在统一终态校验后才发布；并行调用按批次原子语义处理。

## Shell 受管理后台作业

- `shell` 插件升至 v1.4.0：`action=run/status/cancel` + `background=true` 创建受管理后台作业；保存返回的 `job_id`，由独立 Worker 在 `deadline_at` 强制执行截止时间。
- 身份安全：后台作业必须先确认进程创建时间才能持久取消/对账；取消前复核 PID 的进程名与启动时间，身份不确定时拒绝破坏性操作，防止 PID 复用误杀。
- 生命周期：日志文件无法写入时仍 drain stdout/stderr 避免子进程阻塞；公开状态只返回项目根相对路径；持久记录只保存命令摘要，原始请求读完即删；按用户/来源/对话空间隔离，有活动数与目录容量上限。
- `wait_for_condition` 升至 v1.1.0：新增 `job_exit` 条件直接等待受管理作业；`process_exit` 支持 `process_started_at`/`process_name` 身份核验，区分 `process_already_absent` / `process_exit` / `process_replaced`。

## 对话轮次幂等归档与重试预览

- 正文/思考延迟到 attempt 确认后再提交，取消、Provider 异常、缺失终态、参数重试路径统一 flush，避免同一轮跨 attempt 重复累加。
- 参数重试保留首 attempt 的预览文本与推理，重试输出与其拼接。

## 长任务孤立运行收敛

- 新增 `reconcile_orphaned_long_task()`：持久状态仍为 active 但对应 Run 已消失时，按宽限期收敛为 `cancelled` / `interrupted`；查询接口保持无副作用。
- Web 长任务状态查询结合活动 Run 租约判断存活，孤儿状态走收敛；用户取消时无匹配 Run 直接收敛孤儿状态。
- 前端 LongTaskBubble 支持 `paused` 状态展示与「结束长任务」按钮。

## Web 最终失败音效

- 在运行结束音效基础上新增 `failure_sound.*`：Windows 桌面网页端最终失败/取消时播放，上传校验音频 MIME 与大小（5MB），存储与安全边界与 completion_sound 一致；新增文件 API 与前端设置入口。

## Provider 输出解析有界重试与历史加固

- 主智能体与子代理对 Provider 输出解析失败、截断 JSON 与结构化输出错误引入最多 5 次有界重试；取消、认证、输入校验与确定性协议错误不重试；`context_manage` 专用 JSON 修复耗尽后不再被外层重试放大。
- 上下文压缩前的记忆提取结果在同一次子代理重试链路中复用，避免重复写盘；`ProviderError.retryable` 显式声明与缺省区分，`events.py` 新增 `retrying` 事件类型与非终态 `committed=false` 临时错误事件。
- 持久化 Provider 响应标识（`id` / `request_id` / `model`）脱敏并限长；历史轮次指标改用脱敏投影，工具结果孤儿调用由 durable 执行记录修复配对，防止诊断截断破坏历史结构。
- Web 前端识别 `retrying` 事件并回滚当前轮显示项，展示「重试中 N/M 次」提示与最终错误横幅；SSE 不再把临时失败当作终态或关闭长任务。

## 版本与文档

- 根、core / agents / plugins / web 组件统一 `1.2.2 → 1.2.3`；
- `.github/workflows/ci.yml` 新增 `stability-contracts` 稳定性合同作业；
- `global_expand` 运行时间戳与 `cron/task_cron_system` 系统任务时间戳刷新；
- 新增 `global_knowledge/release-1.2.3-stability.md`；readme / README_EN / agents.md / 全局知识文档（data_structure、project-introduction、provider-tool-call-safety、user-directory-skeleton、version-and-update-modules、plugin-development、release-1.2.2-stability）一致更新；
- 扩展测试：provider_tool_recovery / provider_protocol / 插件扩展与 wait_for_condition / core（long_task、process_utils、runtime_features）/ web_backend / 模板验收；前端新增 LongTaskBubble 测试与 AppShell / ChatPage / SettingsPage 测试扩展。

## 兼容边界

- Chat 协议固定思考档位不变；长任务、任务计划、记忆和用户配置的数据格式不变。
- 后台作业取消接口在无法确认进程身份时返回失败，是保护行为，不是静默强杀。
- 发布前必须运行项目 CI 与本地全量测试。

## 验证

发布前完成系统验收（release_check 7/7）：

- test_kemo：90 passed
- backend_tests：978 passed + 5 skipped
- template_contracts：10 passed
- Python 编译、Git 补丁检查通过
- 前端 Vitest：29 文件 / 229 passed；生产构建成功

## 开始使用

```bash
git pull origin main
```

升级后无需额外配置。若你依赖旧版 Shell 行为，注意 `shell` 工具新增了 `action`/`background` 参数并以 `job_id` 等待后台作业，外部进程等待建议同时提供 `process_started_at` 做身份核验。