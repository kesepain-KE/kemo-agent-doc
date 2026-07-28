# 用户配置

每个用户的配置位于 `users/<name>/user_config.json`。它保存 Provider 选择和资源授权，不应与 Web 登录账号混淆。

## 用户专属段

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `schema_version` | integer | `1` | 配置结构版本 |
| `provider` | object | `kemo` | 主模型连接配置 |
| `agent_models` | object | 空字符串 | 子代理三档模型，空值继承主模型 |
| `multimodal_models` | object | 空字符串 | 明确指定各能力的专用多模态模型 |
| `multimodal_routing` | object | `vision: auto` | 图片在主模型与专用视觉模型之间的路由方式 |
| `task_plan.auto_accept` | boolean | `false` | 是否自动批准新计划 |
| `skills.shared_whitelist` | array | `[]` | 允许的共享技能，空数组表示全量 |
| `expand.shared_whitelist` | array | `[]` | 允许的共享拓展 |
| `expand.global_whitelist` | array | `[]` | 允许的全局拓展 |
| `perception.global_whitelist` | array | `[]` | 允许的全局感知模块 |
| `knowledge.use_shared` | boolean | `true` | 使用共享知识层 |
| `knowledge.use_global` | boolean | `true` | 使用全局知识层 |
| `plugins.whitelist` | array | `[]` | 主智能体可执行插件 |

空白名单 `[]` 表示全量允许；非空数组按资源 ID 精确匹配。`"*"` 不是主配置协议中的通配符。

## Provider 字段

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `type` | string | `"kemo"` | `kemo` 或 `chat` |
| `base_url` | string | 空 | 连接地址，空时读取环境变量或内置默认值 |
| `api_key` | string | 空 | 用户密钥，优先于环境变量 |
| `api_key_env` | string | 空 | 自定义密钥环境变量名 |
| `model` | string | 空 | 主模型名 |
| `stream` | boolean | `true` | 是否流式输出 |
| `reasoning_effort` | string | `"medium"` | Chat 使用原有固定档位；Kemo 使用当前模型能力声明中的逻辑档位，可包含 `xhigh` |
| `input_modalities` | string[] | `["text"]` | 主模型确认支持的输入模态；必须包含 `text` |

Chat 模式的 `input_modalities` 只允许 `text` 和 `image`；Kemo 模式还可声明 `audio`、`video`、`file`，实际使用时仍需满足网关能力。

Kemo 模式下，配置文件只保存所选逻辑档位，不保存模型能力或厂商映射。运行前框架会查询当前
模型能力；如果档位已经失效，则优先改用 `medium`，没有 `medium` 时使用能力列表第一项。
模型声明不支持推理、能力列表为空或首次查询失败且没有成功缓存时，本次调用不提交推理配置。
Chat 模式保持原有行为，不访问 Kemo 能力接口。

## 模型档位

```json
"agent_models": {
  "default": "",
  "cheap": "",
  "reasoning": ""
}
```

`history_summary` 等轻量任务可以使用 `cheap`，复杂推理代理可以使用 `reasoning`。某档为空时继承 `provider.model`。

## 多模态模型

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `multimodal_models.vision` | string | 空 | 图片分析/OCR |
| `multimodal_models.image_generation` | string | 空 | 文生图 |
| `multimodal_models.image_edit` | string | 空 | 图片编辑 |
| `multimodal_models.audio_transcription` | string | 空 | 语音转文字 |
| `multimodal_models.speech_generation` | string | 空 | 文生语音 |
| `multimodal_models.speech_to_speech` | string | 空 | 语音到语音 |
| `multimodal_models.video_understanding` | string | 空 | 视频理解与时间轴摘要 |
| `multimodal_models.video_generation` | string | 空 | 视频生成 |

专用模型为空时不会无条件改用 `provider.model`。主模型能否直接接收媒体由 `provider.input_modalities` 和 Kemo 网关能力决定；专用插件只调用明确填写的能力模型。这里不包含 embedding 和 rerank。

图片路由配置：

```json
"multimodal_routing": {
  "vision": "auto"
}
```

`auto` 表示主模型支持图片时优先直传，否则使用 `multimodal_models.vision`；`main` 表示仅主模型；`dedicated` 表示仅专用视觉模型。Chat 模式只保证图片识别，音视频、普通文件和媒体生成/转换只在 Kemo 模式启用。

::: danger 密钥管理
把 `provider.api_key` 留空并使用 `.env` 兜底通常更便于避免误提交。无论采用哪种方式，都不要把真实密钥纳入版本控制。
:::

已删除的旧字段（如 `knowledge.enabled`、`skills.user_whitelist`、Provider 的 `timeout` 和 `headers`）继续出现时会被视为未知字段。
