# 插件开发

插件是 kemo-agent 中唯一能够向 Provider 注册真实可执行工具的扩展类型。每个插件位于 `plugins/<name>/`，至少包含 `SKILL.md` 和入口 Python 文件。

## 目录结构

```text
plugins/my_tool/
├── SKILL.md
└── tool.py
```

## SKILL.md 清单

一级标题和简介会进入插件提示词；`## Tool` 下的 JSON 代码块定义 Provider 工具。

```json
{
  "name": "my_tool",
  "description": "完成一项明确操作",
  "input_schema": {
    "type": "object",
    "properties": {
      "value": { "type": "string" }
    },
    "required": ["value"],
    "additionalProperties": false
  },
  "version": "1.0.0",
  "enabled": true,
  "entrypoint": "tool.py:run",
  "timeout_policy": "argument_or_default"
}
```

必填字段是 `name`、`description`、`input_schema`、`version`、`enabled`、`entrypoint`。`timeout_policy` 可选，默认 `argument_or_default`。`input_schema.type` 必须为 `object`；入口必须使用同目录 `file.py:function`，不能路径逃逸。

## 实现入口

```python
def run(value: str, **context):
    return {"ok": True, "value": value}
```

参数会先按 JSON Schema 校验。执行受有效工具超时、最大迭代数、连续相同调用限制和取消信号控制。

## 超时与取消

- `argument_or_default`：普通插件应使用此默认策略。Schema 声明且调用显式提供有效 `timeout` 时采用该值，否则采用全局 `tools.timeout`。
- `agent_runtime`：仅适合本身负责调度子代理整体运行的工具，以 `agent_runtime.default_timeout` 为外层期限。普通插件不应借此绕开工具超时。
- 运行时会在 `context["tool_timeout"]` 中提供最终期限，并在 `context["cancel_event"]` 中提供工具专属取消信号。长循环、阻塞轮询和子进程等待应定期检查取消状态并主动清理。

Python 线程无法安全强杀，因此超时看门狗不能替代插件自己的可取消设计。

::: warning 命名一致性
插件目录名、一级标题和工具 `name` 应保持一致。共享技能与用户技能即使包含 `## Tool`，也不会注册真实工具。
:::
