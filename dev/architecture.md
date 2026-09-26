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
| `runtime/` | 自动生成的 SQLite 结构化运行日志，不纳入 Git |
| `global_knowledge/` / `shared_knowledge/` | 分层知识 |
| `global_sense/` | 全局感知模块 |
| `global_expand/` / `shared_expand/` | 全局与共享拓展 |
| `template/` | 用户、代理、技能、拓展、感知和任务骨架 |
| `update/` | 更新板块实现（update.py 的 4 板块：core / agents / plugins / web） |
| `events.py` | 统一运行事件类型定义（text_delta / tool_call_result / usage / error / done） |
| `tests/template_tests/` | 按资源类型拆分的创建结果入口/出口合同验收基准 |

## Web 后端分层

Web 后端按“应用装配—路由—领域服务—公共契约”组织，避免把全部 API、文件操作和业务规则集中在单个上帝模块中：

| 路径 | 职责 |
|---|---|
| `web/app.py` | 创建 FastAPI 应用、装配共享运行时并注册路由；保留聊天流等核心入口 |
| `web/app_factory.py` | 应用装配细节 |
| `web/auth.py` | Web 认证与会话签名 |
| `web/routes/` | 按 identity、sessions、files、modules、settings、tasks 等功能域声明 HTTP 路由 |
| `web/service.py` | 对外兼容门面、聊天相关核心服务和既有测试兼容入口 |
| `web/services/` | 文件、用户、知识、记忆、模块、技能、任务、运行状态、模块面板与产物校验和找回等领域实现 |
| `web/schemas.py` | Web 请求与响应的数据模型 |
| `web/errors.py` | Web 层稳定异常类型与错误边界 |
| `web/constants.py` | 上传、预览、技能归档等共享限制和类型映射 |

路由层只处理 HTTP 输入输出，领域服务不依赖具体页面。原有调用方仍可通过兼容门面工作，因此此次拆分不改变公开 API 路径。

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

`run/engine.py` 只保留稳定公共门面，其余按职责拆成目录：

| 目录 | 职责 |
|---|---|
| `run/conversation/` | 对话编排：请求准备、主循环、Provider 交换、引导邮箱与终态提交 |
| `run/context/` | 上下文选择、压缩与摘要 |
| `run/history/` | 历史窗口、会话生命周期、检索索引与摘要调度 |
| `run/memory/` | 记忆候选、加权证据、碎片与晋升 |
| `run/retry/` | 统一的重试策略与恢复 |
| `run/agents/` | 子代理运行、队列与调度 |
| `run/tasks/` | 任务计划存储、校验与执行 |
| `run/scheduler/` | RuntimeHost、Cron、维护与巡检 |
| `run/tools/` | 工具执行、后台作业与执行看门狗 |
| `run/extensions/` | 拓展与感知运行时、附件与媒体路由 |
| `run/config/` | 提示词来源、用户与知识配置 |
| `run/infra/` | 原子写、进程管理、日志与命令行基础设施 |
| `run/long_task/` | 会话级长任务状态机 |

拆分不改变调用方入口，目的是让状态、上下文、记忆和终态提交各自保持清晰边界。

## 状态边界

用户级持久状态始终落在 `users/<name>/`。工具上下文只获得运行所需的 root、user、source、session 和超时等字段，不自动得到主对话历史。
