# v0.6.0 更新说明

`v0.6.0` 重点完善 Kemo Gateway 接入体验：设置页可以读取当前密钥真正可用的模型目录，框架新增默认关闭的网关只读状态拓展，同时加固 Chat/Kemo 兼容桥中的历史条目与工具调用 ID。升级前仍建议备份 `.env`、`users/`、外部消息模块和自建拓展。

## Kemo 模型目录

- Web 设置页只有在 Provider 配置成功保存、类型为 `kemo` 且网关鉴权有效后，才请求 `/model/models?task=llm`。
- 模型目录使用当前调用密钥的真实视角，同时受 scope、`allowed_models`、Provider/模型启停和能力声明影响，不展示未经授权的注册表全量数据。
- API 验证成功后，主模型、子代理模型和专用多模态模型输入框可以从统一气泡中筛选并选择；仍保留直接输入模型名的能力。
- 模型目录只是短期界面数据，不新增用户配置字段，不批量写回模型，也不会覆盖尚未保存的 `provider.model`。
- `chat` 模式、未保存草稿、缺少凭据、鉴权失败或非法目录响应继续使用传统输入方式，不伪造“API 有效”。

完整接入方式见[接入 Kemo Gateway](/guide/kemo-gateway)。

## 网关运行状态拓展

- 新增内置全局拓展 `global_expand/kemo_gateway_status/`，通过网关只读 `GET /status` 获取运行阶段、版本、Provider/模型、调用成功率、延迟、缓存命中率和 Token 统计。
- 拓展默认未激活，不会在安装或更新后自动连接网关，也不会把状态注入 Prompt。
- 激活必须由用户明确授权，并使用独立 `STATUS_TOKEN`；模型调用密钥、Web Token、admin/owner Token 不能代替状态 Token。
- 状态响应经过严格字段白名单过滤，生成 Markdown 摘要、脱敏 JSON 和 `1600×900` PNG 图表；凭据、系统提示词、请求正文和原始错误正文不会进入这些产物。
- 状态客户端拒绝 HTTP 重定向，避免把 Token 带到配置地址之外的主机。反向代理或 FRP 部署必须直接填写最终可访问的根地址。
- core 更新会同步内置拓展实现，同时保留部署机上的本地凭据、摘要、快照、图表和激活状态。

## 协议兼容与工具续轮

- Kemo 模型目录新增严格响应模型，目录对象、任务类型、Provider 归属和能力地址均经过协议校验。
- Chat → Kemo 兼容桥会在单次请求内保证 Message、Reasoning、Tool Call 和 Tool Result 条目 ID 唯一。
- 上游重复使用工具调用 ID 时，框架按出现顺序重新映射对应结果，避免长历史或续轮请求因 ID 冲突而校验失败。

## 升级步骤

```bash
python update.py --module all
```

Linux 环境如没有 `python` 命令，可使用：

```bash
python3 update.py --module all
```

更新完成后完整重启 kemo-agent。若要启用网关状态拓展，还需要在 Kemo Gateway 配置独立 `STATUS_TOKEN`、重启网关，再由主智能体执行激活；仅升级 kemo-agent 不会自动启用该拓展。
