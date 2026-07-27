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

上下文按完整回合分组，工具消息不会与所属 assistant 消息拆开。被移除轮次的正文、reasoning/think、工具调用和关键工具结果会一起交给 `context_manage`，缓存以源内容哈希复用；一次摘要仍超预算时可继续循环。

`context_manage` 必须返回完整 JSON Schema，且 `narrative` 不能为空。手动压缩或自动压缩遇到缺失大括号、Markdown 包裹、截断等格式错误时，会携带上一轮错误和输出尾部再调用模型修复一次；修复仍失败才把错误返回调用方，已有摘要缓存不会被覆盖。

上下文摘要单块输入预算上限为 64000 Token，最大输出上限为 20000 Token；实际调用还会受当前上下文输入预算和输出预留约束。这里的上限同时为模型推理和完整 JSON 正文预留空间，不代表 Provider 一定能够消费同样大小的上下文或一定会用满输出。

## 手动压缩提交校验

网页端手动压缩只有在以下状态重新读取并相互一致后才返回成功：

- 摘要缓存可读取，并覆盖全部被移除的绝对轮次。
- 临时工作区的轮数和 `workspace_rounds` 等于预期值。
- `round_offset` 与完整归档和保留轮数一致。
- 上下文快照已指向新的临时工作区。

任何一步失败都会恢复压缩前的临时工作区和旧摘要缓存。完整归档始终不参与回滚，因为压缩从不修改完整归档。

::: warning 完整归档不压缩
工具和思考压缩只作用于临时工作区。归档中的原始 `think.json`、`tool.json` 和 `items.json` 保持不变。
:::
