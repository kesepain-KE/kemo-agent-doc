# 模块合同验收

`tests/template_tests/` 用于检查智能体创建的模块能否被 kemo-agent 正确发现、加载和调用。
它只验证框架依赖的入口、出口、生命周期、数据格式和跨模块通信合同，不限制模块内部结构。
单文件实现、任意嵌套包、设备工程、浏览器自动化、API 客户端或完整第三方项目都可以放在模块
目录内。

## 按类型运行

在 kemo-agent 项目根目录执行与创建资源相匹配的命令：

| 资源 | 命令 |
|---|---|
| 子代理 | `python -m tests.template_tests.agent --target users/<user>/agents/<name>` |
| 拓展 | `python -m tests.template_tests.expand --target users/<user>/expand/<name>` |
| 外部消息路由 | `python -m tests.template_tests.message --target message/out/<platform>` |
| 感知 | `python -m tests.template_tests.sense --target global_sense/<name>` |
| 技能 | `python -m tests.template_tests.skills --target users/<user>/user_skills/<scope>` |
| 用户包 | `python -m tests.template_tests.user --target users/<name>` |

全局、共享和用户作用域只影响 `--target` 路径，不改变验收类型。只有候选类型未知或外部程序
需要统一入口时，才使用薄分发命令：

```bash
python -m tests.template_tests --kind auto --target <path>
```

`task_cron` 与 `task_plan` 不在这组六类业务验收范围内；用户包只检查它们的初始化目录，不测试
任务状态机。

## 常用选项

- `--format text|json`：选择人类可读或结构化报告；
- `--report <path>`：把报告同时保存到文件；
- `--timeout <seconds>`：限制每个隔离子进程；
- `--static-only`：只检查并导入入口，不调用采集器、操控器或 executor；
- `--template-mode`：检查仓库参考模板，允许待替换占位符，并把缺失的可选 SDK 标为 `SKIP`；
- `--repository-root <path>`：显式指定用于加载真实框架合同的项目根目录。

Windows PowerShell 和 Linux Shell 使用相同 Python 模块入口，只需按各自语法书写路径与续行。

## 理解报告

| 状态 | 含义 |
|---|---|
| `PASS` | 合同已实际验证 |
| `FAIL` | 基础合同不成立，修复后必须重试 |
| `WARN` | 合同成立，但存在部署或维护风险 |
| `SKIP` | 缺少凭据、设备、网络、可选 SDK，或动态检查被关闭 |

退出码 `0` 和 JSON 中的 `ok=true` 只表示没有 `FAIL`；只有 `complete=true` 才表示没有
`SKIP`。合同通过不能代替真实平台、硬件、浏览器、网络和 Provider 集成测试。

## 隔离与安全边界

动态模式会把候选目录复制到临时项目根，再通过真实发现器和带超时的子进程检查入口与出口，
不会改写原候选目录。消息路由验收只使用合成消息，不启动平台、不发送消息，也不执行在线健康
检测。

临时副本不是恶意代码沙箱。候选代码仍可能访问网络、设备或绝对路径，`--static-only` 也需要
导入入口模块。来源不可信时应先人工审查，并在操作系统级隔离环境中执行。

## 维护边界

六类资源分别位于 `agent/`、`expand/`、`message/`、`sense/`、`skills/` 和 `user/`，每类都有
自己的 `STANDARD.md`、验证器、CLI 和回归测试。创建什么模块就读取并运行对应目录的标准；修改
一种公开合同也只维护该类型。根目录仅保留报告、临时沙箱、类型识别和薄分发等公共设施，避免
形成集中处理所有业务规则的测试“上帝模块”。
