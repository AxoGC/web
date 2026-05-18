/**
 * Resolves the static URL for a game-type icon (the per-game logo placed in
 * /public/game-icons/<code>.webp). Used as a fallback after server.icon, so
 * server detail pages never have to show the generic LucideServer glyph for
 * a known game type.
 *
 * Returns null for unknown codes — caller renders the lucide fallback in
 * that case. Maps the legacy `mc-be` alias to `mc-bedrock`.
 */
const KNOWN: ReadonlySet<string> = new Set(['mc-java', 'mc-bedrock', 'dst', 'terraria'])

export function gameTypeIcon(code: string | undefined | null): string | null {
  if (!code) return null
  const c = code === 'mc-be' ? 'mc-bedrock' : code
  if (!KNOWN.has(c)) return null
  return `/game-icons/${c}.webp`
}
