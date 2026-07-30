# v0.9.1 更新说明

`v0.9.1` 为 Kemo 协议传输层增加了有界网络重试、SSE 断线续传和协作式取消。LLM、Embedding 和 Rerank 的瞬时建连/读取错误最多进行 3 次网络尝试，始终复用同一请求正文与 `request_id`；SSE 在线路上只通过最后完整事件的 `Last-Event-ID` 续传，本地延续 `sequence` 校验并拒绝拼接不同 `response_id`。用户主动停止运行时，当前 Provider 读取会立即被取消，并触发网关端的尽力清理。

## 传输可靠性层

- 新增 `provider/adapters/reliability.py`：`KemoNetworkRetryPolicy` 实现指数退避与随机抖动，网关 `Retry-After` / `retry_after_ms` 优先；`start_cancel_watcher` 在取消信号触发时关闭阻塞连接；`transport_error` 将 `OSError` / `HTTPException` 归一化为 `retryable=True` 的 `ProviderError`。
- Gateway 五个端点（`create`、`stream`、`embeddings`、`embed`、`rerank`）全部接受 `cancel_event` 并通过 `_retry_policy.run()` 包装；`_read_all` 使用取消观察器实现协作式阻塞读取。
- HTTP 409（幂等冲突）已从可重试状态码中移除，错误中显式 `retryable` 声明优先于状态码默认值。

## SSE 断线续传

- `StreamSequenceGuard` 新增 `start_after_sequence` 和 `allow_initial_offset` 支持续传偏移。
- 流式循环现在复用原请求正文和 `request_id`，发送 `Last-Event-ID` 续传，拒绝不同 `response_id`。
- 在统一 `RESPONSE_COMPLETED` / `RESPONSE_FAILED` 终态前断开的 SSE 会被重试；终态后的续传仅重放已持久化的失败。

## 引擎集成

- `provider_events.py` 向 Kemo 模式传入 `cancel_event`，退出时关闭 generator。
- `conversation_runtime.py` 在 context-length 重试前检查取消信号，已取消时直接返回 cancelled 轮次。
- `round_finalizer.py` 在失败详情中记录 `attempt_count`。
- `events.py` 的 `error_event` 自动提取 `category`、`status_code`、`retryable`、`retry_after_ms`、`attempt_count` 到异常详情。
- `ProviderError` 新增 `retry_after_ms` 和 `attempt_count` 字段。

## 文档与测试

- 新增 `global_knowledge/kemo-transport-reliability.md`，完整说明请求幂等、重试范围、SSE 续传、取消、数据完整性与 HTTPS 边界。
- `tests/test_kemo_transport_reliability.py` 覆盖 11 种故障场景：重连、截断、response_id 拒绝、非流式重试、显式 `retryable=false`、完整协议损坏和取消。

## 版本与验证

根版本和 core 升级为 `0.9.1`；agents 保持 `0.8.0`，plugins 保持 `0.8.1`，web 保持 `0.9.0`。本次没有改变用户配置结构，也不需要迁移历史。

## 升级步骤

```bash
python update.py --module all
```

更新完成后完整重启 kemo-agent，使新运行时生效。
