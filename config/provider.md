# Provider 配置

kemo-agent 内部使用统一请求契约，对外提供 `kemo` 原生网关和 `chat` 兼容模式。一次 Run 开始前会固定 Provider 类型，失败时不会跨协议自动回退。

## 两种模式

| 能力 | `chat` | `kemo` |
|---|---|---|
| 接口 | `/v1/chat/completions` | Kemo 原生协议 |
| 文本与工具调用 | 支持 | 支持 |
| 图片输入 | 标准 `image_url` | Asset / 内容块 |
| 音视频与媒体输出 | 不作为可移植基线 | 按网关能力提供 |
| Provider State / 流恢复 | 不提供 | 支持 |
| 地址处理 | 自动补全 `/v1` | 保持协议根地址 |

## 解析优先级

密钥顺序：

1. 当前用户 `provider.api_key`。
2. `provider.api_key_env` 指向的变量，或类型默认的 `KEMO_API_KEY` / `OPENAI_API_KEY`。
3. 都不存在则明确报错。

地址顺序：用户 `provider.base_url` → 类型对应环境变量 → 内置默认地址。最终地址会去除尾部 `/`。

## 示例

```json
{
  "provider": {
    "type": "chat",
    "base_url": "https://api.openai.com/v1",
    "api_key": "",
    "api_key_env": "OPENAI_API_KEY",
    "model": "your-model",
    "stream": true,
    "reasoning_effort": "medium"
  }
}
```

Provider 单次请求超时由源码固定为 120 秒，用户配置不接受 `timeout` 或自定义 `headers`。

::: tip 多模态模型
`multimodal_models` 可分别声明 vision、image generation/edit、audio transcription、speech generation、speech-to-speech 和 video generation。专用模型为空时使用主模型；embedding 和 rerank 不在该段中。
:::
