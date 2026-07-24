# Provider 配置

kemo-agent 内部使用统一请求契约，对外提供 `kemo` 原生网关和 `chat` 兼容模式。一次 Run 开始前会固定 Provider 类型，失败时不会跨协议自动回退。

## 两种模式

| 能力 | `chat` | `kemo` |
|---|---|---|
| 接口 | `/v1/chat/completions` | Kemo 原生协议 |
| 文本与工具调用 | 支持 | 支持 |
| 图片输入 | 标准 `image_url` | Asset / 内容块 |
| 音频、视频与普通文件 | 不支持 | 按网关能力提供 |
| 媒体生成与转换 | 不支持 | 按网关能力与操作声明提供 |
| Provider State / 流恢复 | 不提供 | 支持 |
| 地址处理 | 自动补全 `/v1` | 保持协议根地址 |

`provider.input_modalities` 用于声明主模型已经确认支持的输入类型，必须包含 `text`。Chat 模式只允许增加 `image`；Kemo 模式还可声明 `audio`、`video`、`file`，并会与网关能力交叉验证。框架不会仅凭模型名称猜测多模态能力。

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
    "reasoning_effort": "medium",
    "input_modalities": ["text", "image"]
  }
}
```

Provider 单次请求超时由源码固定为 120 秒，用户配置不接受 `timeout` 或自定义 `headers`。

::: tip 多模态模型
`multimodal_models` 可分别声明识图、图片生成/编辑、语音识别/生成、语音到语音、视频理解和视频生成模型。专用工具只调用明确填写的能力模型，不会把不支持该操作的主模型当作兜底。

图片路由由 `multimodal_routing.vision` 控制：`auto` 在主模型明确支持图片时优先直传，否则使用专用视觉模型；`main` 仅使用主模型；`dedicated` 仅使用 `multimodal_models.vision`。Chat 模式只保证文本、工具和图片识别，其余多模态能力属于 Kemo 模式。
:::
