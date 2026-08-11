# kemo-agent 1.1.0 — 移动端闭环：让智能体住进手机

1.0.x 系列把 kemo-agent 打磨成了可靠的桌面与 Web 中枢：注入策略交还给用户、跨渠道历史统一可见、工具连续性加固。1.1.0 回答的是另一个问题——**当用户离开桌面时，智能体怎么跟着走**。

答案是一个新的全局拓展：`kemo_app`。它在 kemo-agent 内部提供独立的 Android 桥接服务，让 kemo-agent-app 不需要理解框架内部协议，只需要连接一个为移动端定制的接口面。手机上的用户、桌面上持续工作的智能体、模型网关背后的 Provider，第一次串成了完整的闭环。

---

## kemo_app：Android App 桥接服务

`global_expand/kemo_app/` 是 1.1.0 新增的内置全局拓展，运行于独立端口，同时提供三类接口：

- **HTTP**：认证、历史、任务、定时、状态、模块、文件、模型发现等 REST 操作；
- **SSE**：流式对话专用传输。无响应体读取期限，每 15 秒发送一次心跳，长回复不会因为「等第一个 token 太久」而被误判超时；
- **WebSocket**：事件推送与在线连接/设备统计。

对话能力完整对应 App 端 v1.1.0：

| 能力 | 说明 |
|------|------|
| 两级认证 | 设备 Token 哈希 + App 用户口令加盐验证 |
| 流式对话 | SSE 传输，运行中可接收引导，可随时取消，不受单个 App 屏幕生命周期约束 |
| 历史操作 | 列出 / 加载 / 删除 / 关闭 / 压缩 / 撤销上一轮 |
| 任务与定时 | 计划状态查看、批准暂停、定时任务管理 |
| 文件 | App 上传与框架生成产物传输，单次上传上限 80 MiB |
| 模型发现 | 仅限 Kemo 协议；Chat 兼容模型名手动配置 |
| 状态 | 服务运行快照、上下文与 Token 统计 |

## 安全边界：桥接不等于开放

桥接服务面向手机开放接口，但凭据与运行时文件**不进入仓库**：

- `config.json`（设备 Token 哈希与可选上游凭据）、`users.json`（加盐口令验证器）、`credential_registry.json`（凭据审计快照）只存在于本地部署副本；
- 模块 `.gitignore` 显式忽略上述文件与 PID、锁、连接、日志等运行时状态；
- WebSocket 事件只暴露在线连接/设备计数，不暴露设备 Token、会话 Token 与上游凭据。

## 从 1.0.5 到 1.1.0

| 领域 | 1.0.5 | 1.1.0 |
|------|-------|-------|
| 移动端接入 | 无专用通道 | `kemo_app` 桥接服务（HTTP/SSE/WebSocket 独立端口） |
| 对话传输 | Web/CLI/外部消息 | 新增 SSE 专用流式传输（15 秒心跳、无读取期限） |
| 文件上限 | 框架上传 50 MB | App 桥接单次上传 80 MiB |
| 设备感知 | 无 | WebSocket 在线连接/设备统计 |
| 凭据管理 | 框架凭证加密保存 | App 设备 Token 哈希 + 用户口令加盐，凭据不入库 |
| 版本 | 1.0.5 | 1.1.0（根与四组件统一推进） |

## 本次发布统计

- 新增模块：`global_expand/kemo_app/`（17 个文件，+1903 行：app/auth/upstream/events/daemon/server/start_expand/data_update/credential_registry/manage_user/manage_device_token 等）
- 新增测试：`tests/expand/test_kemo_app_expand.py`（+90 行）
- `.gitignore`：豁免 `global_expand/kemo_app/`，防止被 `global_expand/*` 规则误忽略
- 版本变化：根与 core/agents/plugins/web 四组件 1.0.5 → 1.1.0，CLI `VERSION` 与前端 package 版本同步

## 验证

发布前完成系统验收（release_check 7/7）：

- test_kemo：78 passed
- backend_tests：732 passed + 2 skipped + 56 subtests
- template_contracts：10 passed
- Python 编译、Git 补丁检查通过
- 前端 Vitest：24 文件 / 180 passed；生产构建成功
- 版本一致性：check_versions.py 8 处同步校验通过

## 开始使用

```bash
git pull origin main
python update.py --module all
```

启用 `kemo_app` 拓展后，在 kemo-agent-app 连接页填写桥接服务地址、设备 Token 与账号即可完成两级认证。App 端安装与使用见 [kemo-agent-app 指南](/guide/kemo-agent-app)。
