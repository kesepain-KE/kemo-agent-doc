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

## 超时与协作式取消

子代理的整体期限由 `agent_runtime.default_timeout` 提供，默认 600 秒。它与子代理内部工具的单次期限相互独立；同步 `subagent_dispatch` 使用子代理期限作为外层看门狗，不受普通 `tools.timeout` 提前截断。

到期后运行时会设置取消信号并等待清理。执行线程已退出时记录 `timed_out`，清理窗口结束后仍未退出时记录 `timed_out_running`。自定义执行器应在长循环、等待外部服务和调用工具的安全边界检查取消信号，释放资源后尽快返回；不得依赖运行时强杀 Python 线程。
