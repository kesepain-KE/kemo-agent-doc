# v0.9.2 更新说明

`v0.9.2` 是后台记忆与长上下文持久化的可靠性修复版本。它修复了子代理连续调用工具时 Kemo reasoning ID 跨响应重复，以及 Windows 短暂文件占用导致自动上下文压缩无法提交的问题。此次更新不改变用户配置、历史结构或记忆结构。

## 后台记忆子代理

- 子代理把 Provider 响应带入下一轮工具循环前，会为 `ReasoningItem` 分配本地唯一 ID。
- reasoning 内容、摘要和 `provider_state` 保持不变，Provider 原始响应对象不会被修改。
- 工具调用的 `call_id` 与工具结果配对关系不受影响。
- 修复 Kemo 网关跨工具迭代重复使用 `rs_0` 时，`memory_periodic_scan` 和 `memory_daily_consolidate` 在第三次请求被协议校验拒绝的问题。

## Windows 历史提交

- 历史归档、Provider 临时工作区、上下文摘要缓存和会话索引统一使用有界原子替换重试。
- `WinError 5/32/33` 以及 `EACCES`、`EPERM`、`EBUSY` 等短暂占用按 `20 / 50 / 100 / 200 ms` 退避后重试。
- 磁盘已满、路径无效等非瞬时错误立即返回，不会被重试掩盖。
- 临时文件清理失败不会覆盖原始写入异常；成功提交后 `data.json` 仍以 `complete=true` 作为完整窗口标记。

这解决了长对话超过 Token 上限后已经生成摘要，但 Windows 在替换 `history/<conversation>/data.json` 时短暂拒绝访问，导致压缩后的临时上下文没有落盘、页面仍显示上下文已满的问题。

## 版本与验证

根版本和 core 升级为 `0.9.2`；agents 保持 `0.8.0`，plugins 保持 `0.8.1`，web 保持 `0.9.0`。后端全量测试结果为 `660 passed, 2 skipped, 45 subtests passed`。

## 升级步骤

```bash
python update.py --module all
```

更新完成后完整重启 kemo-agent。若同一路径仍持续返回拒绝访问，请检查是否同时启动了多个框架进程、目录只读权限、安全软件或备份程序；有界重试只处理短暂文件锁，不会绕过永久权限错误。
