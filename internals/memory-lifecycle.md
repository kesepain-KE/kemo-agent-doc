# 记忆生命周期

当前记忆使用 schema v3 文件型存储。每条记忆是独立 Markdown 文件，文件名在全部档位中充当全局唯一身份；临时层 `data.json` 只保存轻量元数据。

## 存储布局

```text
users/<user>/improve/
├── storage.json
├── important_view.json
├── seven_days/   ── *.md + data.json
├── one_month/    ── *.md + data.json
├── half_year/    ── *.md + data.json
└── permanent/    ── *.md
```

临时元数据包含 `weight`、`created_at`、`content_updated_at`、`last_used_at`、`last_weight_date`、`tier_entered_at` 和 `expires_at`。绝对时间保存为 UTC；每日加权边界按 `Asia/Shanghai` 计算。

## 晋级和过期

| 当前层 | 固定期限 | 阈值 | 到期达标 |
|---|---:|---:|---|
| `seven_days` | 7 天 | 3 | 移到 `one_month`，权重清零 |
| `one_month` | 30 天 | 10 | 移到 `half_year`，权重清零 |
| `half_year` | 180 天 | 60 | 移到 `permanent` |

到期未达标会删除；引用和正文修改不会重置进入当前层时确定的 `expires_at`。永久层没有索引、权重或到期时间。

## 提取模式

| 模式 | 行为 |
|---|---|
| `compression_only` | 默认；提交只登记游标，保存或压缩边界顺序提取 |
| `background` | Maintenance 领取普通待处理轮次 |
| `on_commit` | 提交后同步提取 |
| `disabled` | 不自动提取 |

所有入口共享连续 `memory_processed_round` 游标，避免保存、压缩和后台维护重复处理同一轮。

待处理轮次按 `memory.extraction_batch_rounds` 组成连续批次，一次交给 `self_improve` 分析，并受 `memory.extraction_max_candidates_per_batch` 限制候选总数。候选会统一完成永久记忆匹配、去重和批量写入；每个批次使用稳定操作标识，只有成功落盘后才推进游标，因此失败重试不会重复创建或重复加权。

## 加权的成功条件

实际注入 Prompt 的临时记忆只有在整轮成功提交后才调用 `mark_used`。正文确实修改和自我改进命中也可加权，但同一天合计最多 `+1`。失败、取消、单纯搜索命中或永久记忆都不参与加权。

::: danger 临时重要记忆
`memory_temporary_important.md` 是由临时碎片生成的近期热画像，`important_view.json` 记录其来源。源碎片仍按原生命周期加权、到期和晋升；任一来源丢失、内容变化、重复或校验失败时，旧视图会整体暂停注入并回退到全部临时记忆，等待下次巡检重建，不会把一个不完整子集误当作有效热画像。热画像任何情况下都不得删除、清空或写入空内容。
:::
