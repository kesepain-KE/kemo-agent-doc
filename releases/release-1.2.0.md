# kemo-agent 1.2.0 — 会话级长任务版本

1.1.2 回答了「计划该停在哪、后台任务该怎么等」；1.2.0 回答的是「一个 Run 的工具上限到了，任务还没做完怎么办」——用户可以为单个对话空间显式开启长任务模式：达到单轮工具调用上限时，框架完整提交当前 Run，再在同一会话锁内自动创建下一 Run 继续执行，并在输入框上方持续汇报原始请求、累计耗时、Run/续跑次数、工具调用与 Token 用量。

## 核心能力：会话级长任务模式

| 层面 | 行为 |
|------|------|
| 显式授权 | 长任务开关在 Web 对话操作菜单中按会话开启，状态保存在会话记录中，不写入全局或用户配置；新会话默认关闭 |
| 严格隔离 | 状态按 `(user, source, session_id)` 隔离，Web 与 App、同一用户的不同对话空间互不影响 |
| 续跑边界 | 仅当底层 Run 以 `status=limited`、`stop_reason=max_tool_iterations` 收束时才自动创建下一 Run；上下文保护、Provider 错误、任务计划批准边界和普通取消都不会触发续跑 |
| 事件语义 | 中间 Run 只发送非终态 `long_task_update`（含下一 Run ID），最终 Run 才发送 `done` / `error` |
| 关闭与取消 | 关闭开关不会打断正在执行的 Run（当前 Run 正常结束后任务标记 `completed`）；会话级取消接口终止整个逻辑长任务并取消当前 Run |
| 上限保护 | 单个逻辑任务最多续跑 128 次（`MAX_LONG_TASK_RUNS`），每次续跑仍走完整的上下文选择与压缩链路 |

## 记忆与摘要的语义保护

- 续跑控制轮次使用 synthetic metadata（`origin=long_task_continuation`），历史界面只渲染为边界横条，不生成伪用户气泡；
- 记忆提取与历史摘要使用 `semantic_user_text()` 还原原始用户请求，内部控制提示不会污染长期数据；
- 历史接口按白名单暴露长任务元数据，客户端可据此恢复界面状态。

## 上下文压缩进度可见

- 自动（轮次触发）、手动与 Provider 超限压缩均通过非终态 `context_compression` 事件报告进度：`started`（正在生成/扩展摘要）、`ready`（摘要可被当前请求使用）、`failed`（本次摘要未成功）；
- 事件携带触发来源与轮次统计（压缩前 / 裁剪 / 保留轮数）；
- 队列策略下，`ready` 只表示摘要就绪；裁剪轮次的记忆分析在本轮提交后由后台继续完成，`memory_processed_round` 追平目标游标才是完成判据，允许零新增候选。

## Web 界面

- 输入框上方新增长任务状态气泡（LongTaskBubble）：原始任务、累计耗时、Run/续跑次数、工具调用、Provider 请求与 Token 用量；
- 对话操作菜单新增「长任务模式」开关，运行中也可打开；
- 压缩过程在输入框上方显示开始 / 就绪 / 失败状态与「进入后台记忆整理」说明。

## kemo_app 桥接

- 会话删除与关闭接口新增可选 `client_id` 参数并透传到上游，Android 客户端可标识自身。

## 版本与文档

- 根与 core/web 组件 `1.1.2 → 1.2.0`，CLI VERSION 与前端公共包同步；`agents`、`plugins` 及独立 `kemo_app` 桥接协议保持 `1.1.2`；
- readme / README_EN / agents.md / 全局知识文档一致更新；
- 新增 `global_knowledge/long-task-runtime.md`：会话级长任务隔离状态机、跨 Run 边界、HTTP/SSE 与客户端恢复完整合同。

## 验证

发布前完成系统验收（release_check 7/7）：

- test_kemo：78 passed
- backend_tests：800 passed + 2 skipped + 58 subtests
- template_contracts：10 passed
- Python 编译、Git 补丁检查通过
- 前端 Vitest：25 文件 / 192 passed；生产构建成功

## 开始使用

```bash
git pull origin main
```

长任务模式无需额外配置：升级后在 Web 对话操作菜单中为当前会话打开「长任务模式」开关即可。会话级状态随历史会话记录保存，不依赖全局或用户配置文件。
