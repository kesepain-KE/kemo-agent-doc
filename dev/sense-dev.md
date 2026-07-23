# 感知开发

感知模块只做“采集 → 注入”的单向数据流，适合时间、设备或环境状态。需要执行外部操控时应使用拓展模块。

## 标准文件

```text
global_sense/my_sense/
├── sense.json
├── sense.md
└── data_update.py
```

## sense.json

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | string | 模块显示名称 |
| `data_md` | string | 数据 Markdown 文件 |
| `recent_update` | string | `%Y-%m-%d %H:%M:%S` 格式 |
| `health` | string | `正常` 或 `异常` |
| `start_update` | string | 数据更新 Python 文件 |

所有字段必须存在且非空，不允许未知字段。文件引用不得逃逸模块目录；单个模块损坏只进入诊断，不影响其他模块。

## 注入规则

只有 `health == "正常"` 的模块会把 `data_md` 内容注入：

```text
[模块名]
感知数据正文
```

刷新脚本运行在独立子进程中，默认单模块超时 120 秒。感知数据可能对所有启用该模块的用户可见，因此不要写入单用户私有信息或凭据。

::: warning 全局作用域
当前感知只有 `global_sense/` 全局层。用户和共享范围的双向能力请建为拓展模块。
:::
