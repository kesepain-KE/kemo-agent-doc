# v0.8.1 更新说明

`v0.8.1` 修复了工具严格参数模式的兼容性问题。普通插件工具（如 `expand_call`）含开放对象或可选字段，在被 GPT 上游以严格 Schema 校验时会被拒绝；本版将普通工具的默认模式改为非严格。

## 工具严格模式默认值修复

- Chat 兼容桥 `_tool_definition()` 中 `strict` 默认值从 `true` 改为 `false`。
  只有显式声明 `strict: true` 且满足 Structured Outputs Schema 子集的工具才走严格模式。
- `ToolDefinition` 新增 `strict: bool = False` 字段，`openai_schema()` 导出
  `function.strict`。
- 插件 `SKILL.md` 清单新增可选 `strict` 字段，`plugins/manifest.py` 校验其类型为布尔值。
- `expand_call` 等含开放 `params` 对象的插件显式声明 `strict: false`。

## 推理档位回退修正

无 Kemo 能力端点或声明时不再注入 `reasoning_effort`，不猜测固定五档，避免向不支持推理的
目标提交非法参数。

## 测试覆盖

新增 `expand_call` strict 断言、`strict` 字符串类型拒绝测试、Chat 工具非严格默认测试、
无能力声明时推理档位缺位测试。版本号同步到 `0.8.1`（core 与 plugins 组件；agents 与 web
保持 `0.8.0`）。

## 升级步骤

```bash
python update.py --module all
```

更新完成后完整重启 kemo-agent。本次更新不影响存储格式，无需迁移数据。
