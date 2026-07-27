# Provider 配置

kemo-agent 内部使用统一请求契约，对外提供 `kemo` 原生网关和 `chat` 兼容模式。一次 Run 开始前会固定 Provider 类型，失败时不会跨协议自动回退。部署和鉴权流程见
[接入 Kemo Gateway](/guide/kemo-gateway)。

## 两种模式

| 能力 | `chat` | `kemo` |
|---|---|---|
| 接口 | `/v1/chat/completions` | Kemo 原生协议 |
| 文本与工具调用 | 支持 | 支持 |
| 图片输入 | 标准 `image_url` | 仅在网关、Provider 与模型共同声明支持时使用 |
| 音频、视频与普通文件 | 不支持 | 协议可表达，实际能力由网关声明 |
| 媒体生成与转换 | 不支持 | 协议可扩展，不能默认视为已实现 |
| Provider State / 流恢复 | 不提供 | 仅在网关真实实现时使用；当前不保证完整支持 |
| 地址处理 | 自动补全 `/v1` | 保持协议根地址 |

`provider.input_modalities` 用于声明主模型已经确认支持的输入类型，必须包含 `text`。Chat 模式只允许增加 `image`；Kemo 模式还可声明 `audio`、`video`、`file`，并会与网关能力交叉验证。框架不会仅凭模型名称猜测多模态能力。

## 解析优先级

密钥顺序：

1. 当前用户 `provider.api_key`。
2. `provider.api_key_env` 指向的变量，或类型默认的 `KEMO_API_KEY` / `OPENAI_API_KEY`。
3. 都不存在则明确报错。

地址顺序：用户 `provider.base_url` → 类型对应环境变量 → 内置默认地址。最终地址会去除尾部 `/`。
Kemo 模式填写协议根地址，不附加 `/v1` 或 `/model/responses`。kemo-agent 仍以 `8741` 作为历史
内置兜底值，连接默认运行于 `7531` 的当前 Kemo Gateway 时必须显式配置地址。

## Kemo Gateway 示例

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

Kemo 公开模型名固定为 `<provider_id>-<厂商原始模型名>`。Web 设置页只在配置已保存、类型为
`kemo` 且 API 鉴权有效时请求 `/model/models?task=llm`；`chat`、未保存草稿或无效凭据不会触发
模型拉取。目录结果还会应用当前密钥的 scope、模型白名单和 Provider/模型启停状态。

## Chat 兼容示例

```json
{
  "provider": {
    "type": "chat",
    "base_url": "https://api.openai.com/v1",
    "api_key": "",
    "api_key_env": "OPENAI_API_KEY",
    "model": "your-model",
    "stream": true,
    "reasoning_effort": "medium",
    "input_modalities": ["text", "image"]
  }
}
```

Provider 单次请求超时由源码固定为 120 秒，用户配置不接受 `timeout` 或自定义 `headers`。

::: tip 多模态模型
`multimodal_models` 可分别声明识图、图片生成/编辑、语音识别/生成、语音到语音、视频理解和视频生成模型。专用工具只调用明确填写的能力模型，不会把不支持该操作的主模型当作兜底。

图片路由由 `multimodal_routing.vision` 控制：`auto` 在主模型明确支持图片时优先直传，否则使用专用视觉模型；`main` 仅使用主模型；`dedicated` 仅使用 `multimodal_models.vision`。Chat 模式只保证文本、工具和图片识别；Kemo 模式可以表达更多模态，但仍要求网关公开接口与模型能力均已真实实现。

专用多模态调用可以解析当前 Run 的 `asset_id`、项目相对路径，以及用户明确提供或已由文件工具确认的绝对路径。图片会先验证文件签名并完整解码；Chat 图片只接受 JPEG、PNG、WEBP 和 GIF。

图片分析、音频转写和视频分析在 408、429、5xx 或 Provider 明确标记为可重试的瞬时错误下最多补试一次。图片/音视频生成与编辑不会自动重试，避免重复计费。专用多模态调用最大输出预算为 10000 Token，但这是思考与正文共享的总预算，框架不能保证为正文硬性保留固定份额。

Kemo Gateway `0.6.0` 尚不保证完整 Asset API、Provider State 服务或完整流恢复。不要只因
`provider.type=kemo` 就启用这些能力，应以网关能力接口和目标 Provider 的真实声明为准。
:::
