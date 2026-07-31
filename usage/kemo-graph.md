# kemo-graph：面向智能体的图谱与检索知识层

kemo-agent 的内置三层知识库适合管理明确归档的 Markdown 资料；当资料需要从多种文件格式持续沉淀为概念、关系、来源证据与语义向量时，可以接入 [kemo-graph](https://github.com/kesepain-KE/kemo-graph)。

它是 Kemo 生态中的外部知识层，而不是 kemo-agent 的内置替代品：

```text
kemo-agent
  → 识别用户意图、任务与何时需要知识
  → 调用 kemo-graph 外部 API
kemo-graph
  → 导入资料、维护 Graph/RAG、返回结构与原文证据
  → 通过 Kemo 协议请求模型能力
kemo-adapter-api
  → 路由 LLM、Embedding、Rerank 到已授权 Provider 或本地模型
```

## 什么时候适合使用

kemo-graph 适合处理以下场景：

- 项目设计、接口、决策记录等需要长期追溯来源的资料；
- PDF、DOCX、HTML、CSV 等需要统一转换后再进入知识库的文件；
- 希望同时获得概念关系与原文片段的问答；
- 文档会持续新增、修改或删除，希望索引按内容变化增量维护；
- 希望让多个智能体通过一个稳定 API 使用同一份知识结构。

## 它保存什么

资料导入后会先转为 Markdown，并以内容哈希记录处理状态：

```text
原始文件
  → external/markdown/ 中的正式 Markdown
  → source_id + SHA-256 内容哈希
  ├─ Graph：节点、关系、来源证据
  └─ RAG：切片、向量、FAISS 索引
```

Markdown 是事实来源；图谱 SQLite、RAG SQLite 与 FAISS 都是可以依据 Markdown 更新或重建的派生数据。

支持的导入格式：

```text
PDF · DOCX · Markdown · TXT · HTML · RST · CSV
```

## 查询方式

kemo-graph 向智能体提供三种查询：

| 查询 | 适用问题 |
|---|---|
| 图谱查询 | 概念与哪些概念有关、关系可以延伸到哪里、知识群如何组织 |
| RAG 查询 | 哪些原文片段在语义上最接近问题 |
| 混合查询 | 用图谱命中的概念增强相关文本切片，再进行向量检索与重排序 |

混合查询分别返回 Graph 结构和 RAG 原文证据，避免只给出无法追溯的结论。

## 供 kemo-agent 调用的 API

kemo-graph 默认暴露 `/api/v1` HTTP API。常用端点包括：

```text
GET  /api/v1/status
GET  /api/v1/graph
POST /api/v1/query/graph
POST /api/v1/query/rag
POST /api/v1/query/hybrid
POST /api/v1/import?ingest=true|false
POST /api/v1/ingest
GET  /api/v1/documents
GET  /api/v1/documents/{source_id}/content
```

建议的协作路径：

```text
kemo-agent 判断需要项目资料
  → 调用 /query/hybrid
  → 获得概念关系、关联原文片段与来源
  → 将结果用于回答、计划或工具决策
```

完整请求和响应契约请参阅 kemo-graph 仓库中的 [api.md](https://github.com/kesepain-KE/kemo-graph/blob/main/api.md)。

## 部署边界

kemo-graph 默认可通过本地地址提供服务：

```bash
uvicorn api:app --host 127.0.0.1 --port 8000
```

当前外部 API 没有内建应用层鉴权。若 kemo-agent 与 kemo-graph 不在同一台机器，或服务需要跨设备/公网访问，必须在外层使用 VPN、反向代理、TLS、IP 白名单或认证机制保护；不能把未受保护的导入、删除与维护 API 直接暴露到公网。

## 与 kemo-agent 内置知识库的关系

两者可以同时存在：

- **kemo-agent 内置知识库**：用户、共享、全局三级 Markdown 知识，适合清晰归档、由 Prompt 索引按需使用的资料；
- **kemo-graph**：面向外部资料导入、图谱关系、向量检索、来源证据与增量维护的专用知识服务。

kemo-agent 负责决定知识何时进入当前任务；kemo-graph 负责让资料保持可维护、可检索和可追溯。
