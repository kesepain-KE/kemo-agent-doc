# v0.1.0 更新说明

`v0.1.0` 是 kemo-agent 的第一个正式版本，以 Kemo Tidal Engram 潮汐式生命周期记忆系统为核心，形成从对话、记忆、子代理协作，到任务计划和定时调度的完整闭环。

## 潮汐记忆系统

- 四档生命周期：`seven_days`（7天）→ `one_month`（30天）→ `half_year`（180天）→ `permanent`（永久）。各档按权重阈值晋升，到期未达标自然删除，不降级保留。
- 每日权重上限：每条记忆每天最多加权 +1。被 Prompt 引用、正文修改或被 self_improve 命中时触发。
- 永久记忆全部注入，临时三层按有效期和权重择优注入。临时重要记忆热画像由 `memory_temporary_important` 子代理独立维护。
- 用户可随时查看、补充和修正记忆。

## 对话与上下文

- 流式对话，运行中可追加引导（guidance）。上下文按轮次和 Token 预算管理，超限自动压缩。
- 完整历史归档无上限保留，Provider 工作区受 `max_rounds` 限制。跨用户、跨来源、跨会话完全隔离。
- 支持 Web、CLI 和外部消息平台三个入口，共享同一用户身份、历史关系和记忆。

## 子代理协作

- 内置 `context_manage`（上下文压缩）、`self_improve`（记忆提取与晋升）、`memory_temporary_important`（热画像维护）、`task_plan`（任务计划生成）四个子代理。
- 子代理有独立 Prompt、工具白名单、知识开关和主历史继承策略，与主智能体权限隔离。

## 任务计划与定时调度

- 任务计划支持 pending → approved → running → completed/failed/paused/cancelled 状态机。自动执行需 `auto_accept=true`。
- cron 定时任务支持 daily（每日）、once（单次）和 recurring（重复）三种类型。自然语言需求通过 `time_plan` 子代理解析。

## 三层资源体系

- 知识库、技能、拓展均分用户级 → 共享级 → 全局级三层。用户层优先，按需向上检索。
- 知识库正文按需读取，只自动注入索引。感知模块单向采集并注入系统状态。
- 所有资源白名单由用户配置控制。

## 开始使用

```bash
git clone https://github.com/kesepain-KE/kemo-agent.git
cd kemo-agent
python setup.py
python start_web.py
```

首次启动后访问 `http://127.0.0.1:1357`。

---

> 本说明基于 [GitHub Release v0.1.0](https://github.com/kesepain-KE/kemo-agent/releases/tag/v0.1.0) 整理。
