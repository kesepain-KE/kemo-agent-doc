# kemo-agent 1.2.2 — 核心目录化稳定更新

1.2.2 把根目录被拆成一个「上帝模块」的 `run/` 重新按职责分层，同时补齐启动路径与端口跟随、任务计划的可修正/可回溯与凭据脱敏、运行结束音效、发送附件引用清除与运行中引导 purpose 修正，并把 `kemo_app` 桥接升至 `1.1.5`。这是一次稳定性和维护性更新。

## run/ 目录化拆分（架构重构）

- `run/` 按职责拆为多个领域子包：`conversation / context / history / memory / tools / agents / tasks / long_task / scheduler / config / extensions / infra`；
- 每个子包以 `__init__.py` 作为该类别单一入口，`run/engine.py` 作为顶层总入口；
- 旧的平铺导入路径（如 `run.agent_runner`、`run.task_plan_store`）不再支持；旧插件若仍导入这些路径需改用新的 `run.<领域>` 入口；
- 保留懒加载公共 API，避免把完整引擎拉进插件/代理发现路径。

## 启动与端口修复

- 修复启动时的项目根目录解析，保证 pack 结构下正确加载配置与资源；
- 备用 Web 端口与本机桥接端口跟随修复；
- 新增 `tests/config/test_start_web_ports.py`，覆盖包结构、项目路径、备用端口与支持项。

## 任务计划：可修正 / 可回溯 / 凭据脱敏

- 计划支持修改（edit）、重试失败/取消步骤（retry_step）、重置步骤（reset_step）、查看修订历史与安全回滚（rollback 生成新 revision，不改写历史）；
- completed 步骤受保护，不能修改、删除或重置；所有写操作走 `PlanStore.update` 的 revision 原子校验 + 锁；
- 计划保存前脱敏明显的 Token、API Key、Bearer 凭据与私钥内容，避免敏感凭据进入计划快照。

## 发送附件引用清除与引导 purpose 修正

- 前端发送附件后立即清除发送框引用，不再依赖运行成功判定，避免同一 `asset_id` 被后续消息复用（部分 API 绑定 ID 只能用一次）；
- 运行中引导上传媒体时 metadata 统一使用 `purpose=input`，符合网关「公开上传只接受 purpose=input」约束。

## 运行结束音效（仅 Windows 桌面网页端）

- 每个用户可设置自己的运行结束音效，存储在用户根目录专门文件；
- 仅在 Windows 桌面网页端播放并显示设置入口；手机端（Android/iOS）不播放、不显示；
- 上传校验音频 MIME 与大小，路径限定在用户根目录专用文件，前端播放仅针对成功完成。

## kemo_app 桥接 1.1.5

- `kemo_app` 桥接协议升至 `1.1.5`，补齐启动、端口跟随与健康采集；`expand.json`、`config.example.json`、`expand_control.md`、`README.md` 一致更新。

## 版本与文档

- 根、core / agents / plugins / web 组件统一 `1.2.1 → 1.2.2`；
- readme / README_EN / agents.md / 全局知识文档（kemo-transport-reliability、plugin-development、project-introduction、provider-tool-call-safety、user-directory-skeleton、version-and-update-modules）一致更新；
- 新增/扩展测试：`tests/config/test_start_web_ports.py`、`tests/cron/test_task_plan.py`、`tests/expand/test_kemo_app_expand.py`、`tests/template_tests/user/validator.py`、前端（ChatPage / SettingsPage / ModulePages）。

## 验证

发布前完成系统验收（release_check 7/7）：

- test_kemo：89 passed
- backend_tests：894 passed + 3 skipped + 57 subtests
- template_contracts：10 passed
- Python 编译、Git 补丁检查通过
- 前端 Vitest：28 文件 / 216 passed；生产构建成功

## 开始使用

```bash
git pull origin main
```

升级后无需额外配置。若你自建的插件或扩展仍导入旧的 `run.agent_runner`、`run.task_plan_store` 等平铺路径，需改为新的 `run.<领域>` 入口。
