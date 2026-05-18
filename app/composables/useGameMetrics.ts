import { computed } from 'vue'

/**
 * Single registry for the six unified radar axes. Plugins decide the values
 * and percents (they own the scales); the web only knows how to label and
 * format what's reported. AXIS_KEYS' order is the canonical display order
 * but plugins also send the axes in this order — when both agree, neither
 * has to coordinate after a renaming.
 */
export const AXIS_KEYS = [
  'walk_total_m',
  'play_time',
  'survival_index',
  'blocks_placed',
  'blocks_broken',
  'kills_total',
] as const

export type AxisKey = (typeof AXIS_KEYS)[number]

type Translator = (k: string, p?: Record<string, unknown>) => string
type FormatFn = (value: number, t: Translator) => string

const fmtMeters: FormatFn = v =>
  v >= 1000 ? `${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} km` : `${Math.round(v)} m`

const fmtPlayTimeSeconds: FormatFn = (v, t) => {
  const h = Math.floor(v / 3600)
  const m = Math.floor((v % 3600) / 60)
  return t('metric.play_time_fmt', { h, m })
}

const fmtSurvival: FormatFn = v => v.toLocaleString(undefined, { maximumFractionDigits: 1 })
const fmtInt: FormatFn = v => Math.round(v).toLocaleString()

const FORMATTERS: Record<string, FormatFn> = {
  walk_total_m: fmtMeters,
  play_time: fmtPlayTimeSeconds,
  survival_index: fmtSurvival,
  blocks_placed: fmtInt,
  blocks_broken: fmtInt,
  kills_total: fmtInt,
}

export function useGameMetrics() {
  const { t } = useI18n()

  const labelFor = (key: string): string => {
    const k = `metric.${key}`
    const out = t(k)
    return out === k ? key : out
  }

  const tr: Translator = (k, p) => String(t(k, (p ?? {}) as Record<string, unknown>))

  const formatScore = (key: string, score: number): string => {
    const fn = FORMATTERS[key] ?? fmtInt
    return fn(score, tr)
  }

  const options = computed(() =>
    AXIS_KEYS.map(k => ({ value: k, label: labelFor(k) })),
  )

  return { labelFor, formatScore, options, keys: AXIS_KEYS }
}
