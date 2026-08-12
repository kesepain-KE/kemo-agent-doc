# 关于 kemo-agent

kemo-agent 是一个本地优先、面向多用户的 Agent Runtime。它把模型调用、上下文、记忆、知识、工具、子代理、定时任务和外部消息入口组织在同一套运行时中。

## 它解决什么问题

普通聊天窗口往往只关注当前对话。kemo-agent 把长期使用所需的状态留在本地工作空间：对话可以接续，记忆会按生命周期沉淀，复杂目标可以保存为任务计划，未来要做的事则交给定时调度。

核心能力包括：

- **潮汐记忆**：临时记忆按七天、一个月、半年、永久四档管理；被实际使用的内容积累权重并可能晋级。
- **多用户隔离**：每位用户拥有独立配置、人格、历史、记忆、知识、文件和任务。
- **可控协作**：任务计划默认先等待批准，执行中可暂停、恢复或取消。
- **能力编排**：插件提供工具，技能提供指令，感知提供环境数据，拓展连接外部能力，子代理承担专项工作。
- **多入口**：Web、CLI 和消息平台最终进入同一个运行核心。

## 本地优先意味着什么

对话、记忆、知识、任务和用户文件保存在本地项目目录中，便于查看、备份和迁移。不同用户之间有清晰边界，资源是否进入提示词也由配置白名单控制。

::: warning 隐私边界
kemo-agent 可以本地保存数据，但模型请求是否离开本机取决于你选择的 Provider。请同时检查模型服务的隐私政策和自己的授权范围。
:::

## Kemo 生态

kemo-agent 不是一座孤岛。围绕它，几个独立维护、通过稳定协议协作的项目共同构成 Kemo 生态：

| 项目 | 定位 |
|---|---|
| [kemo-adapter-api](https://github.com/kesepain-KE/kemo-adapter-api) | Kemo Provider Gateway：统一多厂商模型发现、流式响应、工具调用、能力声明、多模态 Asset 与 Token 计量，为 kemo-agent 提供一致的模型服务边界。 |
| [kemo-graph](https://github.com/kesepain-KE/kemo-graph) | 知识图谱与 RAG 检索项目，可外挂为 kemo-agent 的超级文档站，通过 `expand_call` 按需查询、同步与维护。 |
| [kemo-agent-app](https://github.com/kesepain-KE/kemo-agent-app) | kemo-agent 的 Android 生态客户端：连接 kemo-agent 与 Kemo 网关后，对话、任务、文件、拓展感知与配置管理都可以在手机上继续。 |
| [kemo-agent-doc](https://github.com/kesepain-KE/kemo-agent-doc) | 本文档站：安装、配置、使用与扩展开发指南。 |

移动端接入通过 kemo-agent 内的 `kemo_app` 全局拓展完成：它为 Android 客户端提供独立的 HTTP/SSE/WebSocket 桥接服务（两级认证、流式对话与运行中引导、任务与定时、文件传输上限 80 MiB、在线设备统计），使 kemo-agent 生态正式延伸至手机端。

## 当前状态

项目当前正式版本为 `1.1.2`。`1.0.0` 标志着主生态首次补齐并进入稳定主版本；`1.1.0` 完成主生态的移动端闭环，新增 `kemo_app` 全局拓展与 Android 客户端；`1.1.1` 将 Android App 会话独立为 `source=app` 分区，与 Web 历史完全隔离，并让更新器接管桥接模块的平滑升级；`1.1.2` 强化任务计划运行边界（创建后当前会话收束、对话空间隔离、执行器原子领取），新增前台条件等待工具，并修复 Web 暗色主题。后续版本将继续聚焦边缘生态、性能与长期可靠性。

接下来可以阅读 [v1.1.2 更新说明](/releases/release-1.1.2)，或直接进入[快速开始](/guide/getting-started)。
