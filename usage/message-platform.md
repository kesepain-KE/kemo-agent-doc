# 消息平台接入

外部消息路由把不同平台的消息统一为 `MessageEnvelope`，再送入与 Web、CLI 相同的运行核心。平台适配器可按 `message/out/<platform>/` 目录热插拔。

## 文件夹插件流程

```text
平台 input.py
  → message.md / files/
  → FileMessageTransport
  → MessageRouter
  → kemo-agent 运行核心
  → output.py.send
  → 日志与附件清理
```

每个平台目录通过 `message.json` 明确声明 `input`、`output`、`detect` 模块，目录里的其他 Python 文件不会被核心自动执行。`bound_user` 把该平台实例绑定到一个现有内部用户。目录内部可以自由包含完整 SDK、协议包、缓存或多层源码；模板只是入口适配样例，不是工程结构上限。

文件夹插件的 input 入口至少实现幂等 `start()` 和 `stop()`。长期轮询、Webhook 或自行创建后台线程的实现还应提供 `is_alive()`，可选提供 `restart()` 与 `last_error()`。核心监督线程独立检查 input 生命周期；死亡后按退避策略重启，不会依赖浏览器页面保持打开。只实现同步阻塞 `start()` 的旧模块继续以框架输入线程是否存活作为兼容判断。

## 会话标识

消息入口使用：

```text
source     = message:<platform>
session_id = <chat_type>:<external_chat_id>
```

同一内部用户可以共享记忆，但不同平台、聊天类型和聊天 ID 的上下文仍彼此隔离。

## 附件与幂等

附件先在插件声明的 `files_dir` 内解析为当前 Run 资产，真实路径必须非空且不能越出模块目录。文本文件可并入请求；图片根据主模型能力直传或交给专用多模态工具；音频、视频、PDF 和普通文件按 Provider 协议能力处理。平台模块不应自行把图片 Base64 塞给主模型，也不能自行决定主模型是否支持某种模态。

处理状态用于避免重复消费，终态结果同时写入 `runtime/logs.sqlite3` 和按日期划分的 Markdown 日志。网页优先读取 SQLite，数据库不可用时回退 Markdown；结构化表只保存正文、状态、附件路径和元数据，不保存附件二进制。只有真实发送成功才能进入完成清理；失败领取和进程重启不会造成同一原始消息被并发重复回复。

::: warning 绑定与权限
未绑定的传统 Transport 消息会被拒绝。平台绑定前应确认目标内部用户，以及允许该入口调用的工具范围。
:::
