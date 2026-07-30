// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/eslint', '@nuxtjs/i18n', 'nuxt-lucide-icons', '@pinia/nuxt', 'nuxt-echarts', '@vite-pwa/nuxt'],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  components: {
    dirs: [
      // Top-level `components/*` keeps the default `<Name>` form (e.g. AppToastViewport).
      { path: '~/components', extensions: ['.vue'], pathPrefix: false, global: true },
      // `components/ui/*` => `<UiName>` (e.g. UiButton).
      { path: '~/components/ui', extensions: ['.vue'], prefix: 'Ui' },
      // `components/layout/*` => no prefix, components already use App* naming.
      { path: '~/components/layout', extensions: ['.vue'], pathPrefix: false },
      // `components/feature/*` => no prefix.
      { path: '~/components/feature', extensions: ['.vue'], pathPrefix: false },
    ],
  },

  app: {
    head: {
      htmlAttrs: { 'data-theme': 'dark' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico' },
      ],
      // Anti-FOUC: pick theme before Vue boots.
      script: [
        {
          innerHTML: `(function(){try{var p=localStorage.getItem('theme-preference')||'system';var d=p==='dark'||(p==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`,
          tagPosition: 'head',
        },
      ],
    },
  },

  runtimeConfig: {
    // Server-side only (Docker internal, SSR fetch target).
    // Override at runtime via NUXT_API_INTERNAL.
    apiInternal: 'http://core:8080',
    public: {
      // Browser-side: relative path so Nginx reverse-proxies /api/* to core.
      // Override via NUXT_PUBLIC_API_BASE.
      apiBase: '',
    },
  },

  i18n: {
    defaultLocale: 'zh-CN',
    strategy: 'no_prefix',
    langDir: 'locales',
    vueI18n: '~/i18n/i18n.config.ts',
    locales: [
      { code: 'zh-CN', language: 'zh-CN', name: '简体中文', files: ['zh-CN/common.json', 'zh-CN/errors.json'] },
      { code: 'en',    language: 'en-US', name: 'English',  files: ['en/common.json', 'en/errors.json'] },
      { code: 'zh-TW', language: 'zh-TW', name: '繁體中文', files: ['zh-TW/common.json', 'zh-TW/errors.json'] },
      { code: 'ja',    language: 'ja-JP', name: '日本語',   files: ['ja/common.json', 'ja/errors.json'] },
      { code: 'ko',    language: 'ko-KR', name: '한국어',   files: ['ko/common.json', 'ko/errors.json'] },
      { code: 'ru',    language: 'ru-RU', name: 'Русский', files: ['ru/common.json', 'ru/errors.json'] },
      { code: 'fr',    language: 'fr-FR', name: 'Français', files: ['fr/common.json', 'fr/errors.json'] },
      { code: 'es',    language: 'es-ES', name: 'Español',  files: ['es/common.json', 'es/errors.json'] },
      { code: 'pt',    language: 'pt-PT', name: 'Português', files: ['pt/common.json', 'pt/errors.json'] },
      { code: 'de',    language: 'de-DE', name: 'Deutsch',  files: ['de/common.json', 'de/errors.json'] },
      { code: 'eo',    language: 'eo',    name: 'Esperanto', files: ['eo/common.json', 'eo/errors.json'] },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'locale-preference',
      redirectOn: 'root',
      fallbackLocale: 'zh-CN',
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Axolotland Gaming Club',
      short_name: 'Axolotland',
      description: 'Live server status, forum, check-ins and donations — unified.',
      lang: 'zh-CN',
      theme_color: '#28abce',
      background_color: '#0f1115',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        { src: '/pwa-192.png',          sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/pwa-512.png',          sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      // No navigateFallback: this is an SSR app, not a static/SPA build, so
      // there's no precached index.html for Workbox to fall back to — the
      // `request.mode === 'navigate'` NetworkFirst rule below already
      // handles every navigation (including the offline case, via its own
      // cache), so a navigateFallback pointing at '/' just throws
      // "non-precached-url" since '/' is never in the precache manifest.
      // Precaching is auto-filled with hashed bundle files; we add explicit
      // runtime caching for navigations and externals below.
      globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
      runtimeCaching: [
        {
          // SSR HTML: try network first so post titles / forum lists stay fresh,
          // but fall back to last good cache when offline.
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages',
            networkTimeoutSeconds: 3,
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
          },
        },
        {
          // Media (avatars, carousel, etc) — core serves these with immutable
          // headers + ?v= cache-buster, so CacheFirst is safe.
          urlPattern: ({ url }) => url.pathname.startsWith('/media/'),
          handler: 'CacheFirst',
          options: {
            cacheName: 'media',
            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 90 },
          },
        },
        {
          // Backend API: never cache. Stale auth / list data would be worse
          // than a brief offline error.
          urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
          handler: 'NetworkOnly',
        },
      ],
    },
    client: {
      installPrompt: false,
    },
    devOptions: {
      enabled: false, // SW off in dev to avoid stale-content surprises
      type: 'module',
    },
  },

  echarts: {
    renderer: ['svg', 'canvas'],
    charts: ['RadarChart', 'LineChart', 'BarChart', 'CustomChart'],
    components: [
      'TitleComponent',
      'TooltipComponent',
      'GridComponent',
      'LegendComponent',
      'DatasetComponent',
      'TransformComponent',
      'GeoComponent',
    ],
  },

  typescript: {
    strict: true,
  },
})