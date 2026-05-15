/**
 * Envelope-aware HTTP client.
 *
 * Backend always responds with:  { code: "OK" | "ERR_CODE", data: any }
 * - Resolves with `data` when code === "OK".
 * - Throws ApiError({ code }) otherwise. UI catches and maps to i18n.
 *
 * Handles:
 *   - SSR routes to `apiInternal` (Docker network); browser uses `apiBase`.
 *   - 401 on protected endpoints triggers silent refresh + retry (single-flight).
 */

import { useAuthStore } from '~/stores/auth'

export class ApiError extends Error {
  code: string
  status: number
  constructor(code: string, status = 400) {
    super(code)
    this.code = code
    this.status = status
  }
}

interface Envelope<T = unknown> {
  code: string
  data: T
}

let refreshPromise: Promise<string | null> | null = null

function getBase() {
  const cfg = useRuntimeConfig()
  return import.meta.server ? cfg.apiInternal : cfg.public.apiBase
}

interface FetchOpts {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  headers?: Record<string, string>
  /** Skip Authorization header even if access token is present. */
  anonymous?: boolean
  /** Skip auto-401 refresh attempt (e.g. for the refresh call itself). */
  skipRefresh?: boolean
  /** multipart payload — body is FormData, do not JSON-stringify. */
  form?: FormData
}

async function rawFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const base = getBase()
  const url = base ? base + path : path
  const headers: Record<string, string> = { ...(opts.headers || {}) }

  // Attach access token on browser side (SSR runs as anonymous per plan §5.12).
  if (import.meta.client && !opts.anonymous) {
    const auth = useAuthStore()
    if (auth.accessToken) headers['Authorization'] = `Bearer ${auth.accessToken}`
  }

  let body: BodyInit | undefined
  if (opts.form) {
    body = opts.form
  } else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body)
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  // Refresh cookie passthrough during SSR isn't useful (we don't fetch auth-bound data SSR),
  // but for browser requests, include credentials so refresh_token cookie is sent.
  const credentials: RequestCredentials = import.meta.client ? 'include' : 'omit'

  const res = await $fetch.raw<Envelope<T>>(url, {
    method: opts.method || 'GET',
    headers,
    body,
    credentials,
    query: opts.query,
    ignoreResponseError: true,
  })

  const status = res.status
  const env = res._data as Envelope<T> | undefined

  if (env && env.code === 'OK') return env.data
  // Non-OK envelope.
  if (env && env.code) throw new ApiError(env.code, status)
  // Empty body / non-JSON.
  if (status === 401) throw new ApiError('AUTH_REQUIRED', 401)
  if (status === 403) throw new ApiError('FORBIDDEN', 403)
  if (status === 429) throw new ApiError('RATE_LIMITED', 429)
  if (status >= 500) throw new ApiError('UNKNOWN', status)
  throw new ApiError('UNKNOWN', status)
}

async function refreshAccess(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const data = await rawFetch<{ access_token: string }>('/api/auth/refresh', {
        method: 'POST',
        anonymous: true,
        skipRefresh: true,
      })
      const auth = useAuthStore()
      auth.setAccess(data.access_token)
      return data.access_token
    } catch {
      const auth = useAuthStore()
      auth.clear()
      return null
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

export async function useApi<T = unknown>(path: string, opts: FetchOpts = {}): Promise<T> {
  try {
    return await rawFetch<T>(path, opts)
  } catch (e) {
    if (
      e instanceof ApiError &&
      import.meta.client &&
      !opts.skipRefresh &&
      (e.code === 'AUTH_TOKEN_EXPIRED' || e.code === 'AUTH_REQUIRED' || e.status === 401)
    ) {
      const fresh = await refreshAccess()
      if (fresh) return rawFetch<T>(path, { ...opts, skipRefresh: true })
    }
    throw e
  }
}

/** SSR-friendly fetch helper backed by `useAsyncData` + `useApi`. */
export function useApiData<T>(key: string, path: string, opts: FetchOpts = {}) {
  return useAsyncData<T>(key, () => useApi<T>(path, opts))
}
