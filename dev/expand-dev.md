# 拓展开发

拓展模块把外部数据和可选操控能力组织为标准目录。它可以位于全局、共享或用户层，但内置创建工具只创建 `shared` 或 `user` 作用域。

## 标准文件

```text
my_expand/
├── expand.json
├── input_data.md
├── expand_control.md
├── data_update.py
└── start_expand.py
```

## expand.json

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | string | 显示名称 |
| `explain` | string | 功能说明 |
| `open_input` | boolean | 是否启用数据采集 |
| `input_data` | string | 模块内 Markdown 数据文件 |
| `input_health` | string | `正常` 或 `异常` |
| `start_update` | string | 数据刷新 Python 文件 |
| `open_control` | boolean | 是否启用操控 |
| `start_expand` | string | 操控入口 Python 文件 |
| `start_control` | string | 操控手册 Markdown |

`expand_control.md` 中 `## 注入层` 到 `## 操作层` 之间的内容可进入提示词；操作层之后的详细操作说明不自动注入。

## 刷新和验证

采集脚本优先暴露 `update()`，兼容 `main()`。创建工具会先在临时目录写完五个文件，再按真实运行时契约校验，失败则回滚。

::: tip 安全默认值
新模块的 `start_expand.py` 应默认返回 `not_implemented`，不要在尚未实现时伪造成功。清单引用必须留在模块目录内，也不能是符号链接或目录联接。
:::
