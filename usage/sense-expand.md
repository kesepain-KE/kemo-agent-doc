# 感知与拓展

感知和拓展都能向提示词提供外部环境信息，但职责不同：感知是单向采集，拓展还可以描述并执行外部操控。

## 能力对比

| 维度 | 感知 Sense | 拓展 Expand |
|---|---|---|
| 数据流 | 环境 → Agent | 环境 ↔ Agent |
| 主要位置 | `global_sense/<module>/` | 全局、共享、用户三层 |
| 清单 | `sense.json` | `expand.json` |
| 操控入口 | 无 | 可选 `start_expand.py` |
| 提示词内容 | 健康的数据文件 | 健康输入数据 + 操控手册注入层 |
| 主动调用 | 不适用 | `expand_call(scope, module, command, params)` |

## 健康与刷新

只有健康状态正常的感知数据或开启且健康的拓展输入才会注入。后台刷新脚本在独立 Python 子进程运行，单模块默认超时 120 秒；非零退出、超时、`False` 或 `{ok: false}` 都视为失败。

感知模块只面向全局层。拓展可位于 `global_expand/`、`shared_expand/` 或 `users/<user>/expand/`，主智能体再通过白名单选择。

模板目录只定义框架边界，不规定模块内部结构。极小的时间感知可以保持三个文件；浏览器自动化、嵌入式设备或第三方开源项目也可以在模块目录内保留自己的包、资源和多层子目录。只有清单声明的入口和数据文件会被框架自动读取或执行。

拓展采集入口可以采集 JSON、Markdown、网页、设备状态、API 余额或其他数据。`input_data.md` 只应保存适合进入 Prompt 的摘要或资源索引，大型数据保存在模块目录内。采集结果可以通过 `resources` 声明这些文件，但框架不会把完整文件自动注入提示词。

拓展操控由 `expand_call` 在隔离子进程中调用 `execute(command, params)`。结构化结果直接回到当前工具循环，不经过 `input_data.md`；图片、音视频、日志和其他大型结果通过 `artifacts` 返回，验证后复制到当前用户的 `download`。隔离子进程用于生命周期和进程树回收，不是操作系统权限沙箱，因此只能启用受信任模块。


## 注入开关（v1.0.5 起）

感知与拓展各自拥有独立的用户级总闸门与实时开关：

- `perception.prompt_injection` / `expand.prompt_injection`（默认 `true`）：总闸门。关闭时对应 `[perception]` / `[expand_data]` 段完全不进入系统提示词；
- `perception.realtime_injection` / `expand.realtime_injection`（默认 `false`）：开启后每次逻辑 Provider 请求前重读最新快照，工具续轮、运行中引导续轮与压缩重试都会看到最新数据。

三态行为：**不注入**（数据照常采集，只不进提示词）/ **按轮注入**（本轮固定快照，Prompt Cache 命中率最高）/ **实时注入**（每次请求前取最新）。关闭状态在 Prompt 分段诊断中报告为 `disabled`，而不是空段。Web 设置页「来源白名单」区域提供对应开关，总闸门关闭时实时开关自动禁用。

## 内置 Kemo 网关状态拓展

`global_expand/kemo_gateway_status/` 是默认未激活的内置全局拓展。它只读调用 Kemo Gateway
`GET /status`，使用独立 `STATUS_TOKEN` 生成脱敏状态摘要和 PNG 图表。用户未明确激活时不会连接
网关或注入状态；`deactivate` 只删除本地配置与产物，不会修改网关。

具体配置、命令与故障排查见[接入 Kemo Gateway](/guide/kemo-gateway#网关运行状态拓展)。

## 内置 Android App 桥接拓展

`global_expand/kemo_app/` 是 Android 客户端（kemo-agent-app）的常驻桥接服务全局拓展，运行于独立端口，提供 HTTP/SSE/WebSocket 三类接口：两级认证（设备 Token + 账号）、流式对话与运行中引导/取消、历史操作（列出/加载/删除/压缩/撤销上一轮）、任务与定时、状态、模块、文件（单次上传上限 80 MiB）、模型发现（仅限 Kemo 协议）与在线设备事件推送。

桥接服务的凭据与运行时文件（`config.json`、`users.json`、`credential_registry.json` 等）只存在于本地部署副本，不进入仓库；App 端生态说明见 [kemo-agent-app](/guide/kemo-agent-app)。

`kemo_app` 的激活选择属于部署端本地状态。首次安装仍保持未激活；管理员显式激活后，执行 `core` 板块更新或全量更新会保留已有的 `open_input=true`，即使复制文件期间 Token、用户、上游地址等 readiness 条件暂时无法校验，也不会清除这一激活选择。管理员显式执行 `stop` / `deactivate` 后则继续保持停用，更新器不会重新激活它。

保留激活选择不等于跳过运行时安全检查：桥接进程实际启动时仍会校验设备 Token、会话密钥、启用用户、上游地址和端口等条件，配置不完整时不会启动。更新器只刷新公开实现，并保留部署端的 `config.json`、`users.json`、`credential_registry.json`、`_runtime.json`、`input_data.md` 和日志等本地配置、凭据与运行数据。上述规则只适用于 `kemo_app`，不改变其他全局拓展的激活语义。

::: tip 如何选择
只需要把环境状态提供给智能体时使用感知；需要对外部系统执行操作时使用拓展；只提供工作方法和说明时更适合技能。
:::
