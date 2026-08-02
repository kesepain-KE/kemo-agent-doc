# 任务计划

任务计划用于需要多个步骤、依赖关系或用户确认的目标。从 `v0.10.0` 起，计划元数据、步骤与有序依赖保存在 `users/<user>/task_plan/task_plans.sqlite3`（基于 revision 的乐观锁），进程重启后仍可恢复；旧 `task_plan/<plan>/` 目录与 `plans.json` 不再参与读取，也不会自动导入。

## 生命周期

```text
pending → approved → running → completed
                         ├── paused
                         └── failed
任意允许状态 ─────────────→ cancelled
```

默认 `task_plan.auto_accept=false`，新计划在执行前等待批准。运行时会按依赖选择下一步，已完成步骤不会重放；关键步骤失败会暂停计划，非关键步骤失败可记录后继续。

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
