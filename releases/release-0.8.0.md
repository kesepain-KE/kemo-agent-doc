# v0.8.0 更新说明

`v0.8.0` 是模型能力适配与模块创建验收的功能版本。Kemo 模型思考档位不再由前端固定猜测，
而是由当前密钥可见的模型能力声明动态生成；同时新增六类独立合同测试，帮助智能体在创建模块后
验证它们能否真正接入框架。本次变更涉及 core、agents、plugins 和 web，四个组件统一升级。

## Kemo 动态思考档位

- 只有已保存 Provider 为 `kemo`、Base URL 与调用密钥有效、模型目录读取成功时才启用动态能力。
- 选择模型后优先使用目录条目的 `capabilities_url`，兼容旧
  `/model/capabilities?model=...` 路径。
- 界面档位完全来自 `reasoning.efforts`，支持模型声明的 `xhigh` 等子集，不根据模型名猜测。
- 用户选择的是 Kemo 逻辑档位；`reasoning_effort_map` 仅用于提示，厂商映射仍由网关执行。
- 已保存档位失效时优先回退 `medium`，否则使用声明的第一项；模型不支持推理时不提交
  `reasoning` 参数。
- 主对话、聊天页顶部模型卡片、设置页和子代理共用这一策略；`chat` 协议保持原有固定档位链路。
- 能力按 Base URL、密钥和模型隔离缓存；临时刷新失败可展示上一次成功结果并明确提示，没有缓存
  时不会静默退回固定五档。

## Provider 与多模态协议加固

- 模型能力声明增加任务类型、推理档位、工具能力和多模态操作的一致性校验。
- 流式工具、媒体、Usage 和终态事件会校验必需字段及响应状态，减少 HTTP 200 但内容无效时的
  静默失败。
- 多模态工具可以识别由 Kemo Gateway 持有的远程 Asset ID，不再强制把所有 ID 当作当前 Run
  的本地附件；鉴权、过期和网关故障仍会明确返回错误。
- 主对话与子代理都只提交目标模型真实支持的推理配置。

## 模块创建后的合同验收

新增 `tests/template_tests/`，按六种资源独立维护：

```text
agent / expand / message / sense / skills / user
```

每类都拥有自己的标准、验证器、命令入口和回归测试。验收只约束框架必须依赖的发现、入口、
出口、生命周期和通信协议，不限制模块内部文件夹、源码规模或工程类型。支持文本与 JSON 报告、
超时、静态检查和模板模式；依赖真实网络、设备或账号的检查会标记 `SKIP`，不会冒充完整通过。

详细命令见[模块合同验收](/dev/template-validation)。

## 前端测试稳定性

前端 Vitest 为大型页面集成测试设置有限超时，并在 CI 中限制 jsdom 并发 Worker，降低 GitHub
托管 Runner 短时 CPU/内存紧张造成的概率性超时。测试仍保留明确上限，不会无限等待或掩盖真实
失败。

## 升级步骤

```bash
python update.py --module all
```

Linux 环境如没有 `python` 命令，可使用：

```bash
python3 update.py --module all
```

更新完成后完整重启 kemo-agent，使新的 Provider 能力缓存、运行时策略和 Web 资源生效。动态
档位要求 Kemo Gateway 提供有效模型目录与能力声明；仅升级 kemo-agent 不会为上游当前不可用的
模型恢复服务。
