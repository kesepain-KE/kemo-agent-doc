# kemo-agent 增量 — APP 活跃会话绑定

1.1.1 让 App 的对话历史独立成区；这次的增量回答的是"手机重新打开 App 时，对话回到哪里"——桥接服务新增活跃会话绑定端点，配合 `app-` 前缀会话 ID，让 App 恢复对话时能精确找回服务端记录的活跃会话，而不是依赖本地残留状态。

## 核心变更

| 层面 | 变更 |
|------|------|
| kemo_app 桥接 | 新增 `GET /v1/conversations/active`：携带设备 `client_id`，转发上游活跃会话查询，返回服务端当前活跃绑定 |
| 会话索引 | `get_or_reserve_active` 支持 `new_session_id` 注入；App 场景使用 `app-{uuid}` 专属会话 ID，不与 Web 会话串号 |
| 活跃会话 API | `/api/users/{user}/sessions/active` 新增 `source` 参数（默认 `web`），按来源分区活跃键 |
| APP 租约语义 | App 调用方不参与浏览器风格客户端租约（`active_clients=0`），恢复请求不会阻止同一设备关闭会话 |

## 配套测试

- Web 后端：活跃会话 source 隔离与 APP 会话 ID 用例
- 桥接拓展：`/v1/conversations/active` 端点转发断言

## 相关

- [kemo-agent-app 增量 — 账号级聊天会话隔离](/releases/release-app-1.1.3-chat-isolation)
- [kemo-agent 1.1.1 — Android 会话来源分区](/releases/release-1.1.1)
