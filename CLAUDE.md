# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Nuxt 4 + TypeScript SSR frontend for the Axolotland gaming community platform. The `web` container is the user-facing layer; a Go backend (`core`) lives in a separate repo and is reached over the Docker internal network. Nginx terminates TLS in front of both.

```
Nginx (TLS)
  ├── /api/*      → core (Go, :8080)
  ├── /uploads/*  → static attachments
  └── /           → web (Node SSR, :3000)
```

## Commands

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production output → .output/
pnpm preview    # run the built server locally
pnpm exec eslint .   # lint (config via @nuxt/eslint module)
```

There is no test suite in this repo.

Environment (`.env`):

```env
NUXT_PUBLIC_API_BASE=http://localhost:8080   # browser → core (empty in prod; Nginx proxies /api/*)
NUXT_API_INTERNAL=http://core:8080           # SSR → core via Docker network
```

In production, `NUXT_PUBLIC_API_BASE` is empty so the browser uses same-origin and Nginx reverse-proxies `/api/*`; SSR uses `apiInternal` over the Docker bridge.

## Architecture

### Rendering split (important)

The site mixes SSR and CSR deliberately:

| Pages | Mode | Why |
|---|---|---|
| `/`, `/forums/**`, `/posts/**`, `/servers/**`, `/users/**`, `/pk` | **SSR** | SEO + first paint for anonymous visitors |
| `/login`, `/register`, `/me/**`, `/admin/**`, `/search`, `/donations` | **CSR** | No SEO need, avoids auth complexity during SSR |

**SSR always renders as an anonymous visitor.** It does not read cookies or carry auth. Logged-in UI is reconstructed in the browser after hydration via `useAuthStore.bootstrap()`, which silently calls `/api/auth/refresh` on first paint. Do not introduce SSR code paths that depend on the current user.

### API client — `app/composables/useApi.ts`

Every HTTP call goes through `useApi()`. The backend wraps every response in `{ code: "OK" | "<ERR_CODE>", data }`:

- `code === "OK"` → resolves with `data`.
- Any other `code` → throws `ApiError(code, status)`. UI catches it and maps `code` to `i18n/locales/<lang>/errors.json`.
- SSR requests hit `apiInternal` (Docker network); browser requests use `apiBase`.
- Browser requests automatically attach `Authorization: Bearer <accessToken>` from the auth store, and `credentials: 'include'` so the `refresh_token` cookie travels.
- On `AUTH_TOKEN_EXPIRED` / `AUTH_REQUIRED` / 401, a single-flight `/api/auth/refresh` runs and the original request is retried once. Mark calls with `anonymous: true` to skip the bearer, `skipRefresh: true` to disable retry (used by refresh itself).
- Use `useApiData(key, path, opts)` for SSR-friendly data fetching (wraps `useAsyncData`).

When you add a new error code, **add the i18n strings to all `i18n/locales/*/errors.json` files** or `useToast().tErr(code)` falls back to `UNKNOWN`.

### Auth — `app/stores/auth.ts` + `app/middleware/{auth,admin}.ts`

- Access token lives in the Pinia store (memory only); refresh token is an httpOnly cookie set by `core`.
- `bootstrap()` runs once from `app.vue` on mount and silently restores a session if `/api/auth/refresh` succeeds.
- Route guards short-circuit on the server (`if (import.meta.server) return`) because SSR is anonymous — the actual gate runs after hydration.
- `auth.ts` middleware redirects unauthenticated users to `/login?redirect=…`; `admin.ts` additionally requires `role === 'admin'` (throws 403).

### Polling — `app/composables/usePolling.ts`

Default interval **25s**, pauses on `document.hidden`, fires immediately on mount and on tab refocus. Use this for server status / online counts; do not write bare `setInterval` loops in components.

### Theme — `app/composables/useTheme.ts`

`light` / `dark` / `system`, persisted in `localStorage` under key `theme-preference`, applied via `<html data-theme="...">`. There is an **inline anti-FOUC script in `nuxt.config.ts` (`app.head.script`)** that resolves theme before Vue boots — keep it in sync if you change storage keys or attribute names.

### Components — auto-import prefixes (see `nuxt.config.ts` → `components.dirs`)

- `app/components/ui/*` → prefix `Ui` (e.g. `UiButton`, `UiCard`)
- `app/components/layout/*` → no prefix (already named `App*`, e.g. `AppHeader`, `AppTabBar`)
- `app/components/feature/*` → no prefix (e.g. `PostCard`, `ServerCard`; nested `server/`, `forum/`, `profile/`)
- Top-level `app/components/*` → no prefix and `global: true`

The base UI kit wraps Reka-UI primitives + TailwindCSS v4 with custom design tokens (CSS variables). Lucide icons are auto-imported via `nuxt-lucide-icons` (`<LucideArrowLeft />` etc.).

### i18n — `i18n/locales/<code>/{common,errors}.json`

11 locales: `zh-CN` (default), `en`, `zh-TW`, `ja`, `ko`, `ru`, `fr`, `es`, `pt`, `de`, `eo`. Strategy is `no_prefix` — no language segment in the URL. Browser language is detected on first visit and persisted in cookie `locale-preference`. **When you add a translation key, add it to all 11 locale files** (`zh-CN` text as a placeholder is fine); missing keys silently fall back to the default locale.

### PWA

`@vite-pwa/nuxt` with `registerType: 'autoUpdate'`. Service worker is **disabled in dev** to avoid stale-content surprises. Runtime caching:

- Navigation → `NetworkFirst` (3s timeout), `pages` cache
- `/media/*` → `CacheFirst` (90 days); core serves immutable headers + `?v=` busters
- `/api/*` → `NetworkOnly` (never cache stale auth/list data)

### Charts

ECharts via `nuxt-echarts` with a narrowed tree-shake list (`RadarChart`, `LineChart`, `BarChart`, plus title/tooltip/grid/legend/dataset/transform). Both `svg` and `canvas` renderers are enabled. If you add a new chart type, register it in `nuxt.config.ts` → `echarts.charts`.

## Conventions

- TypeScript `strict: true`. Backend DTO shapes live in `app/types/api.ts` — keep field names **exactly** matching backend JSON (snake_case is normal here).
- Tailwind utilities use semantic design-token classes like `bg-bg-base`, `text-text-primary`, `border-border-subtle` defined in `app/assets/css/main.css`. Prefer these over raw color utilities so themes stay coherent.
- Rich content uses Tiptap (`RichEditor.vue`) for authoring and renders through `RichContent.vue`; HTML is sanitized with DOMPurify before display.
- Forms use vee-validate + zod.
- A component preview page lives at `/dev/components` — use it to verify base UI changes don't regress.
