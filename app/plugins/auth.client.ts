import { useAuthStore } from '~/stores/auth'

// Restore the session (silent refresh) before the first route resolves.
// Nuxt awaits every plugin's setup before mounting the app and running the
// initial navigation's middleware, so this closes the race where `auth.ts`
// middleware (see app/middleware/auth.ts) would otherwise see a still-empty
// auth store on a hard reload of an auth-gated page and bounce to /login
// before app.vue's onMounted ever got to call bootstrap().
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  await auth.bootstrap()
})
