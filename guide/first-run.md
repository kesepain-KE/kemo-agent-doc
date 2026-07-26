# 首次运行

首次启动会同时建立 Web 服务和 RuntimeHost。后者负责 Cron、消息路由与后台维护；默认监听 `127.0.0.1:1357`。

## 启动后先检查

1. 终端没有依赖、配置或 Provider 错误。
2. 浏览器能打开启动器输出的实际地址。
3. Web UI 能列出创建好的内部用户。
4. 设置页可读取脱敏配置，状态页能显示运行状态。

## 内部用户与 Web 登录不是一回事

内部用户对应 `users/<name>/` 工作空间，决定使用哪套人格、记忆、知识、历史和 Provider 配置。`WEB_USERNAME` / `WEB_PASSWORD` 则保护网页入口，两者不要混淆。

如果还没有内部用户，运行：

```bash
python user_create.py
```

## Provider 配置

每个用户的 `user_config.json` 可选择 `kemo` 或 `chat` Provider。用户文件中的 `provider.api_key` 优先；为空时才读取 `.env` 中对应的环境变量。

::: danger 不要提交密钥
`.env` 和用户配置中的真实 API Key 都不应提交到 Git。示例文件只能使用占位值。
:::

## 第一次对话

选择用户后进入聊天页并发送一条简单消息。如果模型请求失败，优先检查 Provider 类型、Base URL、模型名和 API Key，而不是反复重试。

成功对话会写入完整历史并参与后续记忆处理。Provider 失败或用户取消也会保存为带明确终态标记的轮次，便于下一轮继续，但不会伪装成成功答复、生成记忆或给记忆加权。
