# 子代理

子代理是为特定职责配置的独立执行单元。它们拥有自己的提示词、模型档位、工具和知识权限，不自动继承主会话全部内容。

## 内置子代理

| 名称 | 职责 |
|---|---|
| `context_manage` | 上下文摘要与工具/思考压缩 |
| `self_improve` | 记忆提取与整理 |
| `memory_temporary_important` | 临时重要记忆维护 |
| `task_plan` | 计划生成与编辑 |
| `time_plan` | 自然语言时间解析 |
| `history_summary` | 已关闭会话的标题与摘要 |

## 发现与授权

运行时每次扫描 `agents/` 和 `users/<user>/agents/`，新增或调整用户子代理后通常无需重启。用户子代理不能覆盖内置名称。

`agent-config.json` 是强制授权边界：只有白名单里的插件和技能、明确允许的知识层才能进入子代理。`subagent_dispatch` 不会再下发给子代理，避免递归调度链。

::: warning 自定义执行器
`executor.py` 会被 kemo-agent 进程直接导入执行，不提供代码沙箱。只安装或编写你完全信任的本地代码。
:::
