# Kemo Gateway 0.7.2 更新说明

`0.7.2` 聚焦 Kemo Gateway 的平滑重启可靠性：新配置在旧实例停止前完成独立预检；替换实例必须以新的身份通过健康检查；启动失败时尽力恢复旧启动环境。浏览器 Web 会话在认证配置未改变时可安全跨重启交接。

## 可验证的重启链路

- 管理控制台与 `restart.py` 在进入 Drain 前运行独立的 `start_web.py --preflight` 进程，验证待生效 `.env`、前端构建产物、Python 依赖和后端应用装配。
- 预检失败时旧实例保持运行；替换器会等待旧 PID 和旧端口释放，再读取新 `.env` 的 HOST/PORT 启动新实例。
- 新实例必须携带不同于旧实例的 `instance_id` 通过 `/healthz` 才标记成功；新端口被占用、创建进程失败或健康检查失败时，会尽力恢复旧启动环境，并将结果写入重启状态。
- 重启交接期间保留旧 PID 元数据，避免 Windows 上旧实例退出清理与替换实例读取元数据的竞态。
- `WEB_ALLOWED_HOSTS` 限制下，循环健康探测会使用允许的 Host Header；IPv6 wildcard 地址改用 `::1` 回环探测。

## Web 会话安全交接

- 认证配置不变时，Cookie 会话会延续到原两小时到期时间，浏览器不因平滑重启立即掉线。
- 交接文件只保存 Cookie Token 的 SHA-256 哈希、CSRF Token、认证阶段和绝对到期时间，不保存明文 Cookie Token。
- 修改 `WEB_TOKEN`、`WEB_USERNAME` 或 `WEB_PASSWORD` 会产生新的认证命名空间，旧会话不会被恢复。
- 登录失败限流继续只保存在进程内存，不被会话交接文件持久化。

## 自动化与版本契约

- 新增 Windows/Linux GitHub Actions，构建 Web 前端后执行真实进程替换 E2E，覆盖无效环境拒绝、新端口接管、健康检查、PID 元数据与 Cookie/CSRF 会话交接。
- 新增版本契约测试和工作流，确保 `version.json`、前端 `package.json` 以及中英文 README 徽章版本始终一致，Kemo Protocol 维持 `1.0`。

## 验证

- 后端完整测试：`427 passed, 1 skipped`
- 真实 Web 重启 E2E：`1 passed`
- 前端生产构建：通过
- Git 差异检查：通过

## 升级建议

更新后重启网关以加载 `0.7.2` 的启动与重启控制逻辑。若通过反向代理部署，请确认代理传递正确的 Host 与 `X-Forwarded-Proto`，并保持 `WEB_ALLOWED_HOSTS` 与公开域名一致。
