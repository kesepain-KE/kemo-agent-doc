# v0.10.0 更新说明

`v0.10.0` 把记忆、历史对话与运行状态从 JSON 文件统一升级为每用户独立的 SQLite WAL 数据库，并加固 Provider 工具调用完整性边界。历史部分解决了会话增长后网页启动、会话列表和正文搜索随目录数量线性变慢的问题；记忆部分让四档碎片、加权证据与热画像来源进入单一权威存储。

## 历史表结构

- 会话卡片、活跃绑定、完整 archive、可裁剪 runtime、逐消息正文索引和后台任务状态统一进入 `users/<user>/history/history.sqlite3`。
- text、think、tool、items、data 仍保持清晰的逻辑分区，但在单个 SQLite 事务中提交，不再出现五文件部分写入。
- 历史正文搜索、token 统计和 Maintenance 不再遍历会话目录。
- 会话注册表缺失时从 archive 窗口表重建。

## 记忆 SQLite 存储

- 四档记忆以每用户 `users/<user>/improve/memory.sqlite3` 为唯一权威存储：`memory_fragments`（四档正文与生命周期）、`memory_weight_events`（数据库强制每日最多 +1）、`memory_operations`（批量提取幂等）、`memory_important_sources`（热画像来源与摘要）。
- 晋升、到期删除与语义融合都在单事务内完成；`filename` 保留 `.md` 后缀仅为逻辑身份与 UI 展示合同。
- 旧式 Markdown 碎片、分层 `data.json`、`storage.json` 与 `important_view.json` 不再读取、不会自动导入；`template/user/improve/` 只保留 `.gitkeep`。
- 旧的 `run/memory_migrate.py` 迁移模块随版本移除。

## 运行状态 SQLite

- 上下文摘要与外部消息幂等状态进入 `history.sqlite3`（`history_context_summaries`、`message_processed_messages`），摘要与窗口裁剪同一事务提交；外部消息领取使用 `BEGIN IMMEDIATE`，宿主启动时把遗留 `processing` 标记为 `failed`。
- 任务计划元数据、步骤与有序依赖进入 `users/<user>/task_plan/task_plans.sqlite3`（revision 乐观锁）。
- 外部消息模块健康与计数进入 `runtime/logs.sqlite3`（`message_route_state`）。

## Provider 工具调用完整性

- 工具参数只有完整解析为 JSON 对象才可执行；无效 JSON、非对象根节点与缺省参数按规则拒绝或兼容为 `{}`，原始参数只进入有界诊断（最多 500 字符），不能伪装成合法参数。
- `finish_reason` 参与终态判断：截断（`length`/`max_tokens`）、内容过滤、缺失调用或参数解析失败均记为 `incomplete`，不会执行该批工具。
- Kemo 原生链路中 `ToolCallItem.parse_error` 转为明确错误，`arguments_raw` 仅用于诊断；网络重试与业务终态分离。
- 任务计划执行按 `done.metadata.status` 区分 `completed/limited/cancelled/failed`，非成功终态暂停计划并保留真实 `agent_status`、`stop_reason` 与 `failure` 详情。

## Web 分页

- 网页启动默认只加载最新 50 条会话。
- 后端单页最多返回 100 条，并提供 `next_cursor`。
- 历史抽屉增加“加载更早对话”按钮。
- 标题、摘要、会话 ID 和消息正文查询直接走表。

## 不兼容变化

旧式 `history/data.json`、`history/<window>/*.json` 和 `history/temp/<window>/*.json` 不自动迁移，也不会与新数据库混读。本次升级适用于已经确认旧历史无需保留的环境；若仍需旧内容，应在升级前自行导出。

根版本、core 和 web 为 `0.10.0`；plugins 为 `0.8.3`；agents 保持 `0.8.1`。
