# 接入 Kemo Gateway

[Kemo Provider Gateway](https://github.com/kesepain-KE/kemo-adapter-api) 是
`provider.type=kemo` 对应的原生模型网关。它把不同厂商的鉴权、请求格式、流式事件、工具调用、
错误和 Token 计量封装在独立 Provider 包中；kemo-agent 只面对 Kemo Protocol `1.0`。

本页只说明 **kemo-agent 如何连接网关**。网关部署、Provider 创建和完整公开协议以
[网关 README](https://github.com/kesepain-KE/kemo-adapter-api/blob/main/README.md) 与
[公开 API 文档](https://github.com/kesepain-KE/kemo-adapter-api/blob/main/api.md) 为准。

## 调用关系

```text
kemo-agent
  ├─ GET  /model/models?task=llm              获取当前密钥可用模型
  ├─ GET  <catalog.capabilities_url>           读取所选模型能力
  │          └─ /model/capabilities?model=...  旧路径兼容
  └─ POST /model/responses                    文本、流式与工具调用
              │
              ▼
       Kemo Gateway Core
              │
              ▼
  providers/<provider_id>/                    厂商私有协议与计量
```

kemo-agent 负责组织多轮输入、执行本地工具并把工具结果送入下一次模型请求。网关和厂商 Provider
只负责声明与翻译工具调用，不会替智能体执行工具。

## 连接前提

连接前至少确认：

1. Kemo Gateway 已启动，且存在至少一个已注册、未禁用的 LLM Provider；
2. 使用的是网关 **模型调用密钥**，并具有 `model:invoke` 或 `owner` scope；
3. 密钥的 `allowed_models` 白名单允许目标模型；
4. kemo-agent 能访问网关的协议根地址；
5. 模型名来自网关模型目录，而不是直接填写厂商原始模型名。

::: warning 三类凭据不能混用
网关模型调用密钥、网关 Web 管理凭据和 `STATUS_TOKEN` 用途不同。kemo-agent 的
`provider.api_key` / `KEMO_API_KEY` 必须填写模型调用密钥，不能填写 Web Token 或状态 Token。
:::

## Base URL

当前 Kemo Gateway 默认监听 `http://127.0.0.1:7531`。kemo-agent 仍保留
`http://127.0.0.1:8741` 作为历史内置兜底值，因此接入当前网关时应显式配置：

```dotenv
KEMO_BASE_URL=http://127.0.0.1:7531
```

这里必须填写 **协议根地址**：

- 正确：`http://127.0.0.1:7531`
- 正确：`https://gateway.example.com`
- 错误：`http://127.0.0.1:7531/v1`
- 错误：`http://127.0.0.1:7531/model/responses`

kemo-agent 会自行追加 `/model/models`、`/model/capabilities` 和 `/model/responses`。Kemo 模式
不会像 `chat` 模式一样自动补全 `/v1`。

如果网关部署在另一台设备、容器或反向代理后，`127.0.0.1` 指向的是 kemo-agent 自己所在的
环境，必须改成 kemo-agent 实际可访问的网关地址。网关控制台显示的 `GATEWAY_BASE_URL` 只用于
帮助复制外部地址，不会替 kemo-agent 自动修改配置。

## 推荐配置

### 使用环境变量保存密钥

在 kemo-agent 的 `.env` 中填写：

```dotenv
KEMO_API_KEY=replace-with-your-gateway-key
KEMO_BASE_URL=http://127.0.0.1:7531
KEMO_MODEL=deepseek-deepseek-v4-flash
```

不要把包含真实密钥的 `.env` 提交到 Git。

### 用户 Provider 配置

`users/<name>/user_config.json` 中的配置示例：

```json
{
  "provider": {
    "type": "kemo",
    "base_url": "http://127.0.0.1:7531",
    "api_key": "",
    "api_key_env": "KEMO_API_KEY",
    "model": "deepseek-deepseek-v4-flash",
    "stream": true,
    "reasoning_effort": "medium",
    "input_modalities": ["text"]
  }
}
```

用户配置中的 `api_key` 优先级高于 `api_key_env`。留空并通过 `.env` 提供密钥通常更不容易误
提交。`model` 必须使用网关公开名称：

```text
<provider_id>-<厂商原始模型名>
```

例如厂商 ID 为 `deepseek`、原始模型名为 `deepseek-v4-flash` 时，公开模型名为
`deepseek-deepseek-v4-flash`。

## 保存配置与获取模型

kemo-agent 不会在任意草稿状态下探测外部地址。Web 设置页只有同时满足以下条件才拉取模型：

1. Provider 配置已经成功保存到当前用户配置；
2. 已保存的 `provider.type` 为 `kemo`；
3. Base URL 和 API Key 可以解析；
4. 网关鉴权成功，并返回有效的 Kemo 模型目录。

随后框架请求：

```http
GET /model/models?task=llm
Authorization: Bearer <gateway-key>
X-Kemo-Protocol-Version: 1.0
```

结果是当前密钥视角的可用模型，会同时受到以下条件影响：

- 密钥 `allowed_models` 白名单；
- `model:invoke` / `owner` scope；
- Provider 和模型的全局启停状态；
- Provider 的真实能力声明。

因此“网关注册了模型”不代表每个密钥都能看到它。`chat` 模式、未保存配置、凭据缺失、鉴权
失败或响应协议无效时，框架一律不拉取模型，也不会退回未经验证的静态列表。

## 动态思考能力

模型目录中的每个 LLM 条目可以提供自己的 `capabilities_url`。kemo-agent 优先访问该地址，并
校验它仍与已配置的网关同源，避免把 Bearer 密钥发送到目录声明的外部地址；目录未提供时才
使用旧接口：

```http
GET /model/capabilities?model=<model>
Authorization: Bearer <gateway-key>
X-Kemo-Protocol-Version: 1.0
```

响应的 `reasoning.supported` 和 `reasoning.efforts` 决定界面实际显示哪些思考档位。客户端只
提交用户选择的 Kemo 逻辑档位，不使用 `reasoning_effort_map` 自行替换成厂商档位。例如能力
声明 `max → high` 时，请求仍提交 `max`，实际转换由网关 Provider 完成。

当 `reasoning_policy.mode=mapped` 或 `collapsed=true` 时，界面只作解释性提示，不删除合法
档位。模型不支持推理时，主对话和子代理都不会发送 `reasoning`；能力接口失败且没有历史成功
缓存时也不会假定模型支持固定五档。能力声明表示协议能力，不代表上游此刻一定可达，实时 400、
限流和网络错误仍应按 Provider 调用故障排查。

## 文本、流式和工具调用

选择模型后，kemo-agent 使用 `POST /model/responses`，并发送 Kemo Protocol `1.0`、Bearer
鉴权、`Idempotency-Key` 和请求 ID。普通文本、SSE 流式、推理档位或工具调用能否使用，最终
取决于目标 Provider 对该模型的真实声明与实现。

工具调用链路为：

```text
模型返回 tool_call
  → 网关转换为 Kemo 工具事件
  → kemo-agent 校验并执行本地插件工具
  → kemo-agent 将 tool_result 送入下一次模型请求
  → 模型继续回答
```

Provider 不执行工具；kemo-agent 也不会绕过网关能力声明猜测模型支持工具。

## 网关运行状态拓展

kemo-agent 自 `v0.6.0` 起内置全局拓展 `global_expand/kemo_gateway_status/`，用于消费网关公开的只读
`GET /status`。它与主 Provider 的模型调用链路相互独立，默认未激活；安装、拉取或更新
kemo-agent 不会自动连接网关。

### 网关侧配置

在 Kemo Gateway 的 `.env` 中配置独立状态 Token：

```dotenv
STATUS_TOKEN=replace-with-a-dedicated-random-token
```

修改后必须重启网关。`STATUS_TOKEN` 不能与模型调用密钥、Web Token 或其他管理凭据相同。

### 激活

用户明确要求“激活 Kemo 网关状态拓展”并提供网关根地址与状态 Token 后，主智能体执行等价调用：

```text
expand_call(
  scope="global",
  module="kemo_gateway_status",
  command="activate",
  params={
    "base_url": "http://127.0.0.1:7531",
    "status_token": "<独立 STATUS_TOKEN>"
  }
)
```

拓展会先验证 `/status` 和响应合同，成功后才保存本地配置并打开状态注入。采集产物包括：

- 适合进入 Prompt 的简短 Markdown 摘要；
- 严格字段白名单过滤后的脱敏 JSON 快照；
- 展示运行、版本、Provider、调用、延迟和 Token 数据的 `1600×900` PNG 图表。

本地配置文件、运行诊断、快照和图表均被 Git 忽略。摘要和图表不会包含状态 Token、模型调用
密钥、Provider 密钥、系统提示词、请求正文或原始错误正文。

### 后续命令

| 命令 | 说明 |
| --- | --- |
| `refresh` | 立即刷新状态；可指定 `date=YYYY-MM-DD` |
| `configuration_status` | 只查看本地激活状态，不联网、不返回 Token |
| `deactivate` | 删除本地凭据和产物、关闭注入，不改变网关 |

反向代理、容器或 FRP 部署必须直接填写 kemo-agent 实际可访问的最终根地址。状态客户端拒绝
HTTP 重定向，避免把 Token 发送到配置地址之外的主机。

## 当前能力边界

Kemo Gateway `0.7.1` 已提供 LLM、Embedding、Rerank、模型发现、能力声明和 Asset API 接口，
但 kemo-agent 主 Provider 的自动模型目录使用 `task=llm`，不会把 Embedding 或 Rerank 模型当作对话模型。

图片、音频、视频、普通文件、媒体生成、Provider State 和流恢复属于可扩展协议范围，
但不能仅凭 `provider.type=kemo` 就视为可用。只有当前网关已经实现对应公开接口、目标 Provider
明确声明能力、且模型通过真实验证时才能启用。Asset 上传与检索在 `0.7.0` 已可用；
Provider State 服务或完整流恢复在 `0.7.1` 仍不保证。

### 传输稳定性增强（0.7.1+）

当前 Kemo Gateway 在生产中默认启用以下传输稳定性特性：

**SSE 心跳**：流空闲时每 15 秒发送注释心跳（`: kemo-heartbeat\n\n`）。心跳不推进协议 sequence，仅保持代理/CDN/隧道连接活跃。可通过 `SSE_HEARTBEAT_SECONDS` 环境变量调整。

**持久化执行存储**：幂等记录、响应终态和 SSE 事件持久化到 SQLite WAL 数据库 `storage/executions/executions.sqlite3`。连接断开后，客户端可使用相同请求正文、`request_id` 和 `Last-Event-ID` 从下一事件续传。默认保留 24 小时（`EXECUTION_RETENTION_HOURS`）。

**执行超时与并发上限**：LLM、Embedding 和 Rerank 受 `MODEL_EXECUTION_TIMEOUT_SECONDS`（默认 900 秒）核心时限保护，超时返回 `GATEWAY_TIMEOUT`。单进程并行执行上限为 `MAX_CONCURRENT_EXECUTIONS`（默认 64），超过时返回 503 `GATEWAY_OVERLOADED`。

**Producer 隔离**：调用方取消不会杀死已在运行的 Provider 上游执行，网关进程重启后未结束的执行被确定性终结为 `incomplete/gateway_restarted`。

详细边界与超时/容量/错误码/续传规则见 [公开 API 文档](https://github.com/kesepain-KE/kemo-adapter-api/blob/main/api.md)。

### 网关管理端安全（0.7.1）

Kemo Gateway 管理端在 `0.7.1` 延续安全管理边界，并补充了稳定性与多入口部署处理：

- **会话管理**：浏览器登录后使用 HttpOnly + SameSite=Strict Cookie，前端不再保存 Bearer Token
- **密钥脱敏**：API 密钥列表只返回安全掩码，完整调用密钥不再回传浏览器。
  通过 Eye 按钮可短暂查看完整密钥 8 秒，或一键复制到剪贴板——每次操作都需 owner 权限
  并经过独立 POST 端点确认，不会在列表或网络日志中泄漏明文。
- **凭据保护**：Provider 请求头值（如 `X-API-Key`、`Authorization`）不在管理界面显示
- **Web Token**：禁止放入 URL，只能在登录表单中提交

这些变更不影响 kemo-agent 的模型调用链路（仍使用 Bearer Token），但如果你通过浏览器管理
网关，登录方式和安全边界已经改变。公网部署时需要同时配置 `WEB_TOKEN`、`WEB_USERNAME`、
`WEB_PASSWORD`，通过反向代理提供 HTTPS，并设置 `WEB_ALLOWED_HOSTS`。详见
[网关 README](https://github.com/kesepain-KE/kemo-adapter-api/blob/main/README.md)。

## 重启交接与延迟指标补充

网关更新后的重启会先请求旧实例优雅退出，再由独立 replacement 进程等待旧 PID 与监听端口释放。只有 PID 文件中的 `pid` 和 `instance_id` 仍对应同一旧实例时，replacement 才会在超时后升级终止，避免 PID 被系统复用时误伤其他进程。重启时会重新读取当前 `.env`：已从文件删除的旧变量不会继承到新实例，显式进程环境覆盖仍保留。

管理端与状态拓展中的“响应延迟”现在指从网关接收请求到第一个 Provider 响应事件到达的时间；完整执行至终态的耗时作为独立 `duration_ms` 保留在调用日志中。流式请求的首个文本、音频、推理、工具或终态事件都可以标记首响应。旧统计 SQLite 数据库会在读取时自动补齐相关列。

`WEB_COOKIE_SECURE=auto` 按当前管理请求实际使用的 HTTP/HTTPS scheme 决定 Secure 属性，而不是只依据 `GATEWAY_BASE_URL`。因此同一网关可同时通过公网 HTTPS 与可信局域网 HTTP 访问；公网反向代理应正确传递 `X-Forwarded-Proto`，公网入口仍建议配置 `WEB_TOKEN`、用户名密码、HTTPS 与 `WEB_ALLOWED_HOSTS`。

## 常见问题

| 现象 | 优先检查 |
| --- | --- |
| 连接被拒绝 | 网关是否启动；Base URL 主机和端口是否可达 |
| 请求路径出现 `/v1/model/...` | Kemo Base URL 错误包含了 `/v1` |
| `401` | 是否误用了 Web Token/`STATUS_TOKEN`，或模型调用密钥不正确 |
| `403` | 密钥 scope、模型白名单或资源授权 |
| `404` 模型不存在 | 是否使用完整公开模型名；Provider/模型是否已注册并启用 |
| API 有效但模型目录为空 | `allowed_models`、scope、任务类型和能力声明 |
| `503` | 网关正在 Drain、Provider 不可用，或对应服务未启用 |
| 文本可用但工具失败 | 模型工具能力、Provider 工具映射、参数 JSON 和网关调用日志 |
| 状态拓展返回 `401` | 是否使用独立 `STATUS_TOKEN`，而不是模型调用或 Web 密钥 |
| 状态拓展返回 `503` | 网关是否已配置状态 Token；Token 是否与其他凭据重复；修改 `.env` 后是否重启 |
| 测试可达但业务失败 | 探测仅验证最小调用；继续检查真实请求参数、上下文与工具能力 |

排查时可同时查看 Kemo Gateway 控制台中的模型探测、调用日志与失败日志。不要把完整 API Key、
Provider 密钥、请求正文或原始厂商响应复制到公开 Issue。
