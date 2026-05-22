import { computed, ref, unref, watch } from 'vue'
import type { MaybeRef, ComputedRef, Ref } from 'vue'

/**
 * Plugin-owned axis metadata (PLAN §10.6). The platform serves these from
 * `GET /api/servers/:id/metrics` after fetching `metrics.list` from the plugin
 * via the long-poll bridge — the web side reads labels and units verbatim, so
 * adding a new axis is a plugin-only change.
 */
export interface ServerMetric {
  key: string
  unit: string
  label_zh: string
  label_en: string
  scale: number
  order: number
  champion: boolean
}

interface MetricsEnvelope { items: ServerMetric[] }

// Module-level cache: one in-flight promise per server id. Lives for the
// lifetime of the page session — server-side metric defs effectively don't
// change without a plugin redeploy, and core caches them for 1h anyway.
const cache = new Map<number, Promise<ServerMetric[]>>()

function loadMetricsFor(serverId: number): Promise<ServerMetric[]> {
  const hit = cache.get(serverId)
  if (hit) return hit
  const p = useApi<MetricsEnvelope>(`/api/servers/${serverId}/metrics`)
    .then(r => (r.items || []).slice().sort((a, b) => a.order - b.order))
    .catch(() => [] as ServerMetric[])
  cache.set(serverId, p)
  return p
}

type Translator = (k: string, p?: Record<string, unknown>) => string

function formatByUnit(unit: string, value: number, t: Translator): string {
  if (unit === 's') {
    const h = Math.floor(value / 3600)
    const m = Math.floor((value % 3600) / 60)
    return t('metric.play_time_fmt', { h, m })
  }
  if (unit === 'm') {
    return value >= 1000
      ? `${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} km`
      : `${Math.round(value)} m`
  }
  if (unit === 'd') {
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} d`
  }
  if (Number.isInteger(value)) return value.toLocaleString()
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

/**
 * Per-server axis metadata + helpers. Pass a reactive id when the page can
 * navigate between servers; otherwise a plain string/number is fine.
 *
 * Helpers are safe before the fetch resolves — they return the axis key as
 * the label and use a generic numeric format, so the page still renders.
 */
export function useServerMetrics(serverId: MaybeRef<string | number | null | undefined>) {
  const { t, locale } = useI18n()
  const metrics = ref<ServerMetric[]>([]) as Ref<ServerMetric[]>
  const loading = ref(false)
  let readyResolve: () => void = () => {}
  const readyRef = ref<Promise<void>>(new Promise<void>(r => { readyResolve = r }))

  const sid = computed(() => {
    const v = unref(serverId)
    if (v === null || v === undefined || v === '') return 0
    return Number(v) || 0
  })

  async function load(id: number) {
    if (!id) { metrics.value = []; readyResolve(); return }
    loading.value = true
    try { metrics.value = await loadMetricsFor(id) }
    finally { loading.value = false; readyResolve() }
  }

  watch(sid, id => {
    // Reset the ready barrier so callers can await the new id's load. The
    // resolver is captured by closure for each id transition.
    readyRef.value = new Promise<void>(r => { readyResolve = r })
    void load(id)
  }, { immediate: true })

  const byKey: ComputedRef<Record<string, ServerMetric>> = computed(() => {
    const out: Record<string, ServerMetric> = {}
    for (const m of metrics.value) out[m.key] = m
    return out
  })

  const labelFor = (key: string): string => {
    const m = byKey.value[key]
    if (!m) return key
    return locale.value.startsWith('zh') ? (m.label_zh || m.label_en || key) : (m.label_en || m.label_zh || key)
  }

  const tr: Translator = (k, p) => String(t(k, (p ?? {}) as Record<string, unknown>))

  const formatScore = (key: string, score: number): string => {
    const m = byKey.value[key]
    return formatByUnit(m?.unit ?? '', score, tr)
  }

  const keys: ComputedRef<string[]> = computed(() => metrics.value.map(m => m.key))
  const options = computed(() => metrics.value.map(m => ({ value: m.key, label: labelFor(m.key) })))

  // readyRef.value is a Promise that resolves once the current sid's metric
  // list has been fetched (success or empty). Await it inside useAsyncData
  // blocks to make SSR render the populated list rather than the skeleton.
  return { metrics, loading, ready: readyRef, byKey, labelFor, formatScore, keys, options }
}

/**
 * Registry variant for pages that span multiple servers (e.g. user profile,
 * which shows binding stats from every server the user is on). Caches by
 * server id across calls. Returns helpers that take the server id explicitly.
 */
export function useMetricsRegistry() {
  const { t, locale } = useI18n()
  const tables = ref<Record<number, ServerMetric[]>>({})

  async function loadFor(serverId: number): Promise<ServerMetric[]> {
    if (!serverId) return []
    if (tables.value[serverId]) return tables.value[serverId]!
    const list = await loadMetricsFor(serverId)
    tables.value = { ...tables.value, [serverId]: list }
    return list
  }

  const tr: Translator = (k, p) => String(t(k, (p ?? {}) as Record<string, unknown>))

  function metricOf(serverId: number, key: string): ServerMetric | undefined {
    return tables.value[serverId]?.find(m => m.key === key)
  }

  function labelFor(serverId: number, key: string): string {
    const m = metricOf(serverId, key)
    if (!m) return key
    return locale.value.startsWith('zh') ? (m.label_zh || m.label_en || key) : (m.label_en || m.label_zh || key)
  }

  function formatScore(serverId: number, key: string, score: number): string {
    const m = metricOf(serverId, key)
    return formatByUnit(m?.unit ?? '', score, tr)
  }

  return { loadFor, labelFor, formatScore }
}
