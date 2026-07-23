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

每个平台目录通过 `message.json` 明确声明 `input`、`output`、`detect` 模块，目录里的其他 Python 文件不会被核心自动执行。`bound_user` 把该平台实例绑定到一个现有内部用户。

## 会话标识

消息入口使用：

```text
source     = message:<platform>
session_id = <chat_type>:<external_chat_id>
```

同一内部用户可以共享记忆，但不同平台、聊天类型和聊天 ID 的上下文仍彼此隔离。

## 附件与幂等

图片、音频和 PDF 会转换为多模态内容块；文本文件可并入请求；视频和未知类型只提供文件说明。处理状态用于避免重复消费，终态结果写入按日期划分的日志。

::: warning 绑定与权限
未绑定的传统 Transport 消息会被拒绝。平台绑定前应确认目标内部用户，以及允许该入口调用的工具范围。
:::
