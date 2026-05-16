import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { ServerType } from '~/types/api'

export interface MetricDef {
  /** Metric key as stored / queried (e.g. play_time, mob_kills_total). */
  key: string
  /** i18n key under "metric.*" — falls back to the raw key when missing. */
  i18nKey: string
  /** Renders a numeric score into a user-facing string. */
  format: (score: number, t: (k: string, params?: Record<string, unknown>) => string) => string
  /** When true, surface this metric in detail-page summary card (top 4-5 only). */
  summary?: boolean
}

// ---- Shared formatters --------------------------------------------------

const fmtPlain = (n: number) => Math.round(n).toLocaleString()

const fmtPlayTimeTicks = (score: number, t: (k: string, p?: Record<string, unknown>) => string) => {
  // MC reports playtime in ticks (20 ticks/s).
  const totalSeconds = Math.floor(score / 20)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return t('metric.play_time_fmt', { h: hours, m: minutes })
}

const fmtCmToKm = (score: number) => `${(score / 100_000).toFixed(2)} km`
const fmtTenthHearts = (score: number) => (score / 10).toLocaleString(undefined, { maximumFractionDigits: 1 })
const fmtSecondsToHm = (score: number, t: (k: string, p?: Record<string, unknown>) => string) => {
  const h = Math.floor(score / 3600)
  const m = Math.floor((score % 3600) / 60)
  return t('metric.play_time_fmt', { h, m })
}

// ---- Per-game registries ------------------------------------------------

const MC_JAVA: MetricDef[] = [
  { key: 'play_time', i18nKey: 'metric.play_time', format: fmtPlayTimeTicks, summary: true },
  { key: 'mob_kills_total', i18nKey: 'metric.mob_kills_total', format: fmtPlain, summary: true },
  { key: 'pvp_kills', i18nKey: 'metric.pvp_kills', format: fmtPlain, summary: true },
  { key: 'deaths', i18nKey: 'metric.deaths', format: fmtPlain, summary: true },
  { key: 'blocks_broken_total', i18nKey: 'metric.blocks_broken_total', format: fmtPlain, summary: true },
  { key: 'distance_walked', i18nKey: 'metric.distance_walked', format: fmtCmToKm },
  { key: 'distance_sprinted', i18nKey: 'metric.distance_sprinted', format: fmtCmToKm },
  { key: 'distance_flown', i18nKey: 'metric.distance_flown', format: fmtCmToKm },
  { key: 'damage_dealt', i18nKey: 'metric.damage_dealt', format: fmtTenthHearts },
  { key: 'damage_taken', i18nKey: 'metric.damage_taken', format: fmtTenthHearts },
]

const MC_BEDROCK: MetricDef[] = [
  { key: 'play_time', i18nKey: 'metric.play_time', format: fmtSecondsToHm, summary: true },
  { key: 'mob_kills_total', i18nKey: 'metric.mob_kills_total', format: fmtPlain, summary: true },
  { key: 'pvp_kills', i18nKey: 'metric.pvp_kills', format: fmtPlain, summary: true },
  { key: 'deaths', i18nKey: 'metric.deaths', format: fmtPlain, summary: true },
  { key: 'blocks_broken_total', i18nKey: 'metric.blocks_broken_total', format: fmtPlain, summary: true },
]

const DST: MetricDef[] = [
  { key: 'days_survived', i18nKey: 'metric.days_survived', format: fmtPlain, summary: true },
  { key: 'play_time', i18nKey: 'metric.play_time', format: fmtSecondsToHm, summary: true },
  { key: 'kills_total', i18nKey: 'metric.kills_total', format: fmtPlain, summary: true },
  { key: 'deaths', i18nKey: 'metric.deaths', format: fmtPlain, summary: true },
  { key: 'sanity_lost', i18nKey: 'metric.sanity_lost', format: fmtPlain },
]

const TERRARIA: MetricDef[] = [
  { key: 'play_time', i18nKey: 'metric.play_time', format: fmtSecondsToHm, summary: true },
  { key: 'bosses_defeated', i18nKey: 'metric.bosses_defeated', format: fmtPlain, summary: true },
  { key: 'mob_kills_total', i18nKey: 'metric.mob_kills_total', format: fmtPlain, summary: true },
  { key: 'deaths', i18nKey: 'metric.deaths', format: fmtPlain, summary: true },
]

const GENERIC: MetricDef[] = [
  { key: 'play_time', i18nKey: 'metric.play_time', format: fmtSecondsToHm, summary: true },
]

const REGISTRY: Record<string, MetricDef[]> = {
  'mc-java': MC_JAVA,
  'mc-bedrock': MC_BEDROCK,
  'dst': DST,
  'terraria': TERRARIA,
}

export function useGameMetrics(type: MaybeRefOrGetter<ServerType | undefined | null>) {
  const { t } = useI18n()
  const defs = computed(() => {
    const v = toValue(type)
    return (v && REGISTRY[v]) || GENERIC
  })

  const labelFor = (key: string) => {
    const def = defs.value.find(d => d.key === key)
    const i18nKey = def?.i18nKey || `metric.${key}`
    const translated = t(i18nKey)
    return translated === i18nKey ? key : translated
  }

  const formatScore = (key: string, score: number): string => {
    const def = defs.value.find(d => d.key === key)
    return def ? def.format(score, t) : fmtPlain(score)
  }

  const options = computed(() => defs.value.map(d => ({ value: d.key, label: labelFor(d.key) })))
  const summaryKeys = computed(() => defs.value.filter(d => d.summary).map(d => d.key))

  return { defs, labelFor, formatScore, options, summaryKeys }
}
