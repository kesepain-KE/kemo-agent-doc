# 快速开始

本页给出从克隆仓库到打开 Web UI 的最短路径。

## 环境要求

| 依赖 | 要求 | 用途 |
|---|---|---|
| Python | 3.10 或更高 | 运行核心与后端 |
| Node.js | 可用的当前版本 | 构建 React 前端 |
| Git | 可用 | 获取和更新代码 |

## 安装

```bash
git clone https://github.com/kesepain-KE/kemo-agent.git
cd kemo-agent
python setup.py
```

`setup.py` 会检查 Python、安装依赖、从 `.env.example` 准备 `.env`、构建前端，并在没有用户时引导创建用户。

不需要逐项确认时可使用：

```bash
python setup.py --yes
```

## 启动 Web UI

```bash
python start_web.py
```

默认访问地址为：

```text
http://127.0.0.1:1357
```

端口被占用时，启动器会在有限范围内尝试后续端口，请以终端实际输出为准。

## 使用命令行

```bash
python cli.py --interactive
```

若本地有多个用户，可加 `--user <用户名>`；也可以设置 `KEMO_USER` 作为 CLI 默认用户。

::: tip 初次使用
建议先从 Web UI 开始。聊天、历史、记忆、知识、任务、文件和运行状态都可以在同一界面查看。
:::
