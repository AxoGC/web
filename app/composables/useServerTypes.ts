/**
 * A server's `type` is usually a single code, but some servers are reachable
 * by more than one client type (e.g. a Java server that's also reachable by
 * Bedrock clients) — core stores that as a canonical comma-separated string
 * ("mc-java,mc-bedrock"), see internal/modules/server/types.go.
 *
 * parseServerTypes splits that into its components; primaryServerType picks
 * the first one, which is what decides the server's actual implementation
 * (meta shape, command routing, icon, avatar strategy, …) — everything that
 * isn't about "who can connect" should key off the primary type.
 */
export function parseServerTypes(raw: string | undefined | null): string[] {
  if (!raw) return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

export function primaryServerType(raw: string | undefined | null): string {
  return parseServerTypes(raw)[0] ?? ''
}
