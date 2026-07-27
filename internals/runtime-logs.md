# 结构化运行日志

kemo-agent 的运行日志分为结构化事件日志和人类可读兼容日志。结构化日志用于网页查询、筛选和保留策略；旧文件继续承担审计、导出和降级回退职责。

## 存储位置

```text
runtime/
└── logs.sqlite3

cron/task_cron_system/log/
└── YYYY-MM-DD.jsonl          # Cron 兼容审计

message/out/<module>/log/
└── YYYY-MM-DD.md              # 外部消息兼容审计
```

SQLite 数据库由运行时自动创建，不应提交到 Git。数据库启用 WAL 和跨平台忙等待，Cron、消息路由和 Web 可以同时访问。

## 两张主要事件表

| 表 | 内容 |
|---|---|
| `cron_execution_logs` | 用户任务和系统任务的执行时间、任务 ID、状态、耗时、受限结果和错误分类 |
| `message_route_logs` | 外部消息入站、出站、附件、平台、聊天 ID、成功状态和文件元数据 |

事件使用稳定指纹作为幂等键。旧 JSONL/Markdown 首次迁移或文件指纹发生变化时会导入 SQLite；重复读取不会制造重复事件。Cron 新写入在 SQLite 与 JSONL 成功后同步记录迁移指纹，避免网页每次查询都重新解析当天文件。

## 保留与隐私

默认只保留 SQLite 结构化事件 90 天，可在 `.env` 中设置：

```dotenv
KEMO_LOG_RETENTION_DAYS=90
```

设置为 `0` 表示不自动清理。当前版本不自动删除兼容 JSONL/Markdown，避免升级时丢失人工审计记录；如需限制旧文件占用空间，应由部署者按自己的备份和审计策略管理。

日志数据库不保存聊天历史，不保存附件二进制，也不应写入 Token、Cookie、Provider 密钥或完整提示词。数据库和日志目录属于运行时敏感数据，应限制本机文件权限，并确保 `runtime/`、日志目录和用户数据不进入公开仓库。

## 读取降级

网页消息页和系统 Cron 状态页优先查询 SQLite。数据库不可用、迁移失败或旧文件格式无法识别时，页面会回退到 JSONL/Markdown 解析；诊断日志链路故障不会阻断智能体对话、Cron 执行或外部消息收发。
