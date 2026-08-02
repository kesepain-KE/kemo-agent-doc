# 记忆存储

从 `v0.10.0` 起，四档记忆使用每用户独立的 SQLite 数据库：

```text
users/<user>/improve/memory.sqlite3
```

数据库启用 WAL、`synchronous=NORMAL`、外键检查和 busy timeout。它是记忆碎片的唯一权威来源；旧式 Markdown 碎片、分层 `data.json`、`storage.json` 与 `important_view.json` 不再参与读取，也不会自动导入。`memory_temporary_important.md` 仍是位于用户根目录的可重建热视图，不是权威数据库或第五个生命周期层。

## 表结构

| 表 | 内容 |
|---|---|
| `memory_meta` | schema 与派生视图元数据 |
| `memory_fragments` | 四档正文与生命周期（`filename_key` 全局唯一，tier 枚举，权重非负，永久层无到期时间） |
| `memory_weight_events` | 用户历史证据导致的加权记录（数据库强制同一记忆每日最多 +1） |
| `memory_operations` | 批量提取的幂等结果（`operation_id` 主键，重复批次只重放结果） |
| `memory_important_sources` | 临时重要热视图引用的来源行与内容摘要，用于失效判定 |

`filename` 保留 `.md` 后缀只是稳定的逻辑身份与 UI 展示合同，不表示磁盘上存在对应 Markdown。跨层同名由数据库唯一约束拒绝；晋升直接更新同一行的 `tier`，不复制正文文件。

## 生命周期与事务

- 新的非明确候选进入 `seven_days`；用户明确要求长期记住的候选可直接进入 `permanent`。
- 同名临时候选更新正文后，生命周期到期时间不滑动；用户历史证据在当天第一次命中时写入 `memory_weight_events` 并加权。
- 到期达到阈值时，在一个事务内更新 tier、重置权重和加权事件并写入新的固定到期时间；未达阈值则事务化删除。
- 语义融合在同一事务内更新目标正文与生命周期、删除来源，任何一步失败都会回滚。
- 永久层不累计权重且无到期时间，普通非明确候选不能覆盖永久正文。

Prompt 注入、Web 浏览、`memory_manage` 搜索和用户主动查看均为只读操作，不写加权事件。只有保存、手动压缩、Token 超限压缩等用户对话历史整理管线能提供临时记忆加权证据。

## 模板、升级与备份

- `template/user/improve/` 只保留 `.gitkeep`，不提交预生成的数据库文件；`user_create.py` 在真实用户目录落地后初始化 schema，更新器只初始化缺失数据库。
- 当前源代码不会自动导入旧文件格式的记忆；需要保留旧部署数据时，应在升级前自行导出。
- 最稳妥的备份方式是停止写入后复制整个 `improve/` 目录，或在运行中使用 SQLite backup API；WAL 模式下不能只复制 `memory.sqlite3` 而遗漏尚未 checkpoint 的 `-wal` 文件。
- 完整性检查使用 `MemoryStore.integrity_issues()`，不要通过手工编辑数据库修复生产数据。
