# 全局配置

全局默认值位于 `config/global_config.json`。除用户专属段外，用户配置会在其上进行对象深合并。

## 顶层配置段

| 字段 | 类型 | 默认值/摘要 | 说明 |
|---|---|---|---|
| `schema_version` | integer | `1` | 配置结构版本 |
| `provider_runtime` | object | `10` 个并发 | 全进程 Provider 并发与等待超时 |
| `tools` | object | 启用，超时 240 秒 | 工具循环与重复调用保护 |
| `history` | object | 最近完整 3 轮 | 历史保留和连续失败阈值 |
| `history_summary` | object | 5 秒轮询，最多重试 5 次 | 已关闭会话的后台标题与摘要任务 |
| `prompt` | object | 多段字符预算 | PromptBundle 截断与注入模式 |
| `kemo_graph` | object | 全部关闭 | 图谱替换开关 |
| `memory` | object | schema v3 | 记忆提取、注入和档位规则 |
| `agent_runtime` | object | 队列 50，超时 600 秒 | 子代理运行时 |
| `task_plan` | object | 最多 20 步 | 任务计划全局限制 |
| `cron` | object | 启用，30 秒轮询 | 调度与拥塞退避 |
| `task_cron_system` | object | 5 秒刷新 | 感知/拓展刷新与单模块超时 |
| `runtime_host` | object | 后台调度启用 | RuntimeHost 功能开关 |
| `message` | object | 8 工作线程 + 20 排队 | 外部消息容量 |
| `web` | object | 3 运行 + 5 等待 | 单用户 Web Chat 反压 |
| `agents` | object | 最多 80 轮 | 上下文和维护策略 |

## 工具与历史

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---:|---|
| `tools.enabled` | boolean | `true` | 是否向 Provider 提供工具 |
| `tools.timeout` | integer | `240` | 单次工具执行超时（秒） |
| `tools.max_iterations` | integer | `80` | 一轮 Run 的 Provider 迭代上限 |
| `tools.consecutive_identical_call_limit` | integer | `8` | 相同工具和参数的连续调用上限 |
| `history.recent_full_rounds` | integer | `3` | 摘要时保护的最近完整轮数 |
| `history.consecutive_tool_fail_limit` | integer | `5` | 同一工具连续失败后的临时移除阈值 |

## 运行容量

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---:|---|
| `provider_runtime.max_concurrent_requests` | integer | `10` | Web、消息、Cron、维护和子代理共享的 Provider 槽位 |
| `provider_runtime.request_semaphore_timeout` | number | `300` | 等待槽位超时（秒） |
| `web.max_concurrent_chats` | integer | `3` | 单用户并发 Run |
| `web.max_pending_chats` | integer | `5` | 单用户等待区大小 |
| `web.pending_chat_timeout` | number | `30` | 等待区超时（秒） |
| `message.max_workers` | integer | `8` | 消息工作线程数 |
| `message.max_queued_messages` | integer | `20` | 消息排队上限，`0` 表示无界兼容模式 |

## 上下文

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---:|---|
| `agents.conserved_rounds` | integer | `3` | 保留完整工具/思考日志的最近轮数 |
| `agents.max_rounds` | integer | `80` | 临时上下文工作区最大轮数 |
| `agents.rounds_after_compression` | integer | `20` | 压缩后保留轮数 |
| `agents.token_limit` | integer | `1000000` | Token 总上限 |
| `agents.token_compression_ratio` | number | `0.3` | 输入预算比例 |
| `agents.important_memory_review_hours` | number | `3` | 临时重要记忆巡检间隔 |
| `agents.daily_memory_review_time` | string | `"02:00"` | 每日记忆整理时间 |

`context_manage` 的摘要输入会合并正文、reasoning/think 与工具结论，核心运行时为每次摘要请求提供最多 20000 tokens 的输出预算。`important_memory_review_hours` 和 `daily_memory_review_time` 是宿主级调度字段，只能从全局配置创建统一系统时间表，不能在用户配置中建立不同的用户级时间表。

## PromptBundle

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---:|---|
| `prompt.char_limits.task_plan` | integer | `6000` | 任务计划段字符上限 |
| `prompt.char_limits.perception` | integer | `8000` | 感知段字符上限 |
| `prompt.char_limits.expand_data` | integer | `10000` | 拓展数据段字符上限 |
| `prompt.char_limits.skill_prompts` | integer | `8000` | 技能描述字符上限 |
| `prompt.char_limits.plugin_prompts` | integer | `10000` | 插件描述字符上限 |
| `prompt.injection_mode.permanent_memory` | string | `"full"` | 永久记忆注入模式 |
| `prompt.injection_mode.important_memory` | string | `"full"` | 临时重要记忆注入模式 |
| `prompt.injection_mode.temporary_seven_days` | string | `"full"` | 七天记忆注入模式 |
| `prompt.injection_mode.temporary_one_month` | string | `"full"` | 一月记忆注入模式 |
| `prompt.injection_mode.temporary_half_year` | string | `"full"` | 半年记忆注入模式 |
| `prompt.injection_mode.knowledge_index` | string | `"full"` | 知识索引注入模式 |
| `prompt.injection_mode.task_plan` | string | `"full"` | 任务计划注入模式 |
| `prompt.injection_mode.expand_data` | string | `"full"` | 拓展数据注入模式 |
| `prompt.injection_mode.perception` | string | `"full"` | 感知注入模式 |

## 记忆

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---:|---|
| `memory.storage_schema_version` | integer | `3` | 文件型记忆结构版本 |
| `memory.extraction_mode` | string | `"compression_only"` | `disabled`、`compression_only`、`background` 或 `on_commit` |
| `memory.recovery_max_rounds_per_scan` | integer | `10` | 单次恢复扫描最多补处理的轮数，运行时范围 1–20 |
| `memory.extraction_batch_rounds` | integer | `5` | 一次模型分析最多处理的连续轮数，运行时范围 1–20 |
| `memory.extraction_max_candidates_per_batch` | integer | `10` | 单批最多保留的候选记忆数，运行时硬上限 40 |
| `memory.temporary_injection_limits.half_year` | integer | `100` | 半年层单次注入文件数上限 |
| `memory.temporary_injection_limits.one_month` | integer | `200` | 一月层单次注入文件数上限 |
| `memory.temporary_injection_limits.seven_days` | integer | `300` | 七天层单次注入文件数上限 |
| `memory.important_memory_max_chars` | integer | `5000` | 临时重要记忆字符上限 |
| `memory.history_read_enabled` | boolean | `true` | 是否允许历史读取能力 |
| `memory.tiers.seven_days.days` | integer | `7` | 七天层固定期限 |
| `memory.tiers.seven_days.upgrade_threshold` | integer | `3` | 七天层晋级阈值 |
| `memory.tiers.seven_days.next` | string | `"one_month"` | 下一层 |
| `memory.tiers.one_month.days` | integer | `30` | 一月层固定期限 |
| `memory.tiers.one_month.upgrade_threshold` | integer | `10` | 一月层晋级阈值 |
| `memory.tiers.one_month.next` | string | `"half_year"` | 下一层 |
| `memory.tiers.half_year.days` | integer | `180` | 半年层固定期限 |
| `memory.tiers.half_year.upgrade_threshold` | integer | `60` | 半年层晋级阈值 |
| `memory.tiers.half_year.next` | null | `null` | 达标后进入永久层 |

## 图谱替换

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---:|---|
| `kemo_graph.kemo_graph_global_knowledge` | boolean | `false` | 替换全局知识索引 |
| `kemo_graph.kemo_graph_shared_knowledge` | boolean | `false` | 替换共享知识索引 |
| `kemo_graph.kemo_graph_user_knowledge` | boolean | `false` | 替换用户知识索引 |
| `kemo_graph.kemo_graph_temporary_memory` | boolean | `false` | 替换半年、一月和七天记忆 |

## 调度与后台运行

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---:|---|
| `agent_runtime.queue_maxsize` | integer | `50` | 单用户子代理队列上限，`0` 表示无界 |
| `agent_runtime.default_timeout` | integer | `600` | 子代理整体执行期限（秒）；到期后请求协作式取消 |
| `task_plan.max_steps` | integer | `20` | 计划最大步骤数 |
| `cron.enabled` | boolean | `true` | 启用 Cron 调度 |
| `cron.poll_interval` | integer | `30` | 常规轮询间隔（秒） |
| `cron.avoid_congestion` | boolean | `true` | Provider 拥塞时推迟普通任务 |
| `cron.congestion_threshold_ratio` | number | `0.2` | 判定拥塞的可用槽位比例 |
| `task_cron_system.sense_update_rate` | integer | `5` | 感知刷新间隔（秒） |
| `task_cron_system.expand_update_rate` | integer | `5` | 拓展刷新间隔（秒） |
| `task_cron_system.module_update_timeout` | integer | `120` | 单模块刷新子进程超时（秒） |
| `runtime_host.enable_background_scheduler` | boolean | `true` | 启动统一后台调度器 |

## 历史摘要后台任务

历史摘要使用独立的持久后台调度，不占用 Web 请求线程，也不进入子代理内存队列。会话保存后即使关闭网页，只要 RuntimeHost 仍在运行，摘要任务就会继续处理。

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---:|---|
| `history_summary.poll_interval` | number | `5` | 持久摘要任务扫描间隔（秒） |
| `history_summary.max_jobs_per_cycle` | integer | `1` | 每轮最多领取的摘要任务数 |
| `history_summary.max_attempts` | integer | `5` | 自动尝试上限；耗尽后等待用户手动重试 |
| `history_summary.retry_delays_seconds` | integer[] | `[30, 120, 600, 1800]` | 各次失败后的退避时间，超出数组后沿用最后一项 |

Provider 拥塞或服务停止只会推迟任务，不消耗失败次数。长会话按块处理并保存断点，重启或失败后从最近成功位置继续。

每个历史摘要块按估算 Token 控制在 24000 以内，单轮内容本身过大时继续拆分。模型调用最大输出预算为 10000 Token，并优先使用结构化输出工具；非标准文本经过恢复和本地兜底后仍可完成卡片标题与摘要。

::: warning 配置契约
不要加入未知字段。当前 `provider`、`agent_models`、`multimodal_models`、`multimodal_routing`、`knowledge`、`skills`、`expand`、`perception` 和 `plugins` 属于用户专属配置，不应依赖全局兜底。
:::
