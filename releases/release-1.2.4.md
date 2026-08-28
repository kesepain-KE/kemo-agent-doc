# kemo-agent 1.2.4 — 外部 Agent 桥接与调度解耦补丁

1.2.4 在 1.2.3 稳定性收口之后引入**外部 Agent 桥接框架**：让受信任、用户授权的 Expand 模块可以把外部独立运行的 Agent（如 `pi_coder` 等）以 `external:<scope>:<module>:<name>` 句柄注册为可调度子代理；同时把子代理调度队列从「后台串行」单一模型扩展为可承载框架自有作业的通用队列，并让同步调用等待不再取消存活的 worker 线程。核心目标是：外部 Agent 永不通过模型请求里的裸 URL 寻址，只由托管该 Agent 的 Expand 模块执行真实调用。

## 外部 Agent 桥接（run/agents/external.py，新增）

- **绑定发现**：`discover_external_agents(root, user)` 扫描 `global_expand/`、`shared_expand/`、`users/<user>/expand/` 中每个模块目录的 `agent_bridge.json`（schema_version=1，最大 256KB，最多 64 个代理）；模块必须 `open_control=true` 且通过当前用户主配置白名单。绑定句柄唯一：`external:<scope>:<module>:<name>`。
- **契约校验**：`agent_bridge.json` 只允许 `schema_version/agents` 顶层字段；每个代理项只允许 `name/description/command/input_schema/output_schema/timeout`。`name` 匹配 `^[A-Za-z][A-Za-z0-9_-]{0,63}$`、`command` 匹配 `^[A-Za-z][A-Za-z0-9_.:-]{0,127}$`、`timeout` 必须为 0~3600 秒正数、input/output schema 必须是受限 object JSON Schema（≤64KB）。畸形桥接文件只跳过该模块，不隐藏本地子代理、不破坏整个调度工具。
- **路径安全**：`_safe_scope_root()` 逐段拒绝 scope 根目录路径中的符号链接/目录联接；`resolve_expand(..., require_control=True)` 复用既有拓展白名单边界。
- **调用与结果校验**：`call_external_agent()` 先按 input_schema 校验载荷，再以 `invoke_expand()` 在既有隔离子进程通道中调用模块 `start_expand.py` 的 `execute()`，参数携带 `protocol=kemo-agent-external-agent-v1` 与 `agent/input` 结构；结果必须是 dict，`ok=false` 或 `status` 为 error/failed/failure 时拒绝，输出按 output_schema 校验后才返回。调用 timeout 上限 3600s。
- **错误脱敏**：所有失败经 `redact_diagnostic_text()` 脱敏，最多保留 400 字符，不泄露原始参数、凭据或内部路径。

## 子代理调度队列通用化（run/agents/queue.py）

- `AgentScheduler.submit_callable(agent, input_data, job, ...)` 新增：入队框架自有可调用作业（非 LLM 子代理），复用同一 `AgentTask` 状态机（queued/running/completed/failed/cancelled/timed_out/timed_out_running）、取消与事件合同；`serial=False` 不参与 background_serial 串行锁。
- **分离完成监听**：`_watch_detached_completion()` 在调用方等待超时（detach）后继续监听 worker future：自然完成 → 任务标记 `completed` + `metadata.completed_after_detach=true`；异常 → 按用户取消/超时运行/普通失败三态收敛；worker 已退出（process_terminated）才会从 `timed_out_running` 收敛为 `timed_out`。
- **终态保留与裁剪**：`_RETAINABLE_TERMINAL = {completed, failed, cancelled, timed_out}` 且错误明细无 `process_terminated=false` 时保留；`_MAX_RETAINED_TERMINAL_TASKS=256` 按 `finished_at` 裁剪；worker 空闲 `_WORKER_IDLE_SECONDS=300s` 退出并允许 `_ensure_worker_locked()` 后续按需重建。
- **结果快照**：`AgentTask.snapshot()` 对 `AgentRunResult` 深拷贝 `data/usage/model/metadata`，避免外部持有引用导致可变。

## subagent_dispatch 插件外部代理支持

- `action=list` 合并公开本地子代理与 `discover_external_agents()` 的外部绑定；`action=call` 识别 `external:` 句柄后直调 `call_external_agent()`，普通句柄仍走本地 AgentRunner。
- 同步等待 `_wait_for_task()` 改为轮询 deadline：等待超时只返回 `(False, snapshot)` **不再取消存活任务**，任务继续在后台执行；取消事件设置时才调用 `scheduler.cancel(task_id)`。`timeout` 默认 `agent_runtime.default_timeout`（600s），上限 3600s。
- 外部代理结果统一映射为 `{status, agent, source: "external", data, usage, model, metadata}`。

## 引擎与运行时接线

- `run/agents/__init__.py` 公开 `ExternalAgentError`、`call_external_agent`、`discover_external_agents`、`resolve_external_agent`。
- `AgentRunner` 工具循环与 `expand_runtime.invoke_expand()` 支持 `result_validator` 回调，用于在 Expand 发布 artifact 前校验外部代理结果。

## 文档与测试

- 新增 `global_knowledge/external-agent-bridge.md` 与 `global_knowledge/release-1.2.4-stability.md`；`data_structure.md`、`project-introduction.md`、`version-and-update-modules.md`、`subagent-creation.md`、`architecture-overview.md`、agents.md、readme / README_EN 一致更新到 1.2.4。
- 新增 `tests/agents/test_external_agent_bridge.py`；`test_agent_timeout_survival.py` 扩展分离完成监听与终态保留用例；`test_task_plan.py` 适配；前端新增外部代理展示与设置项（ChatPage/SettingsPage/ModulePages/AppShell 测试扩展）。

## 兼容边界

- `agent_bridge.json` 是可选文件：无桥接文件的模块不产生任何外部代理，既有子代理调度完全不变。
- 外部代理句柄必须 `external:<scope>:<module>:<name>` 精确匹配，模型无法用任意 URL 或路径寻址外部 Agent。
- 调用方等待超时不等于任务失败：任务继续后台执行，状态可再次查询（completed_after_detach）。
- 子代理数据格式、记忆、任务计划与用户配置契约不变；`timeout_survival_seconds` 语义与 1.2.3 一致。

## 验证

- release_check.py 7/7 PASS：test_kemo 90、backend_tests 998 + 5 skipped、template_contracts 10、python_compile、git_diff_check、frontend_tests 230、frontend_build。
