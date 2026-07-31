import type { ServerDetail, ServerJoinMethod, ServerSummary } from '~/types/api'

// Used only to pre-fill a sensible default when an admin adds a new mcbe/terraria row.
const DEFAULT_PORT_BY_METHOD: Record<'mcbe' | 'terraria', number> = {
  mcbe: 19132,
  terraria: 7777,
}

export function defaultPortForMethod(type: 'mcbe' | 'terraria'): number {
  return DEFAULT_PORT_BY_METHOD[type]
}

/**
 * Bedrock client URI handler (Win10 / iOS / Android, since 1.14). Format:
 *   minecraft://?addExternalServer=<DisplayName>|<host>:<port>
 * The display name surfaces inside the "External servers" list. URI-encode
 * the params so `|`, `:`, CJK, spaces survive transit — the client decodes
 * before showing the confirm dialog.
 */
export function buildMcbeDeepLink(serverName: string, host: string, port: number, label?: string): string {
  const display = label ? `${serverName} · ${label}` : serverName
  const payload = `${display}|${host}:${port}`
  return `minecraft://?addExternalServer=${encodeURIComponent(payload)}`
}

/** Extract join_methods[] from server.meta in a type-safe way; returns [] when absent. */
export function extractJoinMethods(server: ServerSummary | ServerDetail | null | undefined): ServerJoinMethod[] {
  const meta = server?.meta as { join_methods?: unknown } | undefined
  if (!meta || !Array.isArray(meta.join_methods)) return []
  return meta.join_methods.filter((m): m is ServerJoinMethod => !!m && typeof (m as ServerJoinMethod).type === 'string')
}

/** Compact single-line preview for list/table rows — one representative string per method. */
export function formatJoinMethodHint(m: ServerJoinMethod): string {
  switch (m.type) {
    case 'mcje':
    case 'sv':
      return m.address
    case 'mcbe':
    case 'terraria':
      return `${m.host}:${m.port}`
    case 'dst':
      return m.name
    default:
      return ''
  }
}

export function useCopy() {
  const toast = useToast()
  const { t } = useI18n()

  async function copy(text: string) {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('actions.copied'))
    } catch { /* ignore */ }
  }

  return { copy }
}
