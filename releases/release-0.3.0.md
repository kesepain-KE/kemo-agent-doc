# v0.3.0 更新说明

`0.3.0` 重点完成引擎架构重构、工具超时策略化和子代理状态精细化管理。从单体引擎拆分为公共门面加 10 个领域模块，为后续扩展打下结构基础。

## 引擎架构重构

- `run/engine.py` 退化为稳定的公共门面，核心逻辑拆分到 10 个领域模块：`conversation_runtime.py`（主循环编排）、`provider_events.py`（协议事件转换）、`request_input.py`（请求验证）、`run_state.py`（Run 状态管理）、`round_finalizer.py`（受控停止轮次持久化）、`context_service.py`（上下文状态查询与压缩）、`session_runtime.py`（会话锁与归档提交）、`errors.py`（引擎异常定义）、`usage.py`（计量合并）、`memory_analysis.py`（批量记忆分析与游标推进）。
- 所有对外 API 保持兼容，`web/service.py` 和测试文件中的导入路径同步迁移至新模块。

## 工具超时策略化

- 插件新增 `timeout_policy` 声明：`argument_or_default` 接受调用方传参或走全局默认，`agent_runtime` 跟随子代理整体期限。
- `subagent_dispatch` 率先使用 `agent_runtime` 策略，其看门狗比普通工具晚 5 秒触发，不会在子代理思考时提前收网。
- 超时发生时工具收到独立的取消信号，不再误伤整个对话。1 秒清理窗口后如实报告 `timed_out`（已退出）或 `timed_out_running`（仍在运行）。

## 子代理状态管理

- `AgentTimeoutError` 携带 `process_terminated` 标记，调度器新增 `timed_out` 和 `timed_out_running` 两个终态。
- 子代理到期后运行时会自动请求协作式取消，Python 线程不能被强杀时不谎报状态。

## 更新命令

```bash
git pull
```

配置文件无需迁移。重启 Web 服务后即可使用。

---

> 本说明基于 [GitHub Release v0.3.0](https://github.com/kesepain-KE/kemo-agent/releases/tag/v0.3.0) 整理。
