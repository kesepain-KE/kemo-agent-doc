# 系统提示词

`build_prompt_bundle()` 不再拼接一段不可观察的字符串，而是按固定契约生成 17 个 `PromptSection`，同时保留字符数、截断、资源选择和记忆文件等诊断信息。

## 固定顺序

| 顺序 | 段名 | 内容来源 |
|---:|---|---|
| 1 | `user_soul` | 当前用户人格 |
| 2 | `global_soul` | 全局安全与人格底线 |
| 3 | `agents_manual` | 根目录运行手册 |
| 4 | `global_subagent_registry` | 内置子代理注册摘要 |
| 5 | `user_subagent_registry` | 当前用户子代理注册摘要 |
| 6 | `plugins` | 允许的插件说明 |
| 7 | `skills` | 允许的共享与用户技能 |
| 8 | `knowledge_index` | 三层知识索引或替换标记 |
| 9 | `kemo_graph` | 六个图谱子层状态与结果 |
| 10 | `permanent_memory` | 永久记忆 |
| 11 | `important_memory` | 临时重要记忆 |
| 12 | `temporary_memory:half_year` | 半年记忆 |
| 13 | `temporary_memory:one_month` | 一月记忆 |
| 14 | `temporary_memory:seven_days` | 七天记忆 |
| 15 | `task_plan` | 当前活跃计划 |
| 16 | `expand_data` | 拓展数据与操控注入层 |
| 17 | `perception` | 健康的感知数据 |

缺失来源会填充为“（无）”，因此段列表的顺序和数量保持稳定；函数末尾还会对实际顺序进行断言。

## 限制和诊断

`prompt.char_limits` 控制任务计划、感知、拓展、技能和插件等动态段的字符预算；临时记忆另有每层文件数限制。`PromptBundle.diagnostics` 记录段顺序、总字符数、知识文档、被图谱替换的范围以及资源选择诊断。

## kemo-graph 替换

图谱开关可独立替换用户、共享、全局知识，以及三层临时记忆。被替换段仍保留固定位置，但内容变成明确的替换标记；永久记忆和临时重要记忆始终保留。

::: warning 文档版本
早期资料中的“6 段”或“14 段”是旧设计。当前源码 `PROMPT_SECTION_ORDER` 明确列出 17 个段。
:::
