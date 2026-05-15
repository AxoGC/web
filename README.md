# web — 游戏社区平台前端

Nuxt 4 SSR 前端，是游戏社区平台的用户界面层，通过 Docker 内网连接 Go 后端（core）。

## 技术栈

- **框架**：Nuxt 4 + TypeScript + Pinia
- **样式**：TailwindCSS + 自定义 Design Token（CSS 变量）
- **组件原语**：Reka-UI（unstyled）+ Lucide 图标
- **Markdown**：markdown-it + highlight.js + DOMPurify
- **表单**：vee-validate + zod
- **图表**：ECharts（PK 雷达图、在线人数图）
- **国际化**：@nuxtjs/i18n（11 种语言）
- **包管理**：pnpm

## 架构概览

```
Nginx（TLS）
  ├── /api/*        → core（Go 单体，:8080）
  ├── /uploads/*    → 静态附件
  └── /            → web（本项目，Node SSR，:3000）
```

`web` 容器通过 Docker 内网 `http://core:8080` 调用后端，不走公网。

## 渲染策略

| 页面类型 | 模式 | 原因 |
|---|---|---|
| 首页、论坛、帖子详情、服务器、玩家统计 | SSR | SEO + 未登录访客首屏即可见内容 |
| 登录、注册、`/me/*`、`/admin/*`、搜索 | CSR | 无需 SEO，规避 SSR 期间 auth 复杂度 |

SSR 按匿名用户渲染，不读 cookie 不参与认证；登录态 UI 在 hydration 后由客户端补拉。

## 本地开发

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

环境变量（`.env`）：

```env
NUXT_PUBLIC_API_BASE=http://localhost:8080   # 浏览器侧 API 地址
API_BASE_INTERNAL=http://core:8080           # SSR 侧内网地址（Docker 内使用）
```

## 目录结构

```
app/
├── pages/          # 文件路由
├── layouts/        # content / detail / auth / admin
├── components/
│   ├── ui/         # 基础组件（Button / Card / Input / Modal / Toast ...）
│   ├── layout/     # AppHeader / AppSidebar / AppTabBar ...
│   └── feature/    # PostCard / ServerCard 等业务组件
├── composables/
│   ├── useApi.ts       # 统一 envelope 解包 + 401 静默刷新
│   ├── usePolling.ts   # 前端轮询封装（默认 25s，页面隐藏时暂停）
│   └── useTheme.ts     # 深/浅/系统三档主题
├── stores/         # Pinia（auth store 等）
└── middleware/     # auth / admin 路由守卫
i18n/locales/       # 11 种语言 JSON（common + errors）
```

## 主题

支持 `light` / `dark` / `system`（默认跟随系统）。偏好持久化至 `localStorage` key `theme-preference`，通过 `<html data-theme="...">` 应用。

## 组件预览

访问 `/dev/components` 可查看所有基础组件的展示页（防止 UI 走样）。

## 构建 & 部署

```bash
pnpm build      # 构建生产产物
pnpm preview    # 本地预览生产构建
```

生产部署通过 Docker Compose 编排，Nginx 反代到本容器 `:3000`。详见仓库根目录 `docker-compose.yml`。

## 国际化

支持语言：`en` / `zh-CN` / `zh-TW` / `ja` / `ko` / `ru` / `fr` / `es` / `pt` / `de` / `eo`。

默认语言为简体中文，按浏览器 `navigator.language` 推断，切换不刷新页面，URL 不含语言前缀。
