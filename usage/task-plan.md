# 任务计划

任务计划用于需要多个步骤、依赖关系或用户确认的目标。从 `v0.10.0` 起，计划元数据、步骤与有序依赖保存在 `users/<user>/task_plan/task_plans.sqlite3`（基于 revision 的乐观锁），进程重启后仍可恢复；旧 `task_plan/<plan>/` 目录与 `plans.json` 不再参与读取，也不会自动导入。

## 生命周期

```text
pending → approved → running → completed
                         ├── paused
                         └── failed
任意允许状态 ─────────────→ cancelled
```

默认 `task_plan.auto_accept=false`，新计划在执行前等待批准；`auto_accept=true` 时新计划直接以 `approved` 持久化，等待唯一执行器领取。运行时会按依赖选择下一步，已完成步骤不会重放；关键步骤失败会暂停计划，非关键步骤失败可记录后继续。

从 `v1.1.2` 起，计划执行遵循以下运行边界：

- **创建后当前会话收束**：主智能体创建计划成功后，当前对话 Run 立即停止，不再自行继续执行；同一响应中排在创建调用之后的工具标记为未执行，不产生副作用；
- **对话空间隔离**：系统提示词只注入与当前 `source + session_id` 匹配的未完成计划；`task_plan` 工具只能查看或操作当前对话空间的计划，跨会话 `plan_id` 会被显式拒绝；
- **原子领取**：计划只能由唯一执行器从 `approved` 状态原子领取为 `running`（后台调度器、CLI 或 Web/App 起跑入口），步骤同样只允许 `pending → running`，避免多入口并发执行同一计划；
- **恢复语义**：暂停计划通过 `resume` 恢复为 `approved`，再由执行器领取执行，不会直接回到运行中。

收束状态只影响创建计划的那一次对话，不会暂停同一用户的其他会话。

## 常用操作

Web 的任务页可以创建、批准、暂停、继续和取消计划。CLI 对应命令包括：

```text
/plans
/plan <目标>
/plan-show <ID>
/plan-approve <ID>
/plan-pause <ID>
/plan-resume <ID>
/plan-cancel <ID>
```

计划最大步骤数由全局 `task_plan.max_steps` 控制，当前默认 20。

::: tip 适合使用计划的任务
涉及多文件修改、多个外部系统或关键决策点时，计划能让过程可见并允许中途调整。简单的一步操作无需强行创建计划。
:::
