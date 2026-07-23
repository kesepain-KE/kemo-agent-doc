# 项目架构

kemo-agent 是事件驱动的多用户运行时。Web、CLI、消息和 Cron 最终都复用 `run/engine.py` 的请求链路与统一 `RunEvent`。

## 主要目录

| 路径 | 职责 |
|---|---|
| `run/` | 对话引擎、上下文、历史、记忆、任务存储与运行时宿主 |
| `provider/` | Kemo 与 Chat Provider 适配 |
| `plugins/` | 可执行工具及其 `SKILL.md` 清单 |
| `agents/` | 内置子代理与受信任运行时 |
| `cron/` | 时间计算、任务执行和调度线程 |
| `message/` | 平台无关消息契约、身份、幂等和路由 |
| `web/` | Python API 与 React/Vite 前端 |
| `config/` | 全局配置和安全底线 |
| `users/` | 用户独立配置、历史、记忆、知识、任务和文件 |
| `global_knowledge/` / `shared_knowledge/` | 分层知识 |
| `global_sense/` | 全局感知模块 |
| `global_expand/` / `shared_expand/` | 全局与共享拓展 |
| `template/` | 用户、代理、技能、拓展、感知和任务骨架 |

## 主调用链

```text
入口（Web / CLI / Message / Cron）
  → 加载全局默认与用户配置
  → 获取会话锁并准备历史工作区
  → 组装 PromptBundle 与工具注册表
  → 选择上下文并按需摘要
  → Provider ↔ 工具循环
  → 成功提交归档、记忆加权与提取游标
```

`RuntimeHost` 统一托管 Web 之外的后台组件，包括 Cron、消息路由和维护调度。

## 状态边界

用户级持久状态始终落在 `users/<name>/`。工具上下文只获得运行所需的 root、user、source、session 和超时等字段，不自动得到主对话历史。
