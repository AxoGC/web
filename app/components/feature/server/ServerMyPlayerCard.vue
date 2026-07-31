<template>
  <UiCard v-if="playerName" padded>
    <h2 class="text-lg mb-3">{{ $t('server.my_player_title') }}</h2>

    <div class="mb-4">
      <!-- 24h playtime bar: gray = not-online, brand = online, built from the
           last 24h of online_stats samples (5-min cadence, so every segment
           and the total below are inherently multiples of 5 minutes). -->
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
          {{ isOnlineNow ? $t('common.online') : $t('common.offline') }}
        </span>
        <span class="text-text-secondary">{{ playedLabel }}</span>
      </div>
    </div>

    <div v-if="axes.length" class="flex gap-4">
      <ClientOnly>
        <div v-show="skinAvailable" class="shrink-0 w-24 h-36">
          <canvas ref="canvasEl" class="w-24 h-36" />
        </div>
      </ClientOnly>
      <dl class="flex-1 min-w-0 flex flex-col justify-center gap-2">
        <div v-for="axis in axes" :key="axis.key" class="flex items-center justify-between gap-3 text-sm">
          <dt class="text-text-tertiary truncate">{{ metrics.labelFor(axis.key) }}</dt>
          <dd class="font-mono text-text-primary tabular-nums">{{ metrics.formatScore(axis.key, axis.value) }}</dd>
        </div>
      </dl>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, toRef, watch } from 'vue'
import type { OnlineStatPoint, PlayerStats, StatsAxis } from '~/types/api'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{ serverId: string | number }>()
const auth = useAuthStore()
const { t } = useI18n()
const metrics = useServerMetrics(toRef(props, 'serverId'))

interface BindStatusResp {
  bound: boolean
  player?: { name: string, bound_at: number }
}

// Card shows the current user's own bound character on this server — hidden
// entirely for logged-out visitors or anyone who hasn't bound a character
// (self-gating, same pattern as ServerDescriptionCard).
const { data: bindStatus } = await useAsyncData(
  () => `server.myplayer.bind.${props.serverId}`,
  () => auth.isLoggedIn
    ? useApi<BindStatusResp>(`/api/servers/${props.serverId}/bind/status`).catch(() => null)
    : Promise.resolve(null),
  { watch: [() => auth.isLoggedIn] },
)
const playerName = computed(() => bindStatus.value?.bound ? bindStatus.value.player?.name : undefined)

const { data: statsData } = await useAsyncData(
  () => `server.myplayer.stats.${props.serverId}.${playerName.value}`,
  async () => {
    if (!playerName.value) return null
    await metrics.ready.value
    return useApi<PlayerStats>(`/api/servers/${props.serverId}/players/${encodeURIComponent(playerName.value)}/stats`).catch(() => null)
  },
  { watch: [playerName] },
)
const axes = computed<StatsAxis[]>(() => statsData.value?.stats?.slice(0, 6) ?? [])

// Same fetch key as ServerOnlineTrendCard's default range — Nuxt dedupes by
// key, so this reuses that request instead of firing a second one.
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
  const name = playerName.value
  if (!name) return []
  const pts = onlineStats.value?.points ?? []
  const intervals: [number, number][] = []
  for (const p of pts) {
    if (!p.players?.includes(name)) continue
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
  const name = playerName.value
  const pts = onlineStats.value?.points ?? []
  const last = pts[pts.length - 1]
  return !!name && !!last?.players?.includes(name)
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

// Skin is optional flourish, not the point of the card: try to load it against
// the already-mounted (but hidden) canvas, and only reveal it on success — a
// Bedrock/DST/Terraria name or an unbound Java account never resolves via the
// skin proxy, so this silently falls back to stats-only. Canvas is a fixed
// 96x144 (2:3) box — no ResizeObserver/setSize dance to keep the WebGL
// render target following the stat list's content height; that complexity
// wasn't worth it for a fixed-height card.
watch([canvasEl, playerName], async ([el, name]) => {
  disposeViewer()
  skinAvailable.value = false
  if (!el || !name) return
  const { SkinViewer } = await import('skinview3d')
  const v = new SkinViewer({ canvas: el, width: 96, height: 144 })
  v.autoRotate = true
  v.autoRotateSpeed = 0.8
  try {
    await v.loadSkin(`/api/servers/${props.serverId}/players/${encodeURIComponent(name)}/skin`)
    viewer = v
    skinAvailable.value = true
  }
  catch {
    v.dispose()
  }
}, { immediate: true })

onBeforeUnmount(disposeViewer)
</script>
