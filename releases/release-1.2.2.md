# kemo-agent 1.2.2 — 临时重要记忆注入策略修正

1.2.2 是一次记忆注入策略修正：临时重要记忆热画像不再「顶替」普通临时记忆——进入热画像的七天、月、半年碎片仍按各自档位上限正常注入，热画像只作为更高优先级的强化概括层，与权威碎片正文并存。

## 变更前的问题

热画像（`memory_temporary_important.md`）发布后，其来源碎片会被普通临时记忆段跳过，避免同一事实重复注入。这带来两个副作用：

- 源碎片在 Prompt 中只剩热画像的概括正文，原始权威细节丢失；
- 热画像失效（任一来源被修改、删除或晋升）时，源碎片才恢复注入，期间普通临时记忆段出现「空洞」。

## 本次修正

- `run/memory_sqlite.py`：`select_tier_for_prompt` 移除 featured 过滤——临时层选择不再排除已进入热画像的源碎片，`original_items` / `truncated` 统计同步改为基于整层行数；
- `memory_important_sources` 表回归纯粹职责：只记录热画像的来源关系与内容摘要，用于判断热画像是否仍然有效，不改变源碎片的 Prompt 注入资格；
- 热画像定位为「强化概括层」：作为更高优先级的事实强化，与权威碎片正文并存注入；任一来源正文变化、被删除或离开临时层后，旧热画像暂停注入，权威临时/永久内容始终保持正常注入。

## 配套测试

- prompt 管线：新增 `test_important_view_reinforces_without_replacing_month_memory`——热画像存在时 one_month 碎片仍注入正文；
- 执行器：`test_periodic_view_keeps_source_in_regular_prompt_as_reinforcement` 与 `test_featured_one_month_fragment_remains_in_regular_prompt` 断言来源碎片保留在常规 prompt；`test_one_stale_source_invalidates_view_without_hiding_regular_fragments` 断言源失效只暂停热画像、不隐藏常规碎片。

## 版本与文档

- 本次为 1.2.1 基础上的修复补丁，未涉及版本号文件变更；
- agents.md 与全局知识库三文档（global-config-reference / memory-storage / project-introduction）的 `memory_important_sources` 语义同步更新。

## 验证

发布前完成系统验收（release_check 7/7）：

- test_kemo：89 passed
- backend_tests：847 passed + 2 skipped + 58 subtests
- template_contracts：10 passed
- Python 编译、Git 补丁检查通过
- 前端 Vitest：26 文件 / 195 passed；生产构建成功

## 开始使用

```bash
git pull origin main
```

升级后无需额外配置。已有记忆库无需迁移，热画像会在下次巡检时按新策略重建。
