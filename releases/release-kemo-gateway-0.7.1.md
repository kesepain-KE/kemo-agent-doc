# Kemo Gateway 0.7.1 更新说明

`0.7.1` 是一次小版本稳定性更新，聚焦网关完成更新后的重启交接、管理端多入口登录，以及调用统计中的延迟语义。

## 重启替换更可控

- 管理端发起重启后，旧实例先进入优雅停止；replacement 进程独立运行，并等待旧 PID 与监听端口释放后再启动新实例。
- 只有 PID 文件仍同时匹配旧 `pid` 与 `instance_id` 时，超时后的终止升级才会执行，避免 PID 被操作系统复用时误伤无关进程。
- replacement 会清理上一实例从 `.env` 读取、但当前 `.env` 已删除的变量，再加载当前配置；由进程环境显式覆盖的变量保持优先。

## 响应延迟与总耗时分离

- LLM、Embedding、Rerank 在收到第一个 Provider 响应时记录响应延迟。
- 管理端的“平均响应延迟”表示请求开始到第一个文本、音频、推理、工具、媒体或终态事件的时间。
- 完整执行至终态的耗时保留为 `duration_ms`，调用日志可同时查看响应速度与总执行时间。
- 旧的日统计 SQLite 数据库会在读取时自动补齐新增字段，不需要手工迁移。

## 多入口部署与 Cookie

- `WEB_COOKIE_SECURE=auto` 改为按当前管理请求实际使用的 HTTP/HTTPS scheme 设置 Cookie，而不是只依据 `GATEWAY_BASE_URL`。
- 同一实例通过公网 HTTPS 与可信局域网 HTTP 访问时，局域网登录不再收到无法回传的 Secure Cookie。
- `.env.example` 同步明确：调用密钥统一维护在 `api/keys.json`，Provider 配置由 Provider 目录维护；公网部署仍应配置 Web 鉴权、HTTPS 与 Host 白名单。

## 验证

- Python 相关回归测试：`33 passed`
- 管理前端 TypeScript 检查：通过
- 管理前端生产构建：通过
- Git 差异检查：通过

## 升级步骤

```bash
git pull
python update.py
```

更新后通过管理端重启，或完整停止并重新运行 `python start_web.py`。本次不改变 Kemo Protocol `1.0`，不要求迁移现有调用密钥、Provider 配置或统计数据。
