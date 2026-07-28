# 环境变量

首次安装会从 `.env.example` 生成 `.env`。环境变量主要用于 Provider 密钥、网络代理和 Web 入口，不替代用户级资源授权。

## Provider

| 变量 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `KEMO_API_KEY` | string | 空 | `provider.type=kemo` 的密钥兜底 |
| `KEMO_BASE_URL` | URL | `http://127.0.0.1:8741` | Kemo 协议根地址；当前 Kemo Gateway 默认监听 `7531`，接入时建议显式配置 |
| `KEMO_MODEL` | string | 空 | 仅在用户配置模型为空时使用；填写网关公开模型名 |
| `OPENAI_API_KEY` | string | 空 | `provider.type=chat` 的密钥兜底 |
| `OPENAI_BASE_URL` | URL | `https://api.openai.com/v1` | Chat Completions 兼容地址 |
| `OPENAI_MODEL` | string | 空 | Chat 模式模型兜底 |

::: warning Kemo Gateway 默认端口
kemo-agent 当前仍保留 `8741` 作为历史内置兜底值，而 Kemo Gateway 默认监听
`http://127.0.0.1:7531`。连接当前网关时应在 `.env` 或用户配置中显式填写
`http://127.0.0.1:7531`，且不要附加 `/v1` 或具体接口路径。完整步骤见
[接入 Kemo Gateway](/guide/kemo-gateway)。
:::

## 网络与插件

| 变量 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `HTTP_PROXY` | URL | 空 | HTTP 代理，空时直连 |
| `HTTPS_PROXY` | URL | 空 | HTTPS 代理，空时直连 |
| `TAVILY_API_KEY` | string | 空 | `web_search` 插件密钥；为空时工具仍可发现，调用时返回配置提示且不发起网络请求 |

## 运行日志

| 变量 | 类型 | 默认值 | 说明 |
|---|---|---:|---|
| `KEMO_LOG_RETENTION_DAYS` | integer | `90` | SQLite 结构化 Cron/消息日志保留天数；`0` 表示不自动清理。旧 JSONL/Markdown 兼容日志不会由该参数删除 |

TLS 始终使用系统默认验证策略，没有关闭证书验证的环境变量。

## Web 服务

| 变量 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `WEB_HOST` | string | `127.0.0.1` | 监听地址 |
| `WEB_PORT` | integer | `1357` | 首选端口 |
| `WEB_ACCESS_TOKEN` | string | 空 | Web Token 登录；通过登录页请求体提交，不进入 URL、Cookie 或浏览器存储 |
| `WEB_USERNAME` | string | 空 | Web 登录用户名，必须与密码成对配置 |
| `WEB_PASSWORD` | string | 空 | Web 登录密码 |
| `WEB_SESSION_SECRET` | string | 自动生成 | 会话签名密钥；多进程或要求重启后保持登录时应显式设置强随机值 |
| `WEB_SESSION_COOKIE_NAME` | string | `kemo_agent_session` | 签名 Session Cookie 名称；同域多实例应使用不同名称 |
| `WEB_AUTH_IP_MAX_FAILURES` | integer | `0` | 单个 IP 在同一认证阶段允许的失败次数；空或 `0` 表示不限 |
| `WEB_AUTH_IP_WINDOW_SECONDS` | integer | `600` | 失败次数统计窗口（秒） |
| `WEB_AUTH_IP_LOCK_SECONDS` | integer | `900` | 达到上限后的锁定时间（秒） |
| `WEB_AUTH_TRUSTED_PROXIES` | string | 空 | 可信反向代理 IP/CIDR，多个值用逗号分隔 |

CLI 还会读取 `KEMO_USER` 作为默认内部用户。

认证流程由已配置的字段决定：只配置 Token 时先验证 Token；只配置用户名和密码时直接显示账号登录；两种方式同时启用时，必须先通过 Token，再验证用户名和密码。双重认证的中间状态有效 5 分钟，完整签名会话默认有效 2 小时。

失败限制按“客户端 IP + 认证阶段”分别统计。达到上限时返回 HTTP 429；限制状态只保存在当前 Web 进程内，重启后清空。只有直连来源属于 `WEB_AUTH_TRUSTED_PROXIES` 时才会采信 `X-Forwarded-For`，否则始终使用直连 IP。

::: warning 浏览器中的认证信息
Token、用户名和密码只出现在对应的 POST 请求体中，签名 Cookie 不保存这些明文。浏览器所有者仍能在开发者工具的当次网络请求中查看自己输入的值，因此公开网络部署还应使用 HTTPS。
:::
