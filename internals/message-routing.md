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

附件必须带非空插件相对路径并位于平台声明的 `files_dir` 中。路由先把它们登记为带来源、校验和、媒体类型的当前 Run 资产；文本文件可并入提示词，图片再由主模型能力声明和多模态路由决定直传或专用模型处理，其他媒体按 Provider 协议能力处理。平台适配器不直接替主模型选择模态路线。

## 完成与清理

RouteResult 到达终态后调用可选 `finalize()`。文件 Transport 用它写入 `log/YYYY-MM-DD.md`、删除本批次已处理附件，并释放队列领取文件。处理状态和多键幂等避免重启或合批造成重复回复。

## 并发

同一 `(user, source, session_id)` 最终仍受引擎会话锁串行保护。消息层还有工作线程和等待队列上限；超出容量时明确返回 `MessageQueueFullError`。

文件夹插件还运行独立 input 监督线程，不与消息文件轮询共用阻塞循环。模块实现 `is_alive()` 时以该探针判断健康；只实现阻塞式 `start()` 的旧模块以框架输入线程判断。输入死亡后按指数退避调用 `restart()`，或回退到 `stop()` 后重新 `start()`；旧线程未退出时拒绝启动第二个消费者。RuntimeHost 停止期间监督线程不会重新拉起平台连接。

::: warning 文件插件代码
RuntimeHost 只加载 `message.json` 声明的 input、output 和 detect 模块。不要把未审查代码放进这些入口。
:::
