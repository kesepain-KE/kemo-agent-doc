# 上下文管理

上下文管理的目标是在不修改完整归档的前提下，为 Provider 选择一个满足轮次和 Token 预算的完整消息窗口。

## 双层历史

| 层 | 轮号 | 是否裁剪 | 用途 |
|---|---|---|---|
| `history/<window>/` | 绝对轮号 | 否 | 用户可见完整归档 |
| `history/temp/<window>/` | 局部连续轮号 | 是 | Provider 临时工作区 |

`round_offset` 记录临时局部轮号与归档绝对轮号之间的差值。临时工作区丢失或损坏时，可从归档恢复最近 `max_rounds` 轮。

## 预算参数

| 参数 | 默认值 | 说明 |
|---|---:|---|
| `agents.conserved_rounds` | `3` | 保留完整工具与思考日志的轮数 |
| `history.recent_full_rounds` | `3` | 不被摘要或移除的最近轮数 |
| `agents.max_rounds` | `80` | 工作区最大轮数 |
| `agents.rounds_after_compression` | `20` | 压缩后保留轮数 |
| `agents.token_limit` | `1000000` | 总 Token 上限 |
| `agents.token_compression_ratio` | `0.3` | 输入预算比例 |

输入预算等于 `token_limit × token_compression_ratio`，剩余部分作为输出保留。

## 压缩触发

- 投影轮数达到 `max_rounds`。
- 估算总 Token 超过限制。
- Provider 返回 `context_length_exceeded`，首轮最多压缩重试两次。
- 调用方显式请求手动压缩。

上下文按完整回合分组，工具消息不会与所属 assistant 消息拆开。被移除轮次交给 `context_manage` 生成摘要，缓存以源内容哈希复用；一次摘要仍超预算时可继续循环。

`context_manage` 必须返回完整 JSON Schema。手动压缩或自动压缩遇到缺失大括号、Markdown 包裹、截断等格式错误时，会携带上一轮错误和输出尾部再调用模型修复一次；修复仍失败才把错误返回调用方，已有摘要缓存不会被覆盖。

上下文摘要单块输入预算上限为 64000 Token，最大输出上限为 8192 Token；实际调用还会受当前上下文输入预算和输出预留约束。这里的上限不代表 Provider 一定能够消费同样大小的上下文。

::: warning 完整归档不压缩
工具和思考压缩只作用于临时工作区。归档中的原始 `think.json`、`tool.json` 和 `items.json` 保持不变。
:::
