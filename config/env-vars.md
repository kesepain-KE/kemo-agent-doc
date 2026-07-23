# 环境变量

首次安装会从 `.env.example` 生成 `.env`。环境变量主要用于 Provider 密钥、网络代理和 Web 入口，不替代用户级资源授权。

## Provider

| 变量 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `KEMO_API_KEY` | string | 空 | `provider.type=kemo` 的密钥兜底 |
| `KEMO_BASE_URL` | URL | `http://127.0.0.1:8741` | Kemo 协议根地址 |
| `KEMO_MODEL` | string | 空 | 仅在用户配置模型为空时使用 |
| `OPENAI_API_KEY` | string | 空 | `provider.type=chat` 的密钥兜底 |
| `OPENAI_BASE_URL` | URL | `https://api.openai.com/v1` | Chat Completions 兼容地址 |
| `OPENAI_MODEL` | string | 空 | Chat 模式模型兜底 |

## 网络与插件

| 变量 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `HTTP_PROXY` | URL | 空 | HTTP 代理，空时直连 |
| `HTTPS_PROXY` | URL | 空 | HTTPS 代理，空时直连 |
| `TAVILY_API_KEY` | string | 空 | `web_search` 插件密钥；为空时工具不暴露 |

TLS 始终使用系统默认验证策略，没有关闭证书验证的环境变量。

## Web 服务

| 变量 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `WEB_HOST` | string | `127.0.0.1` | 监听地址 |
| `WEB_PORT` | integer | `1357` | 首选端口 |
| `WEB_ACCESS_TOKEN` | string | 空 | URL `?token=...` 入口令牌 |
| `WEB_USERNAME` | string | 空 | Web 登录用户名，必须与密码成对配置 |
| `WEB_PASSWORD` | string | 空 | Web 登录密码 |
| `WEB_SESSION_SECRET` | string | 自动生成 | 会话签名密钥 |
| `WEB_SESSION_COOKIE_NAME` | string | `kemo_agent_session` | 多实例 Cookie 隔离名 |

CLI 还会读取 `KEMO_USER` 作为默认内部用户。

::: warning Token 的使用方式
启用 `WEB_ACCESS_TOKEN` 后，通过 `?token=...` 建立签名会话。Web 不把它当作 `Authorization: Bearer` 令牌使用。
:::
