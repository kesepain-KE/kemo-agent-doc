# kemo-agent 文档站

这是 kemo-agent 的 VitePress 文档站。

```bash
npm install
npm run docs:dev
```

构建静态站点：

```bash
npm run docs:build
```

输出目录为 `.vitepress/dist/`。

## GitHub Pages

推送到 `kesepain-KE/kemo-agent-doc` 的 `main` 分支后，GitHub Actions 会自动构建并发布：

```text
https://kesepain-ke.github.io/kemo-agent-doc/
```

工作流构建时设置 `DOCS_BASE=/kemo-agent-doc/`。本地开发不设置该变量，仍使用根路径 `/`。
