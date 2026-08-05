# kemo-agent 1.0.0 — Kemo Graph 外挂化 / 主生态闭环 / 进入稳定主版本

从 v0.10.0 到 1.0.0，kemo-agent 没有继续在既有的轨道上叠功能，而是做了一次关键的位置调整：知识图谱不再住进系统提示词里，它回到了框架之外，成为一座可以随时侧载的超级文档站。

0.10.0 把记忆、历史与运行状态搬进了 SQLite，解决了"状态落在哪里"的问题；1.0.0 则回答了另一个问题——外部项目应当以什么姿态与智能体协作。答案不是"替换"，而是"外挂"：框架只负责登记它、按需调用它，把构建与更新的节奏交还给用户。

这一版也意味着主生态首次补齐：从对话、历史、记忆和知识，到工具、技能、子代理、任务计划、定时调度、感知、拓展、外部消息，再到网页端、命令行和多模态交互，主要运行链路已经连接成完整闭环。

---

## 知识图谱不再是框架的器官，而是侧载的超级文档站

早期设计里，kemo-graph 被设想为知识库与记忆的"替换层"：系统提示词中为它保留六个子层的开关，配置里躺着四个替换开关，后台还有一个调度器每 60 秒同步、每 15 分钟整理。

这套设计在真实使用中暴露了问题：图谱构建很慢，构建期间连状态查询都可能失败；上百文件的记忆库对它来说是沉重负担；开启满血模式要同时拉起三个项目，少一个都会让启用了图谱的智能体陷入尴尬。

1.0.0 把这条路线彻底改掉了。

### 移除的部分

- `run/kemo_graph.py` 与系统提示词中的 `kemo_graph` 专用段一并删除，Prompt 段从 17 段收敛为 15 段；
- 四个配置开关（`kemo_graph_global_knowledge` / `kemo_graph_shared_knowledge` / `kemo_graph_user_knowledge` / `kemo_graph_temporary_memory`）从全局与用户配置中移除，不再有任何"替换、增强、缩减"语义；
- `KemoGraphScheduler`、cron 系统任务（`kemo_graph_sync` / `kemo_graph_ingest`）与自动维护脚本（`auto_sync` / `auto_ingest` / `auto_maintenance` / `sync_sources`）全部下线，知识库与四档记忆始终本地注入。

### 新增的部分

- **`global_expand/kemo_graph/` 全局拓展**：schema v2 注册表（`graph_config.json`）以 Library ID 登记文档库，支持 `service_default`（项目自带库）与 `portable`（管理员指定任意绝对路径）两种类型；路径必须存在、拒绝符号链接与嵌套；
- **`plugins/kemo_graph/` 引导插件**：只读本地注册表，生成规范的 `expand_call` 参数，自身不联网、不扫盘、不构建；
- 操作统一进入 `expand_call(scope="global", module="kemo_graph", ...)`：`status` / `scan` / `sync` / `ingest` / `query` / `upload` / `documents` / `jobs`，更新只能由用户主动要求；
- `data_update.py` 只读本地注册表生成目录摘要，不再每 5 秒 HTTP 轮询状态——构建期间提示词刷新失败的问题从根上消失；
- 访问控制复用普通模块权限（`expand.global_whitelist` + `plugins.whitelist`），Library 层另有 `allowed_users` / `admin_users` 双层 ACL；
- 文件遍历跳过 `kemo-graph-storage` 等运行时目录，更新系统负责分发拓展并保留历史部署中的图谱目录。

一句话：知识图谱不再是系统智能体框架里的重要分子，而是智能体框架侧载的超级文档站。

## 记忆的翻页方式

大型记忆库的列表曾经一次性加载整个层级，`memory_temporary_important` 巡检时可能把工具结果撑爆。

`memory_manage` 的 `list` 新增 `offset` 与 `compact` 参数：`compact=true` 省略时间与到期元数据，返回 `has_more` / `next_offset` / `total`，可以沿页码完整遍历。热画像巡检改为逐页读取，必须确认累计条数与 `total` 一致才会输出永久协调项——数据不完整时宁可保留旧视图，也不基于残缺数据清理记忆。

## 感知的频率第一次有了同一个钟

此前感知与拓展的刷新频率由 cron 局部解析，Web 页面又从另一处读取，两个数字可能各说各话。

1.0.0 新增框架级 `system_update_rate()`：`sense_update_rate` 与 `expand_update_rate` 有了唯一的校验来源。cron 系统任务间隔、Web 感知 API 的 `update_interval_seconds` 与页面显示，现在都听同一个钟；模块清单也不再重复声明调度频率字段。

## 更结实的运行时

- **历史记忆领取走 SQLite 窗口**：`claim_pending_memory` 改用 `claim_registry_record` 原子领取，旧的 JSON 索引路径退役；
- **存储去重初始化**：任务计划库加入进程级就绪缓存，cron 列表加入文件签名缓存，重复建库与重复磁盘扫描被消除；
- **拓展调用三参签名**：`execute(command, params, context)` 携带调用上下文，向后兼容旧签名；子任务失败保留结构化原因，不再被泛化错误吞掉；
- **实时读命令免去重**：`expand_call` 的 `configuration_status` / `query` / `refresh` / `status` 不参与工具结果重放——激活、同步或构建之后，你不会再看到一份陈旧的 Store 状态；
- **子代理请求内唯一 ID**：所有 Provider item 与工具调用在请求内重新分配唯一 ID（`rs_*` / `call_*` / `result_*`），网关跨迭代复用 ID 时不再触发协议校验失败。

## Web：附件有了缩略图

上传的图片附件会自动生成 320×240 缩略图用于消息卡片预览；附件卡片按媒体类型显示图标（图片 / 视频 / 音频 / 文件），缩略图加载失败时优雅回退。感知设置页按真实秒数显示"每 N 秒 / 分钟 / 小时"刷新频率。

---

## 从 v0.10.0 到 1.0.0

| 领域 | v0.10.0 | 1.0.0 |
|------|---------|-------|
| 知识图谱 | 六子层提示词替换边界 + 自动同步调度 | 外挂文档站：注册表 + 手动操作，无替换语义 |
| 图谱更新 | 框架每 60s 同步、每 900s 整理 | 只有用户主动要求才更新 |
| 图谱配置 | 4 个 `kemo_graph.*` 开关 | 配置移除，权限走 expand / plugins 白名单 |
| 记忆列表 | `limit` 截断一次性返回 | `offset` / `compact` 分页，`has_more` / `next_offset` / `total` |
| 感知频率 | cron 局部解析 + Web 另一处读取 | `system_update_rate` 框架级统一 |
| 历史记忆领取 | JSON 索引领取 | SQLite 窗口原子领取 |
| 拓展调用 | `execute(command, params)` | 三参 `context` 签名 + 结构化失败保留 |
| 工具结果去重 | 所有结果可重放 | 实时读命令豁免去重 |
| 子代理 ID | 仅 reasoning ID 唯一 | 全部 item 与工具调用请求内唯一 |
| 附件展示 | 无缩略图 | 自动缩略图 + 媒体类型图标 |

## 本次发布统计

以 v0.10.0 的发布基线到 1.0.0 为范围：

- Commit 数：14 个
- 变更文件：97 个
- 代码与文档变更：5,133 行新增、1,100 行删除
- 新增模块：`global_expand/kemo_graph/`（注册表 + 操作 + 同步 + 渲染）、`plugins/kemo_graph/`（引导插件）
- 移除模块：`run/kemo_graph.py`
- 新增全局知识文档：`kemo-graph-expand.md`
- 新增测试：`test_kemo_graph_expand.py`、`test_storage_polling.py`
- 主要涉及：`run/prompt.py`、`run/source_policy.py`、`run/expand_runtime.py`、`run/agent_runner.py`、`run/history_index.py`、`run/task_plan_store.py`、`run/cron_store.py`、`cron/scheduler.py`、`update/core.py`、`plugins/memory_manage/`、`web/services/files.py`、`web/frontend/src/pages/ChatPage.tsx`
- 版本变化：根版本、core、agents、plugins、web 全部更新至 `1.0.0`

## 验证

发布前已完成：

- Python 相关测试：688 passed，2 skipped，45 subtests passed
- 前端相关测试：22 个测试文件，170 passed
- 前端生产构建：通过

前端生产构建仍会给出若干产物超过 500 kB 的 Vite 体积警告；这不是构建失败，与 v0.10.0 的已知情况一致，后续可以单独评估更细粒度的代码拆分。

## 开始使用

```bash
cd kemo-agent
git pull
python update.py --module all
```

更新完成后，请完整重启 kemo-agent，使新的 Python 运行时与 Web 前端构建一起生效。

::: warning 升级前注意
1.0.0 移除了 `kemo_graph` 配置段与四个替换开关。旧配置中的残留字段会被忽略，不影响启动；如果你需要知识图谱能力，请在 `global_expand/kemo_graph/graph_config.json` 注册文档库并显式激活，更新由你主动发起。
:::

## 写在最后

0.10.0 让"发生过什么"有了一个不会撒谎的落点；1.0.0 则让"外部知识以什么姿态协作"有了一个不会越界的答案。

知识图谱终于不再假装自己是框架的一部分。它站在门外，等着被邀请——而智能体知道它在哪、装着什么、什么时候该去敲门。

从潮汐记忆出发，到这里，主生态第一次完整闭环。1.0.0 不是终点，而是一个稳定主版本的开始：接下来的版本，将聚焦边缘生态扩展、兼容性、性能与长期可靠性。

Happy coding 🎉
