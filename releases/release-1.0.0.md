# v1.0.0 更新说明

`1.0.0` 是 kemo-agent 的稳定主版本发布。主生态首次补齐并进入稳定主版本：从对话、历史、记忆和知识，到工具、技能、子代理、任务计划、定时调度、感知、拓展、外部消息，再到网页端、命令行和多模态交互，主要运行链路已经连接成完整闭环。

## Kemo Graph 外挂化

知识图谱不再作为框架的检索增强层，改为**侧载的超级文档站**：

- 移除 `run/kemo_graph.py` 与系统提示词中的 `kemo_graph` 专用段（17 段收敛为 15 段），知识库与四档记忆不再有任何图谱替换、增强或缩减语义；
- 移除 `kemo_graph_global_knowledge` / `kemo_graph_shared_knowledge` / `kemo_graph_user_knowledge` / `kemo_graph_temporary_memory` 四个配置开关，全局与用户配置不再包含 `kemo_graph` 段；
- 移除 `KemoGraphScheduler`、cron 系统任务与自动维护脚本（auto_sync / auto_ingest / auto_maintenance / sync_sources），图谱更新只能由用户主动要求；
- 新增 `global_expand/kemo_graph/` 全局拓展：schema v2 注册表（`graph_config.json`）、Library 模型（`service_default` / `portable`）、绝对路径校验、状态/扫描/同步/构建/查询操作，`data_update.py` 只读本地注册表、不再每 5 秒 HTTP 轮询；
- 新增 `plugins/kemo_graph/` 引导插件：只读注册表生成规范 `expand_call` 参数；
- 访问控制复用普通模块权限：`expand.global_whitelist` + `plugins.whitelist`，Library 层另有 `allowed_users` / `admin_users` ACL；
- 更新系统新增 Kemo Graph 拓展分发，并保留历史部署中的 `kemo-graph-storage/` 目录；
- 文件遍历跳过 `kemo-graph-storage` 等运行时目录，Web 知识库枚举与 CRUD 始终屏蔽派生数据。

## 记忆管理分页

- `memory_manage` 列表新增 `offset` / `compact` 参数，返回 `has_more` / `next_offset` / `total`；
- 热画像巡检按页遍历完整层级，不再一次性加载大型记忆库，避免工具结果超限。

## 感知刷新频率框架级统一

- 新增 `system_update_rate` 统一校验感知与拓展刷新频率；
- Web 感知 API 返回 `update_interval_seconds`，页面显示与真实系统任务共用同一频率来源；
- 模块清单不再重复声明调度频率字段。

## 运行时与存储优化

- 历史记忆领取走 SQLite 窗口原子领取（`claim_registry_record`）；
- 任务计划与 cron 列表加入进程级就绪/签名缓存，减少重复建库与磁盘扫描；
- 拓展调用支持 `execute(command, params, context)` 三参签名并保留结构化子失败原因；
- `expand_call` 的实时读命令（status / query / refresh / configuration_status）不参与工具结果去重重放，避免展示陈旧状态；
- 子代理请求内所有 Provider item 与工具调用分配请求唯一 ID，避免网关跨迭代 ID 冲突。

## Web 与文件服务

- 上传图片附件自动生成缩略图预览；
- 消息附件卡片支持媒体类型图标与缩略图失败回退；
- 感知设置页按秒数显示刷新频率。

## 版本

- 根版本升级至 `1.0.0`，core / agents / plugins / web 四组件同步；
- 后续版本将以边缘生态扩展、兼容性、性能和长期可靠性优化为主。
