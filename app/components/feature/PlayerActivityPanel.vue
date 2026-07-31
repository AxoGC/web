<template>
  <div class="flex flex-col gap-3">
    <!-- 24h playtime bar: gray = not-online, brand = online, built from the
         last 24h of online_stats samples (5-min cadence, so every segment
         and the total below are inherently multiples of 5 minutes). -->
    <div>
      <div class="relative h-4 rounded overflow-hidden bg-bg-overlay">
        <div
          v-for="(seg, i) in onSegments"
          :key="i"
          class="absolute inset-y-0 bg-brand-500"
          :style="{ left: seg.left + '%', width: seg.width + '%' }"
        />
      </div>
      <div class="relative h-1.5 mt-0.5">
        <span
          v-for="tk in ticks"
          :key="tk.ms"
          class="absolute top-0 w-px h-1.5 bg-border-default"
          :style="{ left: tk.pct + '%' }"
        />
      </div>
      <div class="relative h-4 text-[10px] text-text-tertiary">
        <span
          v-for="tk in ticks"
          :key="tk.ms"
          class="absolute -translate-x-1/2"
          :style="{ left: tk.pct + '%' }"
        >{{ tk.label }}</span>
      </div>
      <div class="flex items-center justify-between text-xs mt-1">
        <span :class="isOnlineNow ? 'text-brand-400 font-medium' : 'text-text-tertiary'">
          {{ statusLabel }}
        </span>
        <span class="text-text-secondary">{{ playedLabel }}</span>
      </div>
    </div>

    <!-- Skin + radar always sit side by side, and the stat grid is always
         3 cols x 2 rows — this component doesn't reflow itself at any
         breakpoint. Fitting more per row on wide screens is the *caller's*
         job (e.g. arranging several of these in a grid-cols-2 layout),
         not this component reshaping its own internals. -->
    <div v-if="axes.length" class="flex gap-3">
      <ClientOnly>
        <div v-show="skinAvailable" class="shrink-0" :style="{ width: `${SKIN_W}px`, height: `${SKIN_H}px` }">
          <canvas ref="canvasEl" class="block" />
        </div>
      </ClientOnly>
      <div class="shrink-0" :style="{ width: `${RADAR_W}px`, height: `${RADAR_H}px` }">
        <ClientOnly>
          <VChart
            v-if="chartOption"
            :option="chartOption"
            :style="{ width: `${RADAR_W}px`, height: `${RADAR_H}px` }"
          />
        </ClientOnly>
      </div>
    </div>
    <div v-if="axes.length" class="grid grid-cols-3 gap-2">
      <div
        v-for="axis in axes"
        :key="axis.key"
        class="bg-bg-overlay/40 rounded px-2.5 py-1.5"
      >
        <p class="text-[10px] text-text-tertiary uppercase tracking-wide truncate">
          {{ metrics.labelFor(axis.key) }}
        </p>
        <p class="text-sm font-medium text-text-primary truncate">
          {{ metrics.formatScore(axis.key, axis.value) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, toRef, watch } from 'vue'
import type { OnlineStatPoint, PlayerStats, StatsAxis } from '~/types/api'

// Self-contained: given a (server, player) pair, fetches its own metrics defs,
// stat axes, and 24h online-stats window. Used both for "my own bound
// character" (ServerMyPlayerCard resolves that name via bind/status, then
// passes it down) and for arbitrary bindings on the user profile page (each
// row already knows its own server_id/game_name) — this component doesn't
// care which case it's in.
const props = defineProps<{ serverId: string | number, gameName: string }>()
const { t } = useI18n()
const metrics = useServerMetrics(toRef(props, 'serverId'))

const SKIN_W = 96
const SKIN_H = 144
const RADAR_W = 160
const RADAR_H = 144

const { data: statsData } = await useAsyncData(
  () => `playeractivity.stats.${props.serverId}.${props.gameName}`,
  async () => {
    await metrics.ready.value
    return useApi<PlayerStats>(`/api/servers/${props.serverId}/players/${encodeURIComponent(props.gameName)}/stats`).catch(() => null)
  },
)
const axes = computed<StatsAxis[]>(() => statsData.value?.stats?.slice(0, 6) ?? [])

// Same fetch key as ServerOnlineTrendCard/ServerMyPlayerCard's default range —
// Nuxt dedupes by key, so same-server instances reuse one request.
const { data: onlineStats } = await useAsyncData(
  () => `server.stats.${props.serverId}.24h`,
  () => useApi<{ points: OnlineStatPoint[] }>(`/api/servers/${props.serverId}/stats?range=24h`).catch(() => ({ points: [] })),
)

const FIVE_MIN_MS = 5 * 60 * 1000
const nowMs = Date.now()
const windowStartMs = nowMs - 24 * 60 * 60 * 1000
const windowMs = nowMs - windowStartMs

// Each online_stats sample stands for the 5 minutes following it — merge
// consecutive/overlapping intervals so a clean run of samples renders as one
// solid segment instead of visible seams every 5 minutes.
const mergedOnIntervals = computed<[number, number][]>(() => {
  const pts = onlineStats.value?.points ?? []
  const intervals: [number, number][] = []
  for (const p of pts) {
    if (!p.players?.includes(props.gameName)) continue
    const start = Math.max(p.recorded_at * 1000, windowStartMs)
    const end = Math.min(p.recorded_at * 1000 + FIVE_MIN_MS, nowMs)
    if (end > start) intervals.push([start, end])
  }
  intervals.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const [s, e] of intervals) {
    const last = merged[merged.length - 1]
    if (last && s <= last[1]) last[1] = Math.max(last[1], e)
    else merged.push([s, e])
  }
  return merged
})

const onSegments = computed(() => mergedOnIntervals.value.map(([s, e]) => ({
  left: ((s - windowStartMs) / windowMs) * 100,
  width: ((e - s) / windowMs) * 100,
})))

const playedMinutes = computed(() => Math.round(
  mergedOnIntervals.value.reduce((sum, [s, e]) => sum + (e - s), 0) / 60000,
))
const playedLabel = computed(() => t('server.today_played', {
  h: Math.floor(playedMinutes.value / 60),
  m: playedMinutes.value % 60,
}))

// "Online now" is read off the most recent sample rather than a live presence
// check — per the "everything from the online_stats table" data source, this
// can lag by up to one sampling interval (5 min).
const isOnlineNow = computed(() => {
  const pts = onlineStats.value?.points ?? []
  const last = pts[pts.length - 1]
  return !!last?.players?.includes(props.gameName)
})

function hm(ms: number) {
  const minutes = Math.round(ms / 60000)
  return { h: Math.floor(minutes / 60), m: minutes % 60 }
}

// Duration of the *current* continuous state, derived from the merged
// interval that touches "now": if online, that's the run since it started
// (its end is always clamped to now); if offline, it's the time since the
// most recent run ended. No online run at all in the window means "offline
// for at least the whole visible day" — the window length is the best lower
// bound we have from this data.
const statusLabel = computed(() => {
  const last = mergedOnIntervals.value[mergedOnIntervals.value.length - 1]
  if (isOnlineNow.value) {
    return t('server.online_for', hm(last ? nowMs - last[0] : 0))
  }
  return t('server.offline_for', hm(last ? nowMs - last[1] : windowMs))
})

// Ruler ticks at local-time 6-hour marks (00:00/06:00/12:00/18:00) that fall
// inside the window, so labels read as real wall-clock time regardless of
// what moment "now" happens to be.
function alignedTicks(startMs: number, endMs: number) {
  const span = endMs - startMs
  const out: { ms: number, pct: number, label: string }[] = []
  const d = new Date(startMs)
  d.setMinutes(0, 0, 0)
  const rem = d.getHours() % 6
  if (rem !== 0) d.setHours(d.getHours() + (6 - rem))
  if (d.getTime() < startMs) d.setHours(d.getHours() + 6)
  while (d.getTime() <= endMs) {
    out.push({
      ms: d.getTime(),
      pct: ((d.getTime() - startMs) / span) * 100,
      label: `${String(d.getHours()).padStart(2, '0')}:00`,
    })
    d.setHours(d.getHours() + 6)
  }
  return out
}
const ticks = computed(() => alignedTicks(windowStartMs, nowMs))

const canvasEl = ref<HTMLCanvasElement | null>(null)
const skinAvailable = ref(false)
let viewer: import('skinview3d').SkinViewer | null = null

function disposeViewer() {
  viewer?.dispose()
  viewer = null
}

// Skin is optional flourish, not the point of the panel: try to load it
// against the already-mounted (but hidden) canvas, and only reveal it on
// success — a Bedrock/DST/Terraria name or an unbound Java account never
// resolves via the skin proxy, so this silently falls back to stats-only.
// Fixed 96x144 (2:3) canvas — no ResizeObserver/setSize dance to keep the
// WebGL render target following content height; not worth the complexity
// for a fixed-height panel.
watch(canvasEl, async (el) => {
  disposeViewer()
  skinAvailable.value = false
  if (!el) return
  const { SkinViewer } = await import('skinview3d')
  const v = new SkinViewer({ canvas: el, width: SKIN_W, height: SKIN_H })
  v.autoRotate = true
  v.autoRotateSpeed = 0.8
  try {
    await v.loadSkin(`/api/servers/${props.serverId}/players/${encodeURIComponent(props.gameName)}/skin`)
    viewer = v
    skinAvailable.value = true
  }
  catch {
    v.dispose()
  }
}, { immediate: true })

onBeforeUnmount(disposeViewer)

// Compact radar — same visual language as the dedicated player-stats page's
// chart, just smaller: axis names shrink to fit and the radius backs off to
// leave them room inside the fixed 160x144 box.
const chartOption = computed(() => {
  const list = axes.value
  if (!list.length || !list.some(a => a.value > 0)) return null
  const clamp = (v: number) => Math.min(100, Math.max(0, v || 0))
  return {
    backgroundColor: 'transparent',
    radar: {
      indicator: list.map(a => ({ name: metrics.labelFor(a.key), max: 100 })),
      shape: 'polygon',
      splitNumber: 4,
      center: ['50%', '52%'],
      radius: '48%',
      axisName: {
        color: '#4dc0df',
        fontSize: 9,
        fontWeight: 600,
      },
      splitLine: {
        lineStyle: {
          color: [
            'rgba(40,171,206,0.15)',
            'rgba(40,171,206,0.22)',
            'rgba(40,171,206,0.30)',
            'rgba(40,171,206,0.40)',
          ],
          width: 1,
        },
      },
      axisLine: { lineStyle: { color: 'rgba(40,171,206,0.35)' } },
      splitArea: { areaStyle: { color: ['rgba(40,171,206,0.03)', 'rgba(40,171,206,0.08)'] } },
    },
    series: [{
      type: 'radar',
      symbol: 'circle',
      symbolSize: 3,
      data: [{
        value: list.map(a => clamp(a.percent)),
        areaStyle: {
          color: {
            type: 'radial',
            x: 0.5,
            y: 0.5,
            r: 0.5,
            colorStops: [
              { offset: 0, color: 'rgba(77,192,223,0.45)' },
              { offset: 1, color: 'rgba(40,171,206,0.12)' },
            ],
          },
        },
        lineStyle: { color: '#4dc0df', width: 2 },
        itemStyle: { color: '#4dc0df' },
      }],
    }],
  }
})
</script>
