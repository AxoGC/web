<template>
  <div class="flex flex-col sm:flex-row gap-3">
    <!-- Mobile: skin + radar share one row. Desktop (sm+): `contents` drops
         this wrapper so both become direct children of the outer flex-row,
         landing in the required skin → radar → stats left-to-right order. -->
    <div class="flex gap-3 sm:contents">
      <div class="shrink-0" :style="{ width: `${SKIN_W}px`, height: `${SKIN_H}px` }">
        <ClientOnly>
          <canvas v-show="skinAvailable" ref="canvasEl" class="block" />
        </ClientOnly>
      </div>
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
    <!-- Six metrics: 3x2 grid on mobile (row 2), 2x3 on desktop (grows to
         fill the row). Fixed panel height (no ResizeObserver/setSize dance
         like ServerMyPlayerCard) is deliberate here — a per-binding-row list
         can render several of these at once, so keeping sizing static and
         cheap matters more than the skin/radar filling exactly-available
         space. -->
    <div class="grid grid-cols-3 sm:grid-cols-2 gap-2 content-center sm:flex-1 sm:min-w-0">
      <div
        v-for="axis in axes"
        :key="axis.key"
        class="bg-bg-overlay/40 rounded px-2.5 py-1.5"
      >
        <p class="text-[10px] text-text-tertiary uppercase tracking-wide truncate">
          {{ metrics.labelFor(serverId, axis.key) }}
        </p>
        <p class="text-sm font-medium text-text-primary truncate">
          {{ metrics.formatScore(serverId, axis.key, axis.value) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { StatsAxis } from '~/types/api'
import type { useMetricsRegistry } from '~/composables/useServerMetrics'

const props = defineProps<{
  serverId: number
  gameName: string
  axes: StatsAxis[]
  metrics: ReturnType<typeof useMetricsRegistry>
}>()

const SKIN_W = 96
const SKIN_H = 144
const RADAR_W = 160
const RADAR_H = 144

const canvasEl = ref<HTMLCanvasElement | null>(null)
const skinAvailable = ref(false)
let viewer: import('skinview3d').SkinViewer | null = null

function disposeViewer() {
  viewer?.dispose()
  viewer = null
}

// Same "try quietly, only reveal on success" pattern as ServerMyPlayerCard —
// non-Java accounts or unregistered names just never resolve the skin proxy,
// leaving the stats-only layout.
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

// Compact glance radar: axis names are omitted (the stat grid alongside
// already spells out label + value), so this is purely the shape at a
// smaller size than the dedicated player-stats page's chart.
const chartOption = computed(() => {
  const list = props.axes
  if (!list.length || !list.some(a => a.value > 0)) return null
  const clamp = (v: number) => Math.min(100, Math.max(0, v || 0))
  return {
    backgroundColor: 'transparent',
    radar: {
      indicator: list.map(() => ({ max: 100 })),
      shape: 'polygon',
      splitNumber: 4,
      center: ['50%', '50%'],
      radius: '68%',
      axisName: { show: false },
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
