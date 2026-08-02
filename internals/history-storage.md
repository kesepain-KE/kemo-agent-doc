# 历史存储

从 `v0.10.0` 起，历史正文和会话状态使用每用户独立的 SQLite 数据库：

```text
users/<user>/history/history.sqlite3
```

数据库启用 WAL、`synchronous=NORMAL`、外键检查和 5 秒 busy timeout。它是历史对话的唯一权威来源；旧式会话目录不会自动导入。

## 数据表

| 表 | 内容 |
|---|---|
| `history_windows` | archive/runtime 窗口，以及 text、think、tool、items、data 五个逻辑 JSON 分区 |
| `history_sessions` | 标题、摘要、轮数、生命周期、运行态与后台任务状态 |
| `history_active_sessions` | Web、CLI、Telegram 等入口的活跃会话绑定 |
| `history_messages` | 用户与助手正文的逐消息检索记录 |
| `history_meta` | schema 和注册表修订号 |

窗口提交和消息索引更新位于同一事务中。archive 保存完整原始轮次；runtime 可以按上下文预算裁剪。逻辑窗口仍以 `Path` 形式在运行时各模块间传递，但该路径只是稳定标识，不保证磁盘上存在同名目录。

## 查询路径

- 活跃会话按 `active_key` 主键恢复。
- 会话卡片按 `source + updated_at` 索引分页，每页默认 50 条。
- 标题、摘要、会话 ID 与正文搜索在 SQLite 中完成。
- 打开会话、摘要整理和记忆整理时才加载指定窗口正文。
- token 统计和后台维护直接枚举窗口表，不扫描文件系统。

## 恢复和备份

会话注册表缺失时，可以从同一数据库的 archive 窗口表重建，不需要扫描目录。数据库损坏不能通过放回零散 JSON 文件恢复；应使用完整数据库备份。

运行中备份应使用 SQLite backup API。若使用普通文件复制，必须先停止框架并同时处理 `history.sqlite3`、`history.sqlite3-wal` 和 `history.sqlite3-shm`。
