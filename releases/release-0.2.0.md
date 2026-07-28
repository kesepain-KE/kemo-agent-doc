# v0.2.0 更新说明

`v0.2.0` 重点增加多模态感知能力、深化潮汐记忆管线，并全面提升 Web 前端体验。从纯文本交互进化到图片、音频、视频的全模态理解与生成。

## 多模态能力

- 支持图片理解与生成、音频转写与合成、视频理解。Chat 模式下走标准图片通道，Kemo 模式下完整支持音视频和多模态资产流式传输。
- 多模态路由：`multimodal_routing` 支持 `auto`（主模型优先，专用模型兜底）、`main`（仅主模型）和 `dedicated`（仅专用模型）三种策略。
- 大型媒体通过认证 Asset API 传输，生成结果校验后保存到用户下载空间。Base64 和临时 URL 不进入长期历史。

## 潮汐记忆深化

- 记忆提取改为批量处理——上下文压缩前先按连续批次交给 `self_improve` 分析，候选统一去重、增权重并通过 `upsert_candidates` 批量落盘。
- 每条记忆每天最多加权一次。取消的轮次同样持久化，不因中断丢失信息。
- 新增 `memory.extraction_mode`：`on_commit` 同步提取，`compression_only` 压缩时提取，`background` 允许维护后台领取。
- 上下文压缩的摘要缓存支持增量继承——后续压缩只处理新移出的轮次。

## Web 前端升级

- Markdown 消息渲染支持代码块、表格和数学公式。
- 新增历史搜索独立面板、记忆管理和设置页面重新设计。
- 新增 Agent Composer（子代理组合器），可视化控制可调用子代理。
- 全局确认对话框防止误操作，纯文本消息模式可自由切换。

## 工程基础设施

- Provider 协议层新增资产流式传输、引导事件（`guidance_applied`）。
- 工具系统新增连续相同调用追踪——同一签名连续请求达上限后阻止继续执行。
- `web_search` 未配置 Tavily 密钥时可被发现，调用时返回配置引导。
- CI 覆盖 Windows UTF-8 兼容性和安全扫描。
- 新增中英双语 README 和项目图标。

## 更新命令

```bash
git pull
python setup.py
```

配置文件无需手动迁移，更新系统处理从 0.1.x 到 0.2.x 的兼容过渡。

---

> 本说明基于 [GitHub Release v0.2.0](https://github.com/kesepain-KE/kemo-agent/releases/tag/v0.2.0) 整理。
