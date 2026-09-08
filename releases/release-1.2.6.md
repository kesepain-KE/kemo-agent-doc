# kemo-agent 1.2.6 — 运行环境隔离、跨平台 Shell 与外挂同步加固

1.2.5 收口了并发与作用域，1.2.6 处理的是「运行环境本身」：拓展和感知子进程不再继承框架的密钥环境，
Shell 工具第一次拥有了完整的跨平台解释器选择，Kemo Graph 外挂的文件同步获得了内容级的安全校验。
同时，历史存储等核心领域完成包化拆分，为后续演进铺平了模块边界。

---

## 拓展/感知子进程环境隔离

此前拓展与感知子进程完整继承框架根目录 `.env` 的环境变量。当模块（如 kemo-graph 服务）需要自己的
Provider 密钥时，框架侧的占位或真实 `KEMO_API_KEY` 会污染子进程环境，导致外挂鉴权失败且难以定位。

- 子进程改用隔离环境启动：模块专用配置从**模块自身 `.env`** 读取，不再继承框架 Provider/Web 密钥；
- `.gitignore` 同步收紧：`global_expand/**/.env` 一律不入库（保留 `.env.example`），内置模块源码
  入库但私有运行配置与仓库彻底分离。

## Shell 插件：跨平台解释器选择

Shell 工具此前对解释器的选择逻辑分散在单文件中。1.2.6 将其拆分为独立的解释器探测与进程执行模块：

- `shell_type` 显式支持 `auto` / `cmd` / `powershell` / `pwsh` / `bash` / `bash_login`；
- 自动模式按平台与命令语法选择解释器，默认不加载个人启动配置，保证脚本行为可复现；
- 插件进程延续默认无可见终端策略，仅 `show_terminal=true` 时创建控制台。

## 核心领域包化拆分

延续 v1.2.5 的领域化架构，本轮把剩余的巨型模块按职责拆开，对外导入路径全部保持兼容：

| 领域 | 变化 |
|------|------|
| `run/history/` | 历史存储拆分为十二个子模块（store_core / index_core / message_store / registry_store / runtime_window / window_store / commit_ops / session_ops / session_api / summary_store / memory_claims / history_models） |
| `run/config` | 拆出 Markdown 解析与模型数据模块 |
| `run/conversation` | 拆出轮次清理与工具批次执行模块 |
| `run/agents` | 新增共享 `retry_policy`，主/子智能体统一 Provider 可重试判断 |
| `run/memory` / `run/tasks` | 拆出 SQLite 支持层与任务计划错误/修订编解码模块 |
| `message` / `plugins/file` / `plugins/memory_manage` | 各自拆出合同、文本编辑与热画像视图模块 |
| `web/services` | 拆出 Run 控制与音效服务模块 |

前端同步拆分：ChatPage 拆出视图/展示/运行支持/状态/工作流五个模块，AppShell、API 传输层与类型层
各自独立；`pnpm-lock.yaml` 首次入库，锁文件与 `package-lock.json` 并存对应双包管理器。

## Kemo Graph 外挂同步加固

- **origin hash 校验**：kemo-agent 同步本地文件时发送 `expected_origin_hash`，kemo-graph 从同一
  私有快照完成哈希与转换；源文件在同步中途变化时安全拒绝，不推进同步游标；
- **失败重试与核对**：失败文档可按路径精确重试；批量删除后核对结果，避免静默部分失败；
- **边界保护**：目录不可用时优雅降级、状态展示补充时间与文档数量、路径扫描拒绝符号链接与 junction。

## Provider 诊断与网页细节

- 诊断内容递归脱敏并限制长度，原始密钥与过大响应不再进入历史；
- 网页 Markdown 裸链接在中文标点前正确结束——不再把链接后的中文正文一起变成链接；长链接可以换行，
  键盘焦点提示保留。

## 版本与文档

- 根与 core / agents / plugins / web 四组件 1.2.5 → 1.2.6；
- `readme.md` / `README_EN.md` 版本徽章与更新说明同步，`agents.md` 补充运行中多模态引导合同。

## 验证

- release_check.py 7/7 PASS：test_kemo 90、backend_tests 1096 passed + 7 skipped + 125 subtests、
  template_contracts 10、python_compile、git_diff_check、frontend_tests 268（29 files）、frontend_build。

## 兼容性

- 拓展/感知子进程不再看到框架 `.env` 的密钥；此前依赖该行为注入密钥的外部工具需改为读取自身 `.env`；
- `run/history` 等包化拆分仅重组内部实现，`run.<领域>` 公开导入路径不变；
- Shell `shell_type=auto` 在无 bash 的 Windows 上自动回退 cmd/pwsh，与旧行为兼容。
