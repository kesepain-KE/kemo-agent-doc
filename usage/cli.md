# 命令行使用

CLI 是直接连接运行核心的终端入口，适合脚本调用、快速单轮请求和持续交互。

## 常用模式

```bash
# 单轮
python cli.py "总结这个目录的结构"

# 交互模式
python cli.py --interactive

# 指定用户和会话
python cli.py --interactive --user alice --session project-a

# JSON 事件输出
python cli.py --prompt "检查状态" --output json
```

用户发现顺序是：`--user` 参数 → `KEMO_USER` 环境变量 → 唯一用户或交互选择。

## 关键参数

| 参数 | 说明 |
|---|---|
| `-p`, `--prompt` | 单轮提示词 |
| `-i`, `--interactive` | 交互模式 |
| `--stdin` | 从标准输入读取提示词 |
| `-u`, `--user` | 指定内部用户 |
| `--source` | 自定义请求来源标识 |
| `--session` | 指定上下文会话 |
| `--output text\|json` | 文本或事件 JSON 输出 |
| `--show-reasoning` | 把 reasoning 增量输出到 stderr |
| `--no-stream` | 等待完整响应后一次输出 |

## 交互命令

会话管理提供 `/new`、`/sessions`、`/use`、`/history`、`/status`、`/compress`；记忆管理提供 `/memory`、`/remember`、`/forget`；计划和 Cron 分别使用 `/plan*` 与 `/cron*` 命令族。输入 `/exit` 退出。

::: warning 脚本化调用
自动化脚本应显式指定 `--user`、`--session` 和 `--output json`，避免多用户交互选择或人类可读输出造成歧义。
:::
