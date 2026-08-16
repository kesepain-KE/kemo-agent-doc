# kemo-agent 1.2.1 — 运行可靠性补丁

1.2.0 让长任务跑得更远；1.2.1 把注意力放回「跑得稳」：历史写入采用更严格的事务与跨进程写盘边界，系统 Cron 不再高频写任务文件，Provider 工具参数改为整批校验与安全恢复，采集产物按检查点节流并跳过无变更写盘，`kemo_app` 桥接 1.1.4 补齐脱离客户端的运行快照。

## 历史持久化事务化（schema v3）

| 变更 | 说明 |
|------|------|
| 正文权威化 | archive 消息正文以 `history_messages` 表为权威源，`text_json` 压缩为 `storage: history_messages` 标记 |
| 分区迁移 | `think / tool / items / data` 逻辑分区自动迁移到轮次表，旧库打开时无感升级 |
| 事务化提交 | 终态提交改为 `commit_terminal_windows` 事务化批量写入；记忆游标与运行状态用 `patch_archive_metadata` 增量更新，不再整窗口重写 |
| 合同文档 | 新增 `global_knowledge/persistence-write-path.md`，明确持久化写入路径与跨进程边界 |

## 系统 Cron 可靠性

- 单领导租约：系统任务由单个调度实例领取，避免多实例重复执行；
- 内存运行态检查点：高频任务的最新运行时间保存在进程内，按 `runtime_checkpoint_seconds`（默认 300 秒）或关停时落盘，不再每几秒写任务 JSON 文件；
- 成功日志聚合：按 `success_log_flush_seconds`（默认 300 秒）批量落库；
- 新参数位于 `global_config.json → task_cron_system`，一般无需调整。

## Provider 工具参数整批校验与安全恢复

- Provider 返回的工具调用整批校验通过后才进入执行循环；
- 统一终态为 `invalid_tool_arguments` 且尚未发布可见输出时，按 `tools.invalid_tool_arguments_retries` 使用新 `request_id` 与临时纠错指令重新请求；
- 主智能体与子代理共用 `run/provider_tool_recovery.py` 恢复助手，行为一致。

## 采集产物检查点节流

- 拓展/感知模板与内置拓展统一 300 秒检查点节流，注入正文不再内嵌采集时间；
- `kemo_graph` 的 `atomic_text()` 在内容不变时跳过写盘，减少文件系统抖动。

## kemo_app 桥接 1.1.4

- 新增 `run_broker.py`：脱离客户端的运行传输与持久回放快照——Android HTTP 连接只是订阅者，broker 拥有上游 `/api/chat` 流直到终态，关闭或杀死客户端不会变成框架取消；SQLite 日志支持事件回放，终态运行保留 7 天；
- `app.py` 补齐生命周期锁、PID/实例对账与临时退避自愈；
- 更新器将 `run_broker.py` 纳入桥接公开文件。

## Web 界面

- 输入框能力按钮打开统一「能力引用抽屉」（CapabilityReferenceDrawer）：按拓展、技能、插件分组展示并标注启用状态（已启用 / 未启用 / 配置异常），点击条目将引用与稳定标记写入草稿。

## 版本与文档

- 根与 core/web 组件 `1.2.0 → 1.2.1`，CLI VERSION 同步；`agents`、`plugins` 保持 `1.1.2`；`kemo_app` 桥接协议 `1.1.4`；
- readme / README_EN / agents.md / 全局知识文档一致更新。

## 验证

发布前完成系统验收（release_check 7/7）：

- test_kemo：89 passed
- backend_tests：845 passed + 2 skipped + 58 subtests
- template_contracts：10 passed
- Python 编译、Git 补丁检查通过
- 前端 Vitest：26 文件 / 195 passed；生产构建成功

## 开始使用

```bash
git pull origin main
```

升级后无需额外配置。已有历史库会在首次打开时自动迁移到 schema v3，迁移与运行时裁剪在同一事务中完成。
