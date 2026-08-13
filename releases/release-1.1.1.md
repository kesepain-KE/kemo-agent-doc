# kemo-agent 1.1.1 — Android 会话来源分区

1.1.0 让智能体住进手机；1.1.1 解决的是"住进来之后如何与桌面共存"的问题——Android App 的对话不再混在 Web 历史里，而是拥有独立的 `source=app` 分区。

## 核心变更：APP 会话来源隔离

| 层面 | 变更 |
|------|------|
| kemo_app 桥接 | `/v1/chat` 与全部会话操作固定使用 `source=app`，设备端不能指定、覆盖或冒充其他来源；移除原先 `"web" if source == "app" else source` 的映射 |
| 核心会话租约 | `ActiveRun` 携带 `source`；交互 API 校验 `web`/`app`；活动运行冲突、客户端租约、关闭/压缩/删除均按真实来源隔离 |
| 历史索引 | `app` 归入 interactive 链，与 `web` 同 `session_id` 也互不干扰 |
| Web 历史视图 | APP 归档标记为「APP版」并只读展示，网页不会接管或续写 |
| 更新器 | 将 `kemo_app` 纳入内置全局拓展更新范围，只覆盖公开代码，保留部署配置、运行数据和管理员显式选择的本地激活状态；实际启动时继续校验 Token、密钥、上游、端口和启用用户 |

## 会话隔离语义

- 同一用户、同一 `session_id`，App 与 Web 各自持有独立的活动运行、租约和历史窗口；
- 渠道只表示入口，不建立独立记忆区：所有入口共享同一 `memory.sqlite3`；
- 设备请求体中的来源字段不可信，框架侧强制固定为 `app`。

## 版本与文档

- 根与 core/agents/plugins/web 四组件 `1.1.0 → 1.1.1`，CLI VERSION 与前端 package 同步；
- readme / README_EN / agents.md / 全局知识文档一致更新；
- 配套测试：桥接 APP 分区断言、Web 后端 source 透传、更新器保留配置用例。

## APP 桥接更新状态维护说明

以下维护规则只针对 `global_expand/kemo_app/`，不改变其他全局拓展的激活行为：

- 首次安装保持未激活；
- 管理员显式激活后，`core` 板块更新或全量更新保留已有的 `open_input=true`；
- 更新期间 readiness 条件暂时校验失败不会清除激活选择；
- 管理员显式执行 `stop` / `deactivate` 后保持停用，更新器不会重新激活；
- 桥接进程实际启动时仍校验设备 Token、会话密钥、启用用户、上游地址与端口，配置不完整时不会启动；
- `config.json`、`users.json`、`credential_registry.json`、`_runtime.json`、`input_data.md` 和日志等本地配置、凭据与运行数据不会被公开源码覆盖。

## 验证

发布前完成系统验收（release_check 7/7）：

- test_kemo：745 passed + 2 skipped + 56 subtests
- template_contracts：10 passed
- Python 编译、Git 补丁检查通过
- 前端 Vitest：24 文件 / 181 passed；生产构建成功

## 开始使用

```bash
git pull origin main
python update.py --module all
```

更新器会在升级时同步刷新 `kemo_app` 桥接代码，同时保留部署配置、凭据、运行数据与显式激活选择。App 端同步更新到 1.1.1 后，历史将与 Web 完全分区。
