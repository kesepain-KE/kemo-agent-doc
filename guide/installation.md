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
python update.py
```

更新前建议备份 `.env` 与整个 `users/` 目录。
