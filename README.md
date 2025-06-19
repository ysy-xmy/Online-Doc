# 🚀 Online-Doc 前端项目

> 🌟 **本项目由「龙傲天」队伍开发** 🌟

---

一个基于 Nuxt3 + Vue3 的现代化在线文档协作平台，支持知识库管理、多人协同编辑、主题切换等功能，界面美观，体验流畅，适合团队知识沉淀与协作办公。

---

## ✨ 主要功能

- 🗂️ **知识库管理**：新建、列表、权限设置等
- 📝 **文档协同编辑**：集成 Quill、Yjs，支持实时多人编辑
- 💬 **WebSocket 实时通信**：消息推送与互动
- 🌈 **主题切换**：多种配色风格，支持暗黑模式
- 🧩 **丰富组件**：页面结构清晰，便于扩展
- 🔍 **文档搜索**、📊 **修订历史**、👥 **成员管理**（可扩展）

---

## 🛠️ 技术栈

| 技术         | 说明                       |
| ------------ | -------------------------- |
| Nuxt3/Vue3   | 前端框架                   |
| Pinia        | 状态管理                   |
| TailwindCSS  | 原子化 CSS，快速美化界面   |
| daisyUI      | 主题与组件库               |
| Quill/Yjs    | 富文本与协同编辑           |
| WebSocket    | 实时通信                   |
| ofetch       | 网络请求                   |
| Vite         | 构建工具                   |

---

## 📁 目录结构

```
Online-Doc/
├── pages/                # 页面文件（路由自动生成）
├── components/           # 组件（按业务模块分类）
├── plugins/              # 插件（如 http、websocket、quill 等）
├── layouts/              # 页面布局（如默认、全屏等）
├── stores/               # Pinia 状态管理
├── assets/               # 静态资源（样式、图片等）
├── public/               # 公共资源
├── nuxt.config.ts        # Nuxt 配置
└── package.json
```

---

## 🚦 快速开始

1. 安装依赖

   ```bash
   npm install
   # 或 yarn install / pnpm install
   ```

2. 启动开发服务器

   ```bash
   npm run dev
   # 默认访问 http://localhost:3000
   ```

3. 构建与预览

   ```bash
   npm run build
   npm run preview
   ```

---

## 💡 开发建议

- 推荐使用 **VSCode + Volar** 插件进行开发，获得最佳的 TypeScript 和 Vue3 支持。
- 组件和页面建议使用 `<script setup>` 语法糖，代码更简洁。
- 样式优先使用 **TailwindCSS** 原子类，复杂样式可写在 `assets/css/main.css`。
- 网络请求统一通过 `plugins/http.ts` 提供的 `$fetchInstance` 进行，便于拦截和全局处理。
- 协同编辑相关页面可参考 `components/doc/yjsdemo.vue`、`pages/demo/yjsdemo.vue`。
- 主题切换、侧边栏等通用功能已封装为组件，直接复用即可。
- 推荐使用 emoji、icon 丰富界面，提升用户体验。

---

## 🤝 贡献与协作

1. Fork & Clone 本仓库
2. 新建分支进行开发
3. 提交 PR 并描述你的修改内容

---

## 📢 其他说明

- 如需二次开发或集成更多功能，可参考现有组件和页面结构进行扩展。
- 有任何问题欢迎提 Issue 或联系维护者。
- 感谢每一位为本项目贡献力量的同学！

---

<p align="center">
  <img src="https://img.shields.io/badge/Team-龙傲天-blueviolet?style=for-the-badge" alt="Team: 龙傲天" />
  <img src="https://img.shields.io/badge/Nuxt-3.x-brightgreen?style=for-the-badge&logo=nuxt.js" alt="Nuxt3" />
  <img src="https://img.shields.io/badge/Vue-3.x-42b883?style=for-the-badge&logo=vue.js" alt="Vue3" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-38bdf8?style=for-the-badge&logo=tailwindcss" alt="TailwindCSS" />
</p>
