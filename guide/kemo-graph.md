# kemo-graph：Kemo 生态的图谱与检索项目

> 当前版本：v1.1.0 — 查询规划、语义分层切分、可移植知识库与应用更新系统。

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
PDF · DOCX · Markdown · TXT · HTML · RST · CSV
```

导入后的 Markdown 原子写入本地目录，并通过 `file_map.json` 建立原始文件与 Markdown 的一对一映射。可以先转换、不调用模型，审核内容后再整理。

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

### 可移植知识库（v1.1.0）

`portable_store.py` 支持在任意绝对知识位置建立独立 Store，固定目录名为 `kemo-graph-storage`：每个 Store 拥有自己的 manifest、sources.db、Graph、RAG、FAISS 与搜索缓存。跨位置联合查询（`query-federated`）不合并数据库，只在内存中融合带 Store 身份的结果，单 Store 故障隔离。路径必须绝对且不能含 `..`，可用 `portable_stores.allowed_roots` 收紧访问边界。

### 应用更新与重启（v1.1.0）

`update/` 包 + 根入口 `update.py` 从 GitHub `main/version.json` 按 SemVer 检查并安装更新；`.env`、`config/config.json`、知识库数据、外部文档与日志不会被覆盖。`restart.py` 让旧 FastAPI 进程优雅退出后由守护器启动全新解释器；Web 系统配置页也提供检查更新、应用更新与重启服务入口。

### 搜索缓存

`search_cache.py` 提供跨 CLI、FastAPI 与 Web 共享的 SQLite 持久化缓存。以知识库状态哈希判定过期，自动按上限修剪。同进程相同查询的并发调用自动合并。

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

kemo-agent 可在需要项目资料或外部知识时调用 kemo-graph 的外部 HTTP API：

```text
GET  /api/v1/status
POST /api/v1/query/graph
POST /api/v1/query/rag
POST /api/v1/query/hybrid
POST /api/v1/query/answer          # v1.1.0：混合检索问答
POST /api/v1/import?ingest=true|false
POST /api/v1/ingest
GET  /api/v1/documents
PUT  /api/v1/documents/{source_id}/content   # v1.1.0：文档内容编辑
POST /api/v1/documents/delete-batch          # v1.1.0：批量删除
DELETE /api/v1/documents?confirm=delete-all  # v1.1.0：删除全部
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
```

推荐的调用路径：

```text
kemo-agent 判断当前任务需要资料
  → 调用 kemo-graph /query/hybrid
  → 获得概念关系、原文片段与来源
  → 将结果用于回答、计划或后续工具决策
```

完整 API 契约见 [kemo-graph api.md](https://github.com/kesepain-KE/kemo-graph/blob/main/api.md)；上方调用路径说明了 kemo-agent 在任务中使用它的边界。

## 本地与安全边界

kemo-graph 的 Markdown、SQLite、FAISS、回收站和日志默认保存在本地；但 Graph 构建、Embedding 与 Rerank 会经由 Kemo 网关发送给实际配置的模型服务。处理敏感资料前，应确认网关、Provider 与网络边界。

v1.1.0 起支持把知识库放到任意绝对知识位置（可移植 Store）；`portable_stores.allowed_roots` 可收紧允许访问的根目录，联合查询只在内存中融合结果，不合并数据库。

当前 kemo-graph 的外部 API 没有内建应用层鉴权。默认应监听 `127.0.0.1`；如果跨设备或公网部署，必须在外层部署 VPN、反向代理、TLS、认证或 IP 白名单，不能直接暴露未保护的导入、删除和维护端点。

## 下一步

- 阅读 [kemo-graph GitHub README](https://github.com/kesepain-KE/kemo-graph) 了解完整项目架构和部署步骤；
- 阅读本页的“如何与 kemo-agent 协作”章节，了解智能体调用边界；
- 在部署好 Kemo Gateway 后，使用一份小型 Markdown 或 TXT 文档开始导入和验证。