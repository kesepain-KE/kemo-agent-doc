# 拓展开发

拓展模块把外部数据和可选操控能力组织为标准目录。它可以位于全局、共享或用户层，但内置创建工具只创建 `shared` 或 `user` 作用域。

## 框架入口

```text
my_expand/
├── expand.json
├── input_data.md
├── expand_control.md
├── data_update.py
├── start_expand.py
├── src/               # 可选，内部工程结构由模块决定
├── data/              # 可选
└── vendor_project/    # 可选，可保留完整开源项目
```

前五个文件是常见的框架入口，不是完整工程模板。模块可以自由添加任意文件和目录，也可以删除未启用能力对应的入口。框架只根据 `expand.json` 读取或调用声明项，其他内部代码不会自动注册、注入或执行。

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

## 采集入口

`data_update.py` 优先提供同步零参数 `update()`，兼容零参数 `main()`。函数内部可以直接采集小数据，也可以调用模块目录内的浏览器工程、设备 SDK、数据库、Markdown 处理器或第三方项目。

`input_data.md` 是面向 Prompt 的小型状态摘要，不是唯一数据存储。完整 JSON、CSV、HTML、图片、音视频和大型日志应保存在模块目录内部，并在摘要中给出按需读取线索。成功结果可以包含：

```json
{
  "ok": true,
  "resources": [
    { "path": "data/latest.json", "kind": "json", "label": "最新采集数据" }
  ]
}
```

资源路径必须位于模块目录内。框架只把受限索引写入运行状态，不复制正文，也不会自动注入大型文件。

## 操控入口

启用 `open_control` 时，`start_expand.py` 提供以下一种入口，推荐第一种：

```python
def execute(command: str, params: dict):
    ...

# 旧模块兼容
def execute(command_dict: dict):
    ...
```

主智能体通过 `expand_call` 传入明确的 `scope`、模块名、命令和 JSON 参数。框架通过 stdin 把请求交给隔离 Python 子进程，不使用 Shell 拼接；同一模块的自动采集、Web 手动刷新和操控串行执行。

大型结果先写到模块目录，再从返回值的 `artifacts` 数组声明：

```json
{
  "ok": true,
  "data": { "count": 2 },
  "state_changed": false,
  "artifacts": [
    { "path": "artifacts/report.pdf", "name": "设备报告.pdf", "kind": "file" }
  ]
}
```

框架会校验路径、文件类型、大小和媒体内容，再复制到当前用户 `download` 并返回安全资产描述。单次最多 32 个产物，单文件最多 512 MB，总计最多 1024 MB。

## 刷新和验证

创建工具会先在临时目录写完最小入口，再按真实运行时契约校验，失败则回滚。自动采集和操控都在隔离子进程运行并受超时限制；Windows 后台启动时隐藏终端窗口。

框架在模块 `_runtime.json` 中分别记录最近一次 `update` 与 `control` 的状态、耗时、错误摘要、资源或产物数量。该文件由框架维护，模块不要自行覆盖。

::: tip 安全默认值
新模块的 `start_expand.py` 应默认明确返回未实现错误，不要伪造成功。清单、资源与产物路径必须留在模块目录内，也不能经过符号链接或目录联接。隔离子进程不是权限沙箱，只能运行受信任代码。
:::
