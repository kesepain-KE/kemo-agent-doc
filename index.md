---
layout: home

hero:
  name: "kemo-agent"
  text: "本地多用户 Agent Runtime"
  tagline: 面向新一代个人智能基础设施，以潮汐式记忆系统为核心，让智能体具备长期认知与持续演化能力
  image:
    src: /logo.png
    alt: kemo-agent
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/kesepain-KE/kemo-agent

features:
  - icon: 🌊
    title: 潮汐记忆
    details: 重要信息自然留存，反复提及的加深印象，不再需要的安静淡出。
  - icon: 📋
    title: 任务计划
    details: 多步骤目标先确认计划再行动，过程可查看、可暂停、可继续。
  - icon: 🤖
    title: 子代理协作
    details: 记忆整理、步骤规划、定时调度与摘要生成由专门子代理分工完成。
  - icon: 📚
    title: 三层知识库
    details: 个人、共享与全局资料分层检索，让回答贴近真实工作环境。
  - icon: ⏰
    title: 定时任务
    details: 在约定时间自动醒来执行一次性或周期性任务，并留下可回看的结果。
  - icon: 🔌
    title: 多入口连接
    details: 浏览器、命令行与消息平台共享同一用户身份、记忆和工作空间。
  - icon: 🧩
    title: 热插拔能力
    details: 插件、技能、感知、拓展和子代理均可按需增加与授权。
  - icon: 🔒
    title: 本地优先
    details: 对话、记忆、知识、任务和文件由你的本地工作空间管理。
---

<script setup>
import { withBase } from 'vitepress'
</script>

<section class="home-section">

## 如果每次对话都不必重新认识

<p class="home-lead">很多智能助手只存在于当前窗口。kemo-agent 把与你相处的时间连成一条延续的线：今天讨论过的目标可以明天继续，几周前留下的计划也能在需要时重新被提起。它不是只会回答问题的窗口，更像是一间由你掌管的个人智能工作空间。</p>

</section>

<section class="home-section">

## 它可以陪你做什么

<div class="scene-grid">
  <div class="scene-card"><strong>长期交流</strong><span>延续表达习惯、偏好和长期关注点，不必反复交代背景。</span></div>
  <div class="scene-card"><strong>复杂任务</strong><span>把模糊目标整理成清晰计划，持续跟进步骤和结果。</span></div>
  <div class="scene-card"><strong>知识协作</strong><span>使用个人或团队资料，让回答贴近真实项目与工作环境。</span></div>
  <div class="scene-card"><strong>定时守候</strong><span>你不在线时仍按约定时间完成任务、整理信息或留下提醒。</span></div>
  <div class="scene-card"><strong>外部连接</strong><span>从网页、终端或已接入的消息平台联系同一位智能体。</span></div>
  <div class="scene-card"><strong>能力扩展</strong><span>按需加入工具、技能、感知来源、拓展模块和子代理。</span></div>
</div>

</section>

<section class="home-section">

## 一处完整的个人智能工作台

<p class="home-lead">网页端围绕真实使用过程组织：流式对话、历史、记忆、知识、任务、文件、扩展能力与运行状态都在同一处。</p>

<img class="workbench-shot" :src="withBase('/kemo-web-UI.png')" alt="kemo-agent Web UI 截图">

</section>

<section class="home-section quick-install">

## 开始体验

```bash
git clone https://github.com/kesepain-KE/kemo-agent.git
cd kemo-agent
python setup.py
python start_web.py
```

默认访问 `http://127.0.0.1:1357`。初次使用建议从网页端开始。

</section>
