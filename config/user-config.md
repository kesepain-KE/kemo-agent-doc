# 用户配置

每个用户的配置位于 `users/<name>/user_config.json`。它保存 Provider 选择和资源授权，不应与 Web 登录账号混淆。

## 用户专属段

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `schema_version` | integer | `1` | 配置结构版本 |
| `provider` | object | `kemo` | 主模型连接配置 |
| `agent_models` | object | 空字符串 | 子代理三档模型，空值继承主模型 |
| `multimodal_models` | object | 空字符串 | 多模态专用模型预留 |
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
| `reasoning_effort` | string | `"medium"` | `minimal`、`low`、`medium`、`high`、`max` |

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
| `multimodal_models.video_generation` | string | 空 | 视频生成 |

专用模型为空时使用 `provider.model`。这里不包含 embedding 和 rerank。

::: danger 密钥管理
把 `provider.api_key` 留空并使用 `.env` 兜底通常更便于避免误提交。无论采用哪种方式，都不要把真实密钥纳入版本控制。
:::

已删除的旧字段（如 `knowledge.enabled`、`skills.user_whitelist`、Provider 的 `timeout` 和 `headers`）继续出现时会被视为未知字段。
