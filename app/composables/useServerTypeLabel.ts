/**
 * Single source of truth for turning a raw server-type code (`mc-java`,
 * `mc-bedrock`, `dst`, …) into a user-facing label. i18n keys live under
 * `server.type_code.<code>`; an unknown code falls back to the raw string
 * (better to show "valheim" than to render nothing).
 *
 * Maps the legacy `mc-be` alias to `mc-bedrock` so old DB rows still display
 * with the new label without a data migration.
 */
export function useServerTypeLabel() {
  const { t } = useI18n()
  return (code: string | undefined | null): string => {
    if (!code) return ''
    const c = code === 'mc-be' ? 'mc-bedrock' : code
    const k = `server.type_code.${c}`
    const out = t(k)
    return out === k ? code : out
  }
}
