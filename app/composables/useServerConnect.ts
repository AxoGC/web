import type { ServerDetail, ServerEndpoint, ServerSummary, ServerType } from '~/types/api'

// Vanilla default ports — omitted in copy strings when the endpoint's port matches.
const DEFAULT_PORT: Partial<Record<ServerType, number>> = {
  'mc-java': 25565,
  'mc-bedrock': 19132,
  'terraria': 7777,
}

export function defaultPortFor(type: ServerType): number | undefined {
  return DEFAULT_PORT[type]
}

/** Format one endpoint into the canonical "ip[:port]" copy string for its game. */
export function formatEndpoint(type: ServerType, ep: ServerEndpoint): string {
  if (!ep.host) return ''
  const def = DEFAULT_PORT[type]
  if (ep.port && ep.port !== def) return `${ep.host}:${ep.port}`
  return ep.host
}

/** Extract endpoints[] from server.meta in a type-safe way; returns [] when absent. */
export function extractEndpoints(server: ServerSummary | ServerDetail | null | undefined): ServerEndpoint[] {
  const meta = server?.meta as { endpoints?: unknown } | undefined
  if (!meta || !Array.isArray(meta.endpoints)) return []
  return meta.endpoints.filter((e): e is ServerEndpoint => !!e && typeof (e as ServerEndpoint).host === 'string')
}

export function useServerConnect(server: () => ServerSummary | ServerDetail | null | undefined) {
  const toast = useToast()
  const { t } = useI18n()

  async function copy(text: string) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('actions.copied'))
    } catch { /* ignore */ }
  }

  async function copyEndpoint(ep: ServerEndpoint) {
    const s = server()
    if (!s) return
    await copy(formatEndpoint(s.type, ep))
  }

  return { copy, copyEndpoint, formatEndpoint, extractEndpoints }
}
