# kemo-agent 1.1.2 — 运行连续性与界面稳定性补丁

1.1.1 让 App 与桌面各得其所；1.1.2 解决的是"计划该停在哪、后台任务该怎么等、暗色界面该长什么样"的问题——任务计划创建后在当前会话边界干净收束，新增最长两小时的条件等待工具，临时重要记忆有了更宽裕的注入预算，Web 界面全面接入主题变量。

## 核心变更：任务计划运行边界

| 层面 | 变更 |
|------|------|
| 创建边界 | 主智能体通过 `task_plan` 子代理成功创建计划后，当前 Run 立即收束：同一响应中排在创建调用之后的工具标记 `not_executed`，不再发起后续请求；不暂停用户，不影响同一用户的其他会话 |
| 对话空间隔离 | 系统提示词只注入与当前 `source + session_id` 匹配的未完成计划；`task_plan` 工具只能查看或操作当前对话空间的计划，跨会话 `plan_id` 显式拒绝 |
| 原子领取 | 执行器只能原子领取 `approved` 计划为 `running`，步骤只允许 `pending → running`，防止 Web/App 执行器与后台调度器并发执行同一计划 |
| 自动批准 | `auto_accept=true` 新建计划直接以 `approved` 持久化，等待唯一执行器领取；`resume` 只恢复为 `approved` |

## 新工具：wait_for_condition

后台任务启动后，前台可以等待明确的完成信号，而不是盲目轮询或固定等待：

- 最长等待 1～7200 秒，条件满足立即返回；
- 七种条件：固定时长、进程退出（PID）、路径出现 / 消失 / 变化、TCP 端口开 / 关；
- 轮询间隔默认 5 秒可调，支持协作取消；
- 达到上限返回 `status=timeout`，只表示等待超时，不宣称后台任务失败。

配套机制：插件可声明最多 30 秒的 `timeout_grace_seconds` 清理宽限，只延后框架外层看门狗，不增加实际工作或等待时长。

## 临时重要记忆注入预算

- 热画像 Prompt 注入预算由 5000 字符提升到 **20000 字符**（配置 `memory.important_memory_max_chars`）；
- `important_memory_output_max_chars` 保持独立语义，仍是模型输出防失控硬上限，超过时整体拒绝且不覆盖旧热画像；
- 子代理指令与 Web 设置页默认值同步更新。

## kemo_app 桥接增强

- 新增持久化设备定向命令队列（`device_commands.py`）：闹钟、定时器、日历、待办四类命令可排队下发，状态机覆盖 `queued → received → waiting_user → presented / completed / cancelled / failed / expired / unsupported`，跨进程文件锁保证并发安全；
- 后台采集器限流自动恢复：已显式激活的桥接服务连续 3 次失败且距上次启动超过 60 秒时自动拉起（健康探测 12 秒），部署端无需人工干预即可自愈；
- 更新器文件清单同步纳入新模块。

## Web 界面修复

- 任务计划气泡与任务页全面迁移到主题 token，暗色模式下不再出现白色卡片泄漏；
- 工具展开卡片、各管理页 CSS 颜色统一接入主题变量；
- 计划气泡步骤列表补充无障碍语义，长列表滚动由 CSS 控制；
- 新增暗色主题表面契约测试，防止回归。

## Web 后端 source 透传

- `overview` 与 `runtime/status` 接口新增 `source` 参数，运行概览与状态按真实来源定位窗口，APP 会话不再误读 Web 窗口；
- Web/App 计划执行器领取时校验计划归属当前对话空间，跨会话执行返回冲突。

## 版本与文档

- 根与 core/agents/plugins/web 四组件 `1.1.1 → 1.1.2`，CLI VERSION 与前端 package 同步；
- readme / README_EN / agents.md / 全局知识文档一致更新；
- 配套测试：计划边界、对话空间隔离、wait_for_condition 插件、暗色主题契约、更新清单完整性。

## 验证

发布前完成系统验收（release_check 7/7）：

- test_kemo：78 passed
- backend_tests：792 passed + 2 skipped + 56 subtests
- template_contracts：10 passed
- Python 编译、Git 补丁检查通过
- 前端 Vitest：25 文件 / 188 passed；生产构建成功

## 开始使用

```bash
git pull origin main
```

升级后 `memory.important_memory_max_chars` 默认值变化（5000 → 20000），如需保持旧行为可在用户配置中显式设置；其余变更无需额外配置即可生效。
