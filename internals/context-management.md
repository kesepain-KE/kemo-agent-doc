# 上下文管理

上下文管理的目标是在不修改完整归档的前提下，为 Provider 选择一个满足轮次和 Token 预算的完整消息窗口。

## 双层逻辑窗口

| 层 | 轮号 | 是否裁剪 | 用途 |
|---|---|---|---|
| SQLite `archive` 窗口 | 绝对轮号 | 否 | 用户可见完整归档 |
| SQLite `runtime` 窗口 | 局部连续轮号 | 是 | Provider 临时工作区 |

两层窗口都存放在 `users/<user>/history/history.sqlite3` 的 `history_windows` 表中，不再对应正文 JSON 目录。`round_offset` 记录 runtime 局部轮号与 archive 绝对轮号之间的差值；runtime 窗口丢失或损坏时，可从 archive 窗口恢复最近 `max_rounds` 轮。

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

::: warning 工具结果硬限制
任意历史工具结果在重建 Provider 消息时统一受 20,000 字符硬限制（v0.9.3 起），**包括最近轮次**：超限结果直接替换为 `ToolResultTooLargeError` 诊断，完整正文不会进入 Provider。旧轮继续按 200 字符预览压缩，最近轮只受 20,000 字符上限约束。
:::

`context_manage` 必须返回完整 JSON Schema，且 `narrative` 不能为空。手动压缩或自动压缩遇到缺失大括号、Markdown 包裹、截断等格式错误时，会携带上一轮错误和输出尾部再调用模型修复一次；修复仍失败才把错误返回调用方，已有摘要缓存不会被覆盖。

上下文摘要单块输入预算上限为 64000 Token，最大输出上限为 20000 Token；实际调用还会受当前上下文输入预算和输出预留约束。这里的上限同时为模型推理和完整 JSON 正文预留空间，不代表 Provider 一定能够消费同样大小的上下文或一定会用满输出。

## 手动压缩提交校验

网页端手动压缩只有在以下状态重新读取并相互一致后才返回成功：

- 摘要缓存可读取，并覆盖全部被移除的绝对轮次。
- 临时工作区的轮数和 `workspace_rounds` 等于预期值。
- `round_offset` 与完整归档和保留轮数一致。
- 上下文快照已指向新的临时工作区。

任何一步失败都会恢复压缩前的临时工作区和旧摘要缓存。完整归档始终不参与回滚，因为压缩从不修改完整归档。

## 事务提交与缓存文件

完整归档、Provider 临时工作区、会话状态和正文搜索索引通过同一个用户级 SQLite 数据库提交。数据库启用 WAL、外键、busy timeout，并用事务保证窗口和状态更新不会暴露半写入结果。上下文摘要仍是可重建缓存文件，继续使用原子替换；它不是历史正文的权威来源。

自动压缩只有在 archive 和压缩后的 runtime 窗口都成功提交后才会在下一轮生效。SQLite 繁忙会在限定时间内等待；磁盘已满、数据库损坏和持续权限错误会直接返回，系统不会把失败事务伪装成成功压缩。

::: warning 完整归档不压缩
工具和思考压缩只作用于 runtime 窗口。archive 窗口中的原始正文、思考、工具和原生消息分区保持不变。
:::
