# kemo-graph：Kemo 生态的图谱与检索项目

> 当前版本：v1.4.0 — 文档项目化组织（项目文件夹、重命名、批量移动、指定项目上传、回收站同路径安全覆盖）、独立构建状态页、真实检索阶段遥测、按分类查看运行日志与有界读取缓存（v1.3.1 起导入快照哈希校验（`expected_origin_hash` 与 `IMPORT_SOURCE_CHANGED`）、多编码文本识别增强、网页端知识文档 Markdown/KaTeX/Mermaid 预览渲染；v1.3.0 起可调图谱抽取与稳健召回、KnowledgeBaseService 服务化、同版本强制更新统一、本地 markitdown 文档归一化；v1.2.1 起 Store multipart 文件上传导入与同版本强制更新；v1.2.0 起外部权威来源同步协议、Office/EPUB/RTF 与结构化数据转换、GPU 优先图谱渲染；v1.1.1 起语义叶子规范化与检索层级族折叠；v1.1.0 起查询规划、语义分层切分、可移植知识库与应用更新系统）。

[kemo-graph](https://github.com/kesepain-KE/kemo-graph) 是 Kemo 生态中面向资料沉淀、来源追溯与智能体检索的独立项目。

它不替代 kemo-agent 的对话、任务、记忆和工具运行时；它专门处理另一类长期问题：当 PDF、DOCX、网页、表格、笔记和项目资料不断积累时，如何让它们变成可维护、可查询、能回到原文依据的知识结构。

## 它在生态中的位置

```text
用户、文件与任务
  ↓
kemo-agent
  → 理解意图、管理记忆与任务，决定何时需要外部知识
  ↓  调用 /api/v1
kemo-graph
  → 导入资料、构建图谱与向量索引，返回关系和原文证据
  ↓  Kemo Protocol
kemo-adapter-api
  → 为 LLM、Embedding、Rerank 提供统一模型协议与 Provider 路由
```

三个项目可以独立部署，也可以协作：

- **kemo-agent** 是面向用户的 Agent Runtime，负责对话、计划、工具、记忆和编排；
- **kemo-graph** 是外部知识服务，负责资料的 Graph、RAG、来源和生命周期维护；
- **kemo-adapter-api** 是模型网关，负责把生态组件的 Kemo 请求路由到已授权的模型 Provider 或本地模型。

可以把它们理解为：

> kemo-agent 负责理解用户；kemo-graph 负责理解资料；kemo-adapter-api 负责连接模型能力。

## kemo-graph 解决什么问题

普通文件夹能保存资料，关键词搜索能找到字面匹配，向量检索能找到语义相近的段落；但长期资料库还需要回答：

- 一个概念与哪些概念有关？
- 某条关系由哪些文档支持？
- 检索结果具体来自哪份原文？
- 文档修改或删除后，哪些图谱和向量数据需要更新？
- 多份资料之间形成了哪些知识群？

kemo-graph 将这些问题收敛到同一条可追溯链路：

```text
原始文件
  → 转换为正式 Markdown
  → source_id + 内容哈希
  ├─ Graph：节点、关系、来源证据
  └─ RAG：文本切片、Embedding、FAISS 索引
```

Markdown 是本地事实来源；图谱数据库、向量数据库和 FAISS 索引是可以随内容变化增量更新或重建的派生数据。

## 主要能力

### 多格式文档导入

支持：

```text
PDF · Word · PowerPoint · Excel · EPUB · RTF · 网页 · 文本 · 表格 · 结构化数据
（.pdf · .docx · .pptx · .xlsx/.xlsm/.xls · .epub · .rtf · .md · .txt · .log
 · .html · .rst · .csv · .tsv · .json/.jsonl/.ndjson · .yaml/.yml · .xml）
```

v1.2.0 起自动识别 UTF-8、UTF-16、GB18030、Big5 等常见文本编码；CSV 同时检测编码与分隔符；DOCX 保留段落与表格顺序，电子表格按工作表输出，PPTX 按幻灯片输出，HTML 先清理脚本与导航噪声；PDF 只提取已有文本层，扫描版 PDF 不做 OCR，会明确提示交由主智能体预处理。

### 高速结构化图谱构建

图谱构建模型通过 Kemo 协议调用 LLM，小文档单次请求、大文档按标题边界分段后并行构建。模型只返回 `local_id / keyword / summary / aliases / tags / evidence` 和局部实体关系；数据库 UUID、来源绑定和哈希均由本地系统控制。

配置分离为 `graph_extract.md`（构建）和 `graph_organizer.md`（整理）两个独立提示词，构建追求速度与事实保真，整理阶段再处理同义合并。

每篇文档共用一个数据库事务：模型、工具或校验过程失败时，整篇文档的图谱变更会整体回滚。

### Ingestor 子包架构（v1.0.0）

`core/ingestor/` 从单一约 2400 行文件拆分为七个模块的子包：

| 模块 | 职责 |
|------|------|
| `__init__.py` | 薄协调层与公开 API |
| `_scan.py` | 扫描 sources 状态与哈希差异 |
| `_graph_build.py` | 图谱构建（结构化/工具调用） |
| `_rag_build.py` | RAG 切片与多层向量构建 |
| `_delete.py` | 文档删除与级联清理 |
| `_file_map.py` | Markdown ↔ 原始文件映射 |
| `_utils.py` | 公共工具与锁管理 |

### 图谱整理与知识库重建

- **图谱整理**（`graph_organizer.py`）：LLM 辅助扫描重叠节点候选，合并同义实体、迁移来源证据、清理自环投影，在单个 SQLite 事务中完成。未调用 `finish` 则全部回滚。
- **变化文档重建**（`rebuilder.py`）：只处理哈希已变化的文档，不重复消费模型额度。
- **全项目影子重建**：在临时影子目录验证全部来源、Graph、Embedding 和 FAISS 一致性后，原子切换正式知识库，旧库保留为时间戳备份。

### 语义分层切分与查询规划（v1.1.0）

- **语义分层切分**（`chunker.py`）：默认 `chunking_mode=semantic_hierarchical`，先由 LLM 选出保真语义边界，再确定性组合出 small / medium / large 三个粒度，避免固定 token 窗口切碎概念与函数体。
- **查询规划**（`query_planner.py`）：LLM 受控拆分问题意图，生成同义改写、下位/相关/上位扩展与子问题；以原始查询向量为锚点过滤语义漂移；任何模型故障都安全退化为原始查询。
- **RAG 多路召回**（`rag_engine.py`）：`PreparedQuery` 把查询规划与一次批量向量化绑定，供多个 FAISS 索引复用；扩展候选池、RRF 融合多路分数、低置信度命中救援补位。
- **实体向量**（`entity_embeddings`）：将节点描述向量化，支持实体级语义检索。
- **群组向量**（`community_embeddings`）：将知识群总结向量化，支持全局知识库概览检索。
- **辅助向量一致性**：通过 `summary_hash` 与权威数据绑定，图谱整理后自动同步。

### 语义叶子与检索候选（v1.1.1）

- **语义叶子规范化**（`chunker.py`）：LLM 选出的语义边界作为叶子骨架，服务端按 `chunk_small_size` 目标绑定 small 粒度并合并标题级碎片，避免标题或单行段落成为独立 Embedding。
- **层级族折叠**（`rag_engine.py`）：Rerank 前每个层级族只保留一个精确代表，large 块仅作为父上下文可用；Rerank 与词法匹配改以父级上下文内容参与打分。
- **答案上下文展开**：`/query/answer` 与 Web 检索页同时返回父级上下文与精确命中片段，明确区分展开上下文与真实命中。

### 外部权威来源同步（v1.2.0）

`core/source_sync.py` 提供面向 kemo-agent 等上游权威存储的稳定同步协议：按 `source_uri` 幂等同步外部表记录，维护派生 Markdown、Graph 与 RAG，支持 `deleted=true` tombstone 与删除后恢复复用同一 `relative_path`/`source_id`。

- 来源身份与版本元数据（`source_uri`、`source_type`、`source_revision`、`source_updated_at`、`source_metadata_json`、`external_content_hash`、`last_synced_at`）通过幂等迁移写入 `sources.db`，并建立唯一索引。
- 幂等与冲突规则：正文与版本均相同为 `unchanged`；仅版本/元数据变化为 `metadata_updated` 不重建；正文变化且版本有效为 `updated`；版本倒退或冲突不覆盖；`deleted=true` 删除派生数据并级联 Graph/RAG；tombstone 不进入回收站。
- 新增 Store scope `memory.user`（每用户统一记忆 Store），旧 memory scope 保留兼容。
- 访问方式：`POST /api/v1/stores/sources/sync|status|delete`；CLI `source-sync` / `source-status` / `source-delete`（需 `--store-root`）。

### 导入快照校验（v1.3.1）

`POST /api/v1/stores/import-path` 支持可选 `expected_origin_hash`：调用方传入自己刚扫描得到的源文件 SHA-256，服务端先把源文件捕获为私有临时快照，并用同一快照完成哈希、转换与转换后复核。源文件在导入期间变化或哈希不一致时返回 `409 IMPORT_SOURCE_CHANGED`，不会注册文档或提交不一致的 Markdown。并发导入使用独立临时文件，失败时恢复 Markdown 与 file map 原状；重复导入保持原绝对路径来源身份，不无故更换 `source_id`。kemo-agent 1.2.6 起，外部来源同步侧默认发送该校验值，实现端到端原子一致。

同版本还增强了 Big5、GB18030、Shift-JIS、CP1250/1252 等多编码文本识别（本地 markitdown 归一化层），并新增网页端知识文档预览渲染：GFM、KaTeX 数学公式、按需加载的 Mermaid 图表、Obsidian 双链/Callout 安全占位与 frontmatter 识别，默认不执行原文档 HTML 与脚本；HTTP API 的 `content` 字段始终返回规范 Markdown 原文，不转换为 HTML。

kemo-graph 不直接写上游 SQLite；派生 Markdown 可删除、可重建，上游表才是事实来源。

### 文档项目化组织（v1.4.0）

文档管理支持项目文件夹：可以新建项目、把文档上传到指定项目、单篇重命名与移动、批量移动到目标项目，也可以只清空某个项目的文档。`core/document_organization.py` 只改变物理路径，不改写正文；移动与改名保留来源身份、正文哈希及既有 Graph/RAG 索引，后续扫描不会把已整理文档识别成新来源或已删除来源。项目组织与导入、整理共用同一把知识库写锁。

同版本起，回收站里的同路径副本允许安全覆盖：先备份旧副本，新文件与元数据写入成功后再清理备份；失败时回滚活动文件与回收站副本，不会留下「记录仍是活动状态、文件已被移走」的中间态。归档整理接口另外提供 `retry_failed`，可对先前失败并跳过的来源重试。

### 检索阶段遥测（v1.4.0）

`core/query_progress.py` 在请求上下文中记录真实发生的检索阶段：查询规划、查询向量化、图谱命中、向量召回、关键词召回、切片聚合、重排序与回答生成，并区分缓存命中与 LLM 规划回退。客户端在 `POST /api/v1/query/*` 请求头携带 `x-kemo-progress-id` 后，可通过 `GET /api/v1/query/progress/{progress_id}` 只读轮询。未绑定进度上下文时（CLI 与既有调用）钩子不记录任何数据，原有响应格式保持不变；进度是进程内短期状态，重启即清空，不持久化查询正文或检索结果。

### 分类运行日志与读取缓存（v1.4.0）

`GET /api/v1/system/logs` 按 `category=terminal|query|internal` 与 `date` 读取已知每日日志，只接受固定类别与日期格式，不接收任意路径；输出统一经过凭据与 ANSI 转义脱敏。终端日志由 `core/terminal_logging.py` 镜像 Python 与 Uvicorn 记录，不重定向进程标准流，配置变更以「文件修订号」为真相来源，运行中修改日志目录或级别即可生效。

`core/read_cache.py` 是有界进程内读取缓存：以文件修订号（inode、大小、纳秒时间戳）判定变化，缓存文档状态、知识库指纹、查询规划提示词哈希、配置文本与日志读取结果，并合并同一键的并发读取；不缓存数据库连接、模型客户端等可变对象。持久化搜索结果缓存仍由 `core/search_cache.py` 负责，其状态哈希与并发生成锁在 v1.4.0 一并接入该缓存，用完的锁会被回收。

### 可移植知识库（v1.1.0）

`portable_store.py` 支持在任意绝对知识位置建立独立 Store，固定目录名为 `kemo-graph-storage`：每个 Store 拥有自己的 manifest、sources.db、Graph、RAG、FAISS 与搜索缓存。跨位置联合查询（`query-federated`）不合并数据库，只在内存中融合带 Store 身份的结果，单 Store 故障隔离。路径必须绝对且不能含 `..`，可用 `portable_stores.allowed_roots` 收紧访问边界。

### 应用更新与重启（v1.1.0）

`update/` 包 + 根入口 `update.py` 从 GitHub `main/version.json` 按 SemVer 检查并安装更新；`.env`、`config/config.json`、知识库数据、外部文档与日志不会被覆盖。`restart.py` 让旧 FastAPI 进程优雅退出后由守护器启动全新解释器；Web 系统配置页也提供检查更新、应用更新与重启服务入口。

### 搜索缓存

`search_cache.py` 提供跨 CLI、FastAPI 与 Web 共享的 SQLite 持久化缓存。以知识库状态哈希判定过期，自动按上限修剪。同进程相同查询的并发调用自动合并。v1.2.0 起 `config/config.json` 可配置 `search_cache_enabled`、`search_cache_max_entries`、`search_cache_max_bytes`。

### 图谱、RAG 与混合查询

| 模式 | 适用问题 |
|---|---|
| 图谱查询 | 概念之间的关系、关系扩展和知识群 |
| RAG 查询 | 语义上最接近问题的原文段落，含实体/群组向量检索 |
| 混合查询 | 使用图谱命中概念增强相关切片后，再进行向量召回与重排序 |
| 检索问答（v1.1.0） | 混合检索后只依据只读检索证据生成带来源说明的回答 |

混合查询会分别返回图谱结构和原文证据，不把它们混成无法追溯的一段文本。
v1.1.0 起查询链路先经过查询规划（受控扩展 + 语义漂移过滤），再进入多路召回。

## 如何与 kemo-agent 协作

kemo-agent 1.0.0 起把 kemo-graph 定位为**侧载的超级文档站**（外挂模式）：kemo-graph 项目本身提供文档库、上传、导入与检索能力；kemo-agent 通过全局拓展接入，只暴露注册表摘要并按需操作。

- `global_expand/kemo_graph/` 注册文档库（`graph_config.json`，schema v2，Library ID + 绝对路径），执行状态、扫描、同步、构建和查询；
- `plugins/kemo_graph/` 引导插件只读本地注册表，生成规范 `expand_call` 参数；
- 不替换、不增强、不缩减 kemo-agent 的知识库或记忆；无专用 Prompt 段；无后台自动同步任务，更新必须由用户主动要求。

真实操作统一进入：

```text
expand_call(scope="global", module="kemo_graph", command=<operation>, params={...})
```

核心操作：

```text
configuration_status / libraries   # 查看注册表（本地只读）
status                             # 手动检查服务和选定库（联网只读）
scan → 用户确认 → sync → ingest    # 更新流程（sync 不自动 ingest，删除默认不传播）
query(mode=hybrid)                 # 检索；普通问答不自动查询
```

kemo-graph 服务端契约与 v1.4.0 保持一致：

```text
GET  /api/v1/status
POST /api/v1/query/graph
POST /api/v1/query/rag
POST /api/v1/query/hybrid
POST /api/v1/query/answer          # v1.1.0：混合检索问答
POST /api/v1/import?ingest=true|false      # v1.4.0：可用 project 指定目标项目
POST /api/v1/ingest                        # v1.4.0：可用 retry_failed 重试失败来源
GET  /api/v1/documents                     # v1.4.0：支持 project / search / graph_status / rag_status / include_summary
PUT  /api/v1/documents/{source_id}/content   # v1.1.0：文档内容编辑
POST /api/v1/documents/delete-batch          # v1.1.0：批量删除
DELETE /api/v1/documents?confirm=delete-all  # v1.4.0：可用 project 只清空指定项目
GET  /api/v1/projects                        # v1.4.0：项目文件夹列表
POST /api/v1/projects                        # v1.4.0：新建项目
PATCH /api/v1/documents/{source_id}/location # v1.4.0：文档重命名与移动
POST /api/v1/documents/move-batch            # v1.4.0：批量移动到项目
GET  /api/v1/query/progress/{progress_id}    # v1.4.0：检索进度只读轮询
GET  /api/v1/system/logs                     # v1.4.0：分类运行日志（category / date / limit）
GET  /api/v1/nodes/{node_id}                 # v1.1.0：节点详情
DELETE /api/v1/nodes/{node_id}
GET  /api/v1/relations/{edge_id}             # v1.1.0：关系详情
DELETE /api/v1/relations/{edge_id}           # v1.1.0：关系删除
GET  /api/v1/graph
POST /api/v1/jobs/organize-graph
POST /api/v1/jobs/rebuild-knowledge-base
POST /api/v1/jobs/rebuild-all
POST /api/v1/jobs/summarize
POST /api/v1/jobs/cleanup-recycle
GET  /api/v1/jobs?limit=100
GET  /api/v1/jobs/{job_id}
GET  /api/v1/search/cache
DELETE /api/v1/search/cache?stale_only=true
GET  /api/v1/update/status                   # v1.1.0：更新状态
POST /api/v1/update/check                    # v1.1.0：检查更新
POST /api/v1/update/apply                    # v1.1.0：应用更新
/api/v1/stores/*                             # v1.1.0：可移植 Store 管理
POST /api/v1/stores/import                   # v1.2.1：multipart 文件上传导入
POST /api/v1/stores/import-path              # v1.3.1：路径导入支持 expected_origin_hash 快照校验
POST /api/v1/stores/sources/sync             # v1.2.0：同步外部权威表记录
POST /api/v1/stores/sources/status           # v1.2.0：来源同步状态分页
POST /api/v1/stores/sources/delete           # v1.2.0：按稳定 URI 删除外部派生数据
```

推荐的调用路径：

```text
用户明确要求查询/核对资料
  → 查看 configuration_status / libraries
  → 调用 query(mode=hybrid)
  → 获得概念关系、原文片段与来源
  → 将结果用于回答或后续工具决策
```

完整 API 契约见 [kemo-graph api.md](https://github.com/kesepain-KE/kemo-graph/blob/main/api.md)；上方调用路径说明了 kemo-agent 在任务中使用它的边界。

## 更新与同版本强制更新（v1.2.1）

kemo-graph 提供 `python update.py` 根入口与 Web 系统配置页的更新入口：按 GitHub `main/version.json` 的 SemVer 检查更新，自动安装仅支持 Git clone，且程序文件必须没有未提交修改（`.env`、`config/config.json`、知识库数据、外部文档、日志与输出目录不会被覆盖）。

v1.2.1 起新增**同版本强制更新**：本地与远端版本相同时，`update.py` 会交互询问「是否强制重新执行更新？[y/N]」，确认后走修复模式（备份 → 强制同步 → 依赖安装 → 前端构建）；检查结果新增 `force_update_available` / `can_force_apply` 字段。适用于「版本相同但怀疑程序文件损坏、或本地缺少远端最近提交」的场景。

v1.3.0 起，同版本强制更新从 `update.py`、CLI、Web 与本地 HTTP API 一致可用，支持 `force` 传播，并在合并后依赖/构建失败时安全回滚。该版本同时带来：可调图谱抽取（默认 `large` 粗粒度，支持 `small`/`medium`/`large` 与实体关系预算）、检索的查询扩展与 FAISS+精确词面兜底、`KnowledgeBaseService` 文档/图谱/检索/维护领域服务化，以及本地 `markitdown` 文档归一化层（`python -m markitdown` / `convert.py` / `convert.cmd`）。

v1.3.1 继续领域化拆分（`core/knowledge_*`、`core/rag_*`、`core/faiss_index.py` 与 `api/store_routes.py`），公开契约不变；导入快照校验、多编码识别增强与网页端 Markdown/KaTeX/Mermaid 预览渲染一并落地。

v1.4.0 沿用同一更新流程，并把应用版本统一为 1.4.0：`version.json`、前端 `package.json` 与锁文件、markitdown 包元数据和更新记录同步；Kemo 1.0、`/api/v1` 与存储格式版本不随应用版本改号。更新源码、安装依赖、构建前端后重启服务即可，不必仅为版本升级清空或重建现有知识库；正文或抽取设置发生变化时仍按原流程手动重建。新增的终端日志无法补录过去未保存的输出，内存读取缓存与检索进度会在进程重启后清空。

## 本地与安全边界

kemo-graph 的 Markdown、SQLite、FAISS、回收站和日志默认保存在本地；但 Graph 构建、Embedding 与 Rerank 会经由 Kemo 网关发送给实际配置的模型服务。处理敏感资料前，应确认网关、Provider 与网络边界。

v1.1.0 起支持把知识库放到任意绝对知识位置（可移植 Store）；`portable_stores.allowed_roots` 可收紧允许访问的根目录，联合查询只在内存中融合结果，不合并数据库。

当前 kemo-graph 的外部 API 没有内建应用层鉴权。默认应监听 `127.0.0.1`；如果跨设备或公网部署，必须在外层部署 VPN、反向代理、TLS、认证或 IP 白名单，不能直接暴露未保护的导入、删除和维护端点。

## 下一步

- 阅读 [kemo-graph GitHub README](https://github.com/kesepain-KE/kemo-graph) 了解完整项目架构和部署步骤；
- 阅读本页的“如何与 kemo-agent 协作”章节，了解智能体调用边界；
- 在部署好 Kemo Gateway 后，使用一份小型 Markdown 或 TXT 文档开始导入和验证。