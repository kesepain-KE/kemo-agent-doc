# 消息路由

消息子系统把平台差异限制在 Transport 层。统一路由负责身份绑定、幂等领取、会话隔离、附件转换、运行事件聚合和出站回复。

## 两条入口路径

### 传统 Transport

```text
Transport → MessageEnvelope
  → IdentityResolver
  → ProcessedMessageStore.claim
  → MessageRouter → iter_request_events
  → OutboundMessage → Transport.send
```

身份由 `config/message_config.json` 的 bindings 匹配，匹配字段越完整优先级越高；没有绑定则拒绝。

### 文件夹插件

```text
message/out/<platform>/input.py
  → message.md / files/
  → FileMessageTransport
  → message.json.bound_user
  → claim_many
  → MessageRouter
  → output.py.send
  → finalize
```

文件夹插件把整个实例绑定给一个内部用户，不逐条经过 IdentityResolver。群聊中同一外部会话的多条消息可合并，并一次领取全部原始消息 ID；私聊逐条处理。

## 附件转换

图片、音频和 PDF 变为 Kemo 内容块，文本文件读入提示词，视频和未知类型只提供文件说明。附件必须位于平台插件声明的 `files_dir` 中。

## 完成与清理

RouteResult 到达终态后调用可选 `finalize()`。文件 Transport 用它写入 `log/YYYY-MM-DD.md`、删除本批次已处理附件，并释放队列领取文件。处理状态和多键幂等避免重启或合批造成重复回复。

## 并发

同一 `(user, source, session_id)` 最终仍受引擎会话锁串行保护。消息层还有工作线程和等待队列上限；超出容量时明确返回 `MessageQueueFullError`。

::: warning 文件插件代码
RuntimeHost 只加载 `message.json` 声明的 input、output 和 detect 模块。不要把未审查代码放进这些入口。
:::
