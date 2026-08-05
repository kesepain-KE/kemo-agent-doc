# 系统提示词

`build_prompt_bundle()` 不再拼接一段不可观察的字符串，而是按固定契约生成 15 个 `PromptSection`，同时保留字符数、截断、资源选择和记忆文件等诊断信息。

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
| 8 | `knowledge_index` | 三层本地知识索引 |
| 9 | `permanent_memory` | 永久记忆 |
| 10 | `important_memory` | 临时重要记忆 |
| 11 | `temporary_memory:half_year` | 半年记忆 |
| 12 | `temporary_memory:one_month` | 一月记忆 |
| 13 | `temporary_memory:seven_days` | 七天记忆 |
| 14 | `task_plan` | 当前活跃计划 |
| 15 | `expand_data` | 拓展数据与操控注入层 |
| 16 | `perception` | 健康的感知数据 |

缺失来源会填充为“（无）”，因此段列表的顺序和数量保持稳定；函数末尾还会对实际顺序进行断言。

## Kemo Graph 外挂

Kemo Graph 不再是独立 Prompt 段，也不替换、增强或缩减任何知识或记忆层。若管理员在 `global_expand/kemo_graph/graph_config.json` 注册文档库并激活，其注册表目录摘要只按普通 `[expand_data][global:kemo_graph]` 注入（属于第 15 段内容）。查询、同步、构建必须由用户明确要求，通过 `expand_call(scope="global", module="kemo_graph", ...)` 执行；三层知识库与四档记忆始终本地注入。

## 限制和诊断

`prompt.char_limits` 控制任务计划、感知、拓展、技能和插件等动态段的字符预算；临时记忆另有每层文件数限制。`PromptBundle.diagnostics` 记录段顺序、总字符数、知识文档和资源选择诊断。

::: warning 文档版本
早期资料中的“6 段”“14 段”“17 段”或“图谱替换标记”是 1.0.0 之前的旧设计。当前源码 `PROMPT_SECTION_ORDER` 明确列出 15 个段（含尾部的 `perception`）。
:::
