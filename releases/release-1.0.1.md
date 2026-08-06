# kemo-agent 1.0.1 — 系统性稳定性版本：配置合同、生态边界与测试工作流

1.0.0 让主生态首次完整闭环；1.0.1 则没有急着继续扩张，而是把整条主链路从头到尾复核了一遍——配置、记忆、Web API、生态适配、历史归档、重启更新、子代理、拓展、感知、消息路由、知识库、工具插件，外加一套可以一键跑完的发布前验收。

这一版的大部分改动不是"新增了什么"，而是"边界更清楚了"。有些地方是审计暴露出来的真问题（感知目录不可读会让整个对话构建崩溃），有些地方是能力缺口（子代理无法单独设置超时，超时后辛苦算了一半的结果直接丢），还有些地方只是把文档和代码重新对齐。

---

## 配置合同：删掉了一个从未真正生效的开关

`prompt.injection_mode` 在文档里宣称支持 `full / truncated / off` 三种模式，但代码只接受 `full`——写任何其他值都会在启动时直接报错。这是一个典型的"文档夸大、代码未实现"的残留。

1.0.1 的处理很干脆：**配置项删除，核心硬编码 `INJECTION_MODE="full"`**。同时保留了旧配置兼容桥：残留的"全 full"旧配置会被静默接受，非 full 值才会明确报错提示已移除。升级不会因为老配置文件直接崩溃。

同类对齐还包括：

- `provider.timeout` 文档说"不再接受"，但代码实际仍在读取——文档改为与代码一致（默认 120 秒、可覆盖、headers 忽略）；
- `agents.md` 补充了 Kemo 网关状态拓展（`kemo_gateway_status`）与网关项目操控手册（`agent_control.md`）的登记，智能体现在知道去哪里读网关的操控说明；
- 全局知识库补齐三份缺失文档：`plugin-development.md`（插件开发）、`architecture-overview.md`（架构概览）、`project-introduction.md`（项目介绍）——工具、运行原理、项目解释三个主题从此闭环。

## 感知：目录不可读不再拖垮整个对话

审计发现感知模块有一个隐蔽的崩溃点：感知根目录遍历（`_perception_module_dirs`）对 `iterdir()` / `is_dir()` 没有任何异常保护——一旦某个感知根目录不可读或子目录损坏，`OSError` 会一路传播到 Prompt 构建，整个对话都无法进行。

修复分三层：

1. **目录遍历降级**：感知根目录不可读时跳过该根并记录 `scan_errors` 诊断，不再抛异常；
2. **sense.json 解析 OSError 全覆盖**：`data_md` / `start_update` 的 `resolve()` / `relative_to()` / `is_file()` 全部包异常保护，任何解析失败都标记为 invalid 而非传播；
3. **start_update 存在性校验**：Prompt 注册层现在会检查脚本文件是否存在，与 cron 采集层的判定一致——消除了"设置页显示感知正常、但采集永远失败"的假健康状态。

配套测试 `tests/core/test_perception_compatibility.py` 用 4 个用例覆盖了不可读根目录、脚本缺失、路径解析异常与正常回归。

## 子代理：超时不再意味着前功尽弃

1.0.1 之前，子代理调用无法单独设置超时——`subagent_dispatch` 固定用 `agent_runtime.default_timeout`（600 秒）。底层 `AgentRunner.run()` 早已支持 `timeout` 参数，但插件层一直没有透传。

更重要的变化是**超时存活期机制**：超时到点后不再立即判死，而是进入 `timeout_survival_seconds`（默认 120 秒）的收尾窗口——

- 存活期内自然完成 → 正常返回结果，并标记 `completed_after_timeout: True`；
- 存活期内主智能体仍可主动取消；
- 存活期结束仍未完成 → 才正式判定 `timed_out` / `timed_out_running`。

这对长任务（批量记忆整理、大型图谱同步）意义重大：以前"差一步完成"的任务会被直接判死，算了一半的结果永远拿不回来；现在它有机会在收尾窗口里把结果交出来。后台任务同样支持，`status` 查询会暴露 `survival_seconds` 与 `completed_after_timeout` 字段。

## 知识库与操作手册：覆盖矩阵补齐

按 12 类主题逐项对照全局知识库，发现 3 个缺口并补齐：

| 主题 | 新文档 | 内容 |
|------|--------|------|
| 工具/插件机制 | `plugin-development.md` | 插件发现规则、SKILL.md 结构（strict / timeout_policy / action 约定）、工具循环机制、执行规则、开发指南 |
| 运行原理/架构 | `architecture-overview.md` | 事件驱动设计定位、请求完整生命周期、模块职责与交互、并发与隔离模型、数据存储分工 |
| 项目解释 | `project-introduction.md` | 项目定位、核心能力、部署使用入口、相关项目 |

同时更新 `data_structure.md` 主索引，知识库体系从此 12 类主题全覆盖。

## 工具插件：17 个插件全面体检

对全部 17 个插件做了结构、提示词、调用逻辑、跨平台四维审计：

- **结构**：SKILL.md / Tool JSON / 工具名一致 / required 字段全部合格；
- **提示词**：全部含触发条件、参数语义、安全约束与流程确认；
- **跨平台**：shell 的 shell_type 分发与多候选解码、file / network 的系统编码兜底、multimodal 的统一资产解析——Windows 与 Linux 双平台均可运行；
- **修复**：`get_current_time` 与 `web_search` 的 SKILL.md 中，返回值示例块的代码标签从 `json` 改为 `text`（10+ 处），避免静态扫描把示例误当作 Tool 定义。

## 测试：从平铺到分类，从手工到一键

`tests/` 目录 51 个测试文件此前平铺在根目录，按主题重组为 13 个子目录（agents / config / core / cron / expand / history / memory / message / plugins / provider / skeleton / update_restart / web），每个子目录带 `__init__.py`；`memory_db.py` 保留为共享 fixture，`template_tests/` 保持独立合同系统。移动后所有 `parents[1]` 路径计算更新为 `parents[2]`。

同时新增开发期独立验收套件 `开发临时目录/test_kemo/`（9 个分组、25 个文件、65 用例），以及发布前编排器 `release_check.py`——一条命令跑完 test_kemo、后端全量、模板合同、编译检查、git 格式检查、前端测试与前端构建。

## 生态：kemo_graph 文件上传与网关 reasoning 修复

- **kemo_graph 新增 `import_file` 命令**：与 kemo-graph 项目 `POST /stores/import` 端点配套，multipart 文件上传（ASCII 文件名回退、RFC 5987 filename*、50MB 上限、防符号链接），内置库走 `/import`、portable 库走 `/stores/import`；
- **网关 reasoning 续轮回传**：kemo-adapter-api 的 opencode / codexmanager provider 此前丢弃 reasoning item，上游 Console Go 在 thinking 模式下强制要求回传 `reasoning_content`——已在网关侧修复，记忆热画像巡检链路随之恢复正常。

## Web：设置页多了配置 Schema 版本

`settings()` 快照新增 `schema_versions` 对象（配置结构 / 历史结构 / 记忆存储三个版本号），前端「版本查看」tab 新增「配置 Schema 版本」只读区块；`provider_timeout` 展示也从硬编码 120.0 改为读取真实配置。

---

## 从 1.0.0 到 1.0.1

| 领域 | 1.0.0 | 1.0.1 |
|------|-------|-------|
| 配置合同 | `injection_mode` 文档宣称三模式 | 配置项删除，核心硬编码 full + 旧配置兼容桥 |
| 感知健壮性 | 目录遍历无异常保护 | OSError 三层降级，不可读目录跳过并记录诊断 |
| 子代理超时 | 固定 600s，超时即判死 | 独立 timeout 参数 + 120s 存活期收尾窗口 |
| 知识库 | 21 个文档 | 24 个文档，12 类主题全覆盖 |
| 测试组织 | tests/ 51 文件平铺 | 13 个主题子目录 + test_kemo 验收套件 |
| 发布验收 | 手工逐项跑 | release_check.py 一键 7 阶段 |
| 生态 | 图谱只读操作 | import_file 文件上传 + 网关 reasoning 续轮修复 |

## 本次发布统计

- Commit 数：9 个
- 变更文件：114 个（含 tests/ 重组 49 删 + 49 增）
- 新增全局知识文档：`plugin-development.md`、`architecture-overview.md`、`project-introduction.md`
- 新增测试：`test_agent_timeout_survival.py`、`test_perception_compatibility.py`、`开发临时目录/test_kemo/`（65 用例）
- 新增工具：`开发临时目录/release_check.py`（发布前 7 阶段验收）
- 主要涉及：`run/agent_runner.py`、`run/agent_queue.py`、`run/prompt.py`、`run/prompt_sources.py`、`plugins/subagent_dispatch/`、`plugins/get_current_time/`、`plugins/web_search/`、`web/services/settings.py`、`global_knowledge/`、`agents.md`
- 版本变化：根版本、core、agents、plugins、web 全部更新至 `1.0.1`

## 验证

发布前已通过 `release_check.py` 全 7 阶段：

- test_kemo 验收套件：65 passed
- 后端全量测试：695 passed，2 skipped，48 subtests
- 模块模板合同测试：10 passed
- Python 编译检查：通过
- git 格式检查：通过
- 前端测试：22 个文件，170 passed
- 前端生产构建：通过

## 开始使用

```bash
cd kemo-agent
git pull
python update.py --module all
```

更新完成后，请完整重启 kemo-agent，使新的 Python 运行时与 Web 前端构建一起生效。

::: tip 升级提示
1.0.1 移除了 `prompt.injection_mode` 配置项。旧配置中的"全 full"残留会被静默接受；如果你曾经写入非 full 值，启动时会得到明确的"已移除；仅兼容旧值 full"错误，删掉该段即可。
:::

## 写在最后

1.0.0 回答了"外部知识以什么姿态协作"；1.0.1 回答的是"这条主链路到底牢不牢"。

一次系统性复核的价值，不在于发现了多少问题，而在于把"我以为没问题"变成"我知道它没问题"。感知目录不可读会拖垮对话、子代理超时丢失结果、文档宣称的功能代码从未实现——这些都是在真实运行中可能咬人的细节，现在它们有了测试、有了修复、有了文档。

主生态已经闭环，接下来是让它走得更稳。1.0.1 是一次深呼吸：边界更清楚，失败更可预测，回归更可重复。

Happy coding 🎉
