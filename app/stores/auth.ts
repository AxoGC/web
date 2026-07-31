import { defineStore } from 'pinia'
import { useApi, ApiError } from '~/composables/useApi'

export interface MeDTO {
  id: number
  username: string
  email: string
  email_verified: boolean
  avatar: string
  bio: string
  /** GB/T 2260 prefecture-level code; absent when not opted in to a public city. */
  city_code?: string
  role: 'user' | 'mod' | 'admin'
  status: 'active' | 'banned'
  point: number
  created_at: number
  /** Unix timestamp of the last self-service username rename, if any. */
  username_renamed_at?: number
}

interface State {
  accessToken: string | null
  user: MeDTO | null
  bootstrapped: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): State => ({
    accessToken: null,
    user: null,
    bootstrapped: false,
  }),

  getters: {
    isLoggedIn: (s) => !!s.accessToken && !!s.user,
    isAdmin: (s) => s.user?.role === 'admin',
    isMod: (s) => s.user?.role === 'mod' || s.user?.role === 'admin',
  },

  actions: {
    setAccess(token: string | null) {
      this.accessToken = token
    },

    async fetchMe() {
      try {
        const u = await useApi<MeDTO>('/api/users/me')
        this.user = u
      } catch (e) {
        if (e instanceof ApiError) this.user = null
        throw e
      }
    },

    /** Best-effort silent refresh on first paint. */
    async bootstrap() {
      if (this.bootstrapped || !import.meta.client) return
      this.bootstrapped = true
      try {
        const data = await useApi<{ access_token: string }>('/api/auth/refresh', {
          method: 'POST',
          anonymous: true,
          skipRefresh: true,
        })
        this.accessToken = data.access_token
        await this.fetchMe()
      } catch {
        // No active session — fine.
        this.clear()
      }
    },

    async login(email: string, password: string) {
      const data = await useApi<{ access_token: string }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        anonymous: true,
      })
      this.accessToken = data.access_token
      await this.fetchMe()
    },

    async register(email: string, code: string, username: string, password: string) {
      const data = await useApi<{ access_token: string }>('/api/auth/register', {
        method: 'POST',
        body: { email, code, username, password },
        anonymous: true,
      })
      this.accessToken = data.access_token
      await this.fetchMe()
    },

    async logout() {
      try {
        await useApi('/api/auth/logout', { method: 'POST' })
      } catch {
        // ignore
      }
      this.clear()
    },

    clear() {
      this.accessToken = null
      this.user = null
    },

    setUser(u: MeDTO | null) {
      this.user = u
    },
  },
})
