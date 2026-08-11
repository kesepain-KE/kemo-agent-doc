# 安装部署

安装向导覆盖后端依赖、环境变量、前端构建和首个用户创建。本页也说明各参数适合什么场景。

## 安装向导的六个阶段

1. 检查 Python 版本不低于 3.10。
2. 执行 `pip install -r requirements.txt`。
3. 从 `.env.example` 创建 `.env`，并可引导填写 Provider 与 Web 登录信息。
4. 在 `web/frontend/` 安装依赖并构建前端。
5. 检查并创建用户目录。
6. 补齐 `tmp/`、`users/` 等运行目录。

## 命令参数

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `--yes`, `-y` | flag | 关闭 | 使用默认答案，跳过交互确认 |
| `--skip-deps` | flag | 关闭 | 不执行 Python 依赖安装 |
| `--skip-web` | flag | 关闭 | 不安装和构建 Web 前端 |

例如，已经准备好 Python 虚拟环境但暂时不需要网页端时：

```bash
python setup.py --skip-deps --skip-web
```

## 手动检查

```bash
python --version
node --version
npm --version
```

安装后至少应存在 `.env` 和一个 `users/<name>/` 用户目录。可单独运行用户管理器：

```bash
python user_create.py
```

## 启动参数

```bash
python start_web.py --host 127.0.0.1 --port 1357
```

`--no-host` 只启动 Web API，不托管 Cron 和消息路由；`--skip-version-check` 跳过启动时版本检查。

::: warning 暴露到局域网
把监听地址设为 `0.0.0.0` 前，请先配置 `WEB_ACCESS_TOKEN` 或成对配置 `WEB_USERNAME`、`WEB_PASSWORD`，并确认网络边界。
:::

## 更新

```bash
python update.py --check
python update.py
```

更新器支持 Windows 和 Linux，并按 `core`、`agents`、`plugins`、`web` 四个板块工作。只更新指定板块时可使用：

```bash
python update.py --module core
python update.py --module agents
python update.py --module plugins
python update.py --module web
```

本地与远程版本相同时，交互模式会询问是否重新安装；输入 `y` 会按远程内容重新同步当前版本。也可以使用 `--force` 明确要求同版本重装，使用 `--dry-run` 预览操作。

::: tip PowerShell 路径切换
PowerShell 使用 `cd D:\kemo-agent` 或 `Set-Location D:\kemo-agent`。`cd /d ...` 是 `cmd.exe` 语法，不适用于 PowerShell。
:::

全量更新会先创建 `.backups/update-<时间>/`，再从刚克隆的远程源码加载最新更新板块。只有所有选中板块、用户骨架迁移、依赖刷新和 Web 构建全部成功后，才会原子提交新的 `version.json`。

可以通过以下日志判断更新完成：

- 板块汇总全部为 `[OK]`。
- Web 更新未跳过时出现“Web 前端已构建”。
- core 更新未跳过依赖时出现“依赖已刷新”。
- 最终出现 `update complete`。

出现 `failed`、`partial`、依赖安装失败或 Web 构建失败时，不算完成，版本号也不会推进。前端构建中的大分块提示属于体积警告，不等于构建失败。

更新器备份不包含 `users/`。更新前仍应单独备份 `.env`、整个 `users/` 和自建的 `message/out/` 平台模块；自建可执行插件也应另行保存，因为 `plugins/` 会与远程完全同步。更新成功后重启 kemo-agent 使运行中的服务加载新代码。

::: tip APP 桥接拓展的激活状态
以下规则只针对内置的 `global_expand/kemo_app/`：首次安装保持未激活；管理员显式激活后，`python update.py --module core` 和全量更新都会保留本地 `open_input=true`。更新复制期间即使设备 Token、用户或上游地址等 readiness 条件暂时校验失败，也不会要求重新激活；管理员显式执行 `stop` / `deactivate` 后则仍保持停用，不会被更新器自动开启。

更新器保留的是管理员的激活选择，不会绕过实际启动检查。桥接进程启动时仍会验证本地配置是否完整；`config.json`、`users.json`、`credential_registry.json`、`_runtime.json`、`input_data.md` 和日志等本地配置、凭据与运行数据也不会被公开源码覆盖。
:::
