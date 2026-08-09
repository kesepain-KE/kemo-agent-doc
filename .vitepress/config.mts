import { defineConfig } from 'vitepress'

const base = process.env.DOCS_BASE || '/'

export default defineConfig({
  base,
  lang: 'zh-CN',
  title: 'kemo-agent',
  description: '面向新一代个人智能基础设施的本地多用户 Agent Runtime',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: `${base}logo.png` }],
    ['meta', { name: 'theme-color', content: '#5966d9' }]
  ],
  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'kemo-agent',
    nav: [
      { text: '首页', link: '/' },
      { text: '使用指南', link: '/guide/what-is-kemo-agent' },
      { text: '配置', link: '/config/global-config' },
      { text: '开发', link: '/dev/architecture' },
      { text: '原理', link: '/internals/runtime' },
      { text: 'GitHub', link: 'https://github.com/kesepain-KE/kemo-agent' }
    ],
    sidebar: [
      {
        text: '指南',
        collapsed: false,
        items: [
          { text: '关于 kemo-agent', link: '/guide/what-is-kemo-agent' },
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '安装部署', link: '/guide/installation' },
          { text: '首次运行', link: '/guide/first-run' },
          { text: 'Kemo 网关接入', link: '/guide/kemo-gateway' },
          { text: 'kemo-graph 图谱与检索项目', link: '/guide/kemo-graph' }
        ]
      },
      {
        text: '更新说明',
        collapsed: false,
        items: [
          { text: 'v1.0.5 更新说明', link: '/releases/release-1.0.5' },
          { text: 'v1.0.3 更新说明', link: '/releases/release-1.0.3' },
          { text: 'v1.0.2 更新说明', link: '/releases/release-1.0.2' },
          { text: 'v1.0.1 更新说明', link: '/releases/release-1.0.1' },
          { text: 'v1.0.0 更新说明', link: '/releases/release-1.0.0' },
          { text: 'v0.10.0 更新说明', link: '/releases/release-0.10.0' },
          { text: 'v0.9.3 更新说明', link: '/releases/release-0.9.3' },
          { text: 'v0.9.2 更新说明', link: '/releases/release-0.9.2' },
          { text: 'v0.9.1 更新说明', link: '/releases/release-0.9.1' },
          { text: 'v0.9.0 更新说明', link: '/releases/release-0.9.0' },
          { text: 'v0.8.1 更新说明', link: '/releases/release-0.8.1' },
          { text: 'v0.8.0 更新说明', link: '/releases/release-0.8.0' },
          { text: 'v0.7.3 更新说明', link: '/releases/release-0.7.3' },
          { text: 'v0.7.2 更新说明', link: '/releases/release-0.7.2' },
          { text: 'v0.7.1 更新说明', link: '/releases/release-0.7.1' },
          { text: 'v0.7.0 更新说明', link: '/releases/release-0.7.0' },
          { text: 'v0.6.0 更新说明', link: '/releases/release-0.6.0' },
          { text: 'v0.5.0 更新说明', link: '/releases/release-0.5.0' },
          { text: 'v0.4.0 更新说明', link: '/releases/release-0.4.0' },
          { text: 'v0.3.0 更新说明', link: '/releases/release-0.3.0' },
          { text: 'v0.2.0 更新说明', link: '/releases/release-0.2.0' },
          { text: 'v0.1.0 更新说明', link: '/releases/release-0.1.0' }
        ]
      },
      {
        text: '使用',
        collapsed: false,
        items: [
          { text: 'Web UI', link: '/usage/webui' },
          { text: '命令行', link: '/usage/cli' },
          { text: '对话与历史', link: '/usage/chat-history' },
          { text: '知识库', link: '/usage/knowledge-base' },
          { text: '潮汐记忆系统', link: '/usage/memory-system' },
          { text: '任务计划', link: '/usage/task-plan' },
          { text: '定时任务', link: '/usage/cron-tasks' },
          { text: '子代理', link: '/usage/sub-agents' },
          { text: '感知与拓展', link: '/usage/sense-expand' },
          { text: '消息平台接入', link: '/usage/message-platform' }
        ]
      },
      {
        text: '配置',
        collapsed: false,
        items: [
          { text: '全局配置', link: '/config/global-config' },
          { text: '用户配置', link: '/config/user-config' },
          { text: '环境变量', link: '/config/env-vars' },
          { text: 'Provider', link: '/config/provider' }
        ]
      },
      {
        text: '开发',
        collapsed: false,
        items: [
          { text: '项目架构', link: '/dev/architecture' },
          { text: '插件开发', link: '/dev/plugin-dev' },
          { text: '技能开发', link: '/dev/skill-dev' },
          { text: '子代理开发', link: '/dev/sub-agent-dev' },
          { text: '拓展开发', link: '/dev/expand-dev' },
          { text: '感知开发', link: '/dev/sense-dev' },
          { text: '模块合同验收', link: '/dev/template-validation' }
        ]
      },
      {
        text: '原理',
        collapsed: false,
        items: [
          { text: '运行原理', link: '/internals/runtime' },
          { text: '系统提示词', link: '/internals/system-prompt' },
          { text: '上下文管理', link: '/internals/context-management' },
          { text: '历史存储', link: '/internals/history-storage' },
          { text: '记忆存储', link: '/internals/memory-storage' },
          { text: '工具调用', link: '/internals/tool-calling' },
          { text: '记忆生命周期', link: '/internals/memory-lifecycle' },
          { text: '消息路由', link: '/internals/message-routing' },
          { text: '结构化运行日志', link: '/internals/runtime-logs' }
        ]
      }
    ],
    search: { provider: 'local' },
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdated: { text: '最后更新于', formatOptions: { dateStyle: 'medium', timeStyle: 'short' } },
    returnToTopLabel: '返回顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '外观',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kesepain-KE/kemo-agent' }
    ],
    footer: {
      message: '基于 Apache License 2.0 开源',
      copyright: 'Copyright © 2026 kemo-agent contributors'
    }
  }
})
