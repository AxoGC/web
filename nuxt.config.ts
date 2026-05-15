// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    'nuxt-lucide-icons',
    '@pinia/nuxt',
    'nuxt-echarts',
  ],

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

  echarts: {
    renderer: ['svg', 'canvas'],
    charts: ['RadarChart', 'LineChart', 'BarChart'],
    components: [
      'TitleComponent',
      'TooltipComponent',
      'GridComponent',
      'LegendComponent',
      'DatasetComponent',
      'TransformComponent',
    ],
  },

  typescript: {
    strict: true,
  },
})
