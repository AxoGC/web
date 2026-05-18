/**
 * Human-readable presence string for a player binding.
 *
 *   isOnline=true,  joinedAt=now-10min → "已在线 10 分钟"
 *   isOnline=false, lastSeenAt=now-1h  → "已离线 1 小时"
 *
 * `joinedAt` and `lastSeenAt` are unix seconds (0 = never). When the user is
 * online but joinedAt is 0 (data drift from a race or a fresh column), we
 * fall back to a generic "在线" without a duration.
 *
 * Returns a function so the caller can re-format on the same tick after a
 * timer-driven reactive refresh; for one-shot uses, just call it.
 */
export function usePresence() {
  const { t } = useI18n()

  return function format(opts: {
    isOnline?: boolean
    joinedAt?: number
    lastSeenAt?: number
  }): string {
    const { isOnline = false, joinedAt = 0, lastSeenAt = 0 } = opts
    const nowSec = Math.floor(Date.now() / 1000)
    if (isOnline) {
      if (!joinedAt) return t('presence.online_now')
      return t('presence.online_for', { duration: durationText(t, nowSec - joinedAt) })
    }
    if (!lastSeenAt) return t('presence.never_online')
    return t('presence.offline_for', { duration: durationText(t, nowSec - lastSeenAt) })
  }
}

/**
 * "Largest meaningful unit" duration string. Picks one of
 * minute / hour / day / month based on magnitude so the UI reads natural —
 * "已在线 10 分钟" not "已在线 0 小时 10 分钟". <1 minute is collapsed
 * into "刚刚" so the value doesn't flicker between 0 and 1 on first tick.
 */
function durationText(t: (k: string, p?: Record<string, unknown>) => string, sec: number): string {
  if (sec < 60) return t('presence.just_now')
  const m = Math.floor(sec / 60)
  if (m < 60) return t('presence.unit_minutes', { n: m })
  const h = Math.floor(m / 60)
  if (h < 24) return t('presence.unit_hours', { n: h })
  const d = Math.floor(h / 24)
  if (d < 30) return t('presence.unit_days', { n: d })
  const mo = Math.floor(d / 30)
  return t('presence.unit_months', { n: mo })
}
