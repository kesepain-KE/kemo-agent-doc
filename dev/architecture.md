# 项目架构

kemo-agent 是事件驱动的多用户运行时。Web、CLI、消息和 Cron 最终都经过 `run/engine.py` 的稳定公共门面，并复用统一 `RunEvent`。

## 主要目录

| 路径 | 职责 |
|---|---|
| `run/` | 稳定引擎门面、对话编排、上下文、历史、记忆、任务存储与运行时宿主 |
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
  → run/engine.py 稳定公共门面
  → 加载全局默认与用户配置
  → 获取会话锁并准备历史工作区
  → 组装 PromptBundle 与工具注册表
  → 选择上下文并按需摘要
  → Provider ↔ 工具循环
  → 提交 completed / cancelled / failed 终态
  → 成功轮次执行记忆加权与提取游标
```

`RuntimeHost` 统一托管 Web 之外的后台组件，包括 Cron、消息路由和维护调度。

## 运行模块职责

`run/engine.py` 保留对外兼容入口，主循环由 `conversation_runtime.py` 负责。其余领域模块按职责拆分：

| 模块 | 职责 |
|---|---|
| `context_service.py` | 上下文选择、压缩与重试 |
| `request_input.py` | 请求与附件输入准备 |
| `provider_events.py` | Provider 事件归一化 |
| `run_state.py` | 单轮运行状态与终态信息 |
| `round_finalizer.py` | 成功、失败和取消的提交边界 |
| `attachments.py` | Web、消息和工具路径的 Run 资产解析与媒体验证 |
| `expand_runtime.py` | 拓展发现、隔离调用、产物发布与运行诊断 |
| `module_runtime.py` | 感知/拓展模块锁、子进程协议和进程树回收 |
| `session_runtime.py` | 会话锁与运行会话辅助 |
| `memory_analysis.py` | 记忆候选批处理与持久化编排 |
| `usage.py` | 用量累计与展示数据 |
| `errors.py` | 稳定运行时异常类型 |

拆分不改变调用方入口，目的是让状态、上下文、记忆和终态提交各自保持清晰边界。

## 状态边界

用户级持久状态始终落在 `users/<name>/`。工具上下文只获得运行所需的 root、user、source、session 和超时等字段，不自动得到主对话历史。
