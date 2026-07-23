# 子代理开发

子代理包由清单、指令、触发说明和强制授权组成。运行时每次发现时扫描内置和当前用户目录，因此配置型改动通常不需要重启。

## 包结构

```text
agents/my_agent/
├── AGENT.md
├── agent.json
├── agent-config.json
├── trigger.md
├── executor.py        # 可选
└── schema.json        # 可选
```

精简 `agent.json` 只包含 `name`、`version`、`description`、`trigger`：

```json
{
  "name": "my_agent",
  "version": "1.0.0",
  "description": "负责一项边界清晰的工作",
  "trigger": "trigger.md"
}
```

## 强制授权

`agent-config.json` 控制允许调用方、插件/共享技能白名单、知识范围、工具循环上限以及是否继承主历史。它不是说明文档，运行时会实际执行这些限制。

`trigger.md` 分为 `# 注册信息` 和 `# 操作信息`。主智能体只看到简短注册摘要，需要调用时再按需读取操作约定。

## 执行器

同目录存在 `executor.py` 时，精简清单自动使用 `executor.py:execute`；否则使用 `builtin:llm`。可选 `schema.json` 为输入输出提供严格 JSON Schema。

::: danger 信任边界
自定义 Python 执行器与主进程同权限运行，没有沙箱。不要加载来源不明的代理包。
:::

子代理必须返回 JSON 对象，也不会自动获得主会话或当前请求；调用方要明确传入必要数据。
