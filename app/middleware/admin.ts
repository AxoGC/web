import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  const auth = useAuthStore()
  if (!auth.isLoggedIn) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
  if (!auth.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'FORBIDDEN' })
  }
})
