<template>
  <section>
    <header class="mb-4">
      <h2 class="text-xl font-semibold">{{ $t('home.community_map_title') }}</h2>
      <p v-if="entries.length" class="mt-1 text-sm text-text-secondary">
        <i18n-t keypath="home.community_map_subtitle" tag="span">
          <template #provinces><span class="text-lg font-bold text-brand-400">{{ provinceCount }}</span></template>
          <template #cities><span class="text-lg font-bold text-brand-400">{{ cityCount }}</span></template>
          <template #players><span class="text-lg font-bold text-brand-400">{{ playerCount }}</span></template>
        </i18n-t>
      </p>
    </header>

    <UiCard class="overflow-hidden">
      <div v-if="!entries.length" class="p-8">
        <UiEmpty :message="$t('home.community_map_empty')" />
      </div>
      <div v-else class="relative">
        <ClientOnly>
          <VChart
            v-if="chartOption"
            :option="chartOption"
            autoresize
            style="width: 100%; height: 480px;"
            @click="onChartClick"
          />
        </ClientOnly>

        <PopoverRoot v-model:open="popoverOpen">
          <PopoverAnchor as-child>
            <div :style="{ position: 'absolute', left: `${anchor.x}px`, top: `${anchor.y}px`, width: '1px', height: '1px' }" />
          </PopoverAnchor>
          <PopoverPortal>
            <PopoverContent
              :side-offset="8"
              class="z-50 w-64 bg-bg-elevated border border-border-default rounded-md shadow-md p-3 text-sm"
            >
              <div v-if="activeCity" class="space-y-2">
                <div class="font-semibold">{{ activeCity.coord.name }} · {{ activeCity.entry.count }}</div>
                <ul class="space-y-1.5 max-h-64 overflow-auto">
                  <li v-for="u in activeCity.entry.users" :key="u.id">
                    <NuxtLink :to="`/users/${u.id}`" class="flex items-center gap-2 group min-w-0" @click="popoverOpen = false">
                      <UiAvatar :name="u.username" :src="u.avatar" size="xs" />
                      <span class="text-sm truncate group-hover:text-brand-400">{{ u.username }}</span>
                    </NuxtLink>
                  </li>
                </ul>
                <p v-if="activeCity.entry.count > activeCity.entry.users.length" class="text-xs text-text-tertiary pt-1">
                  {{ $t('home.community_map_more', { n: activeCity.entry.count - activeCity.entry.users.length }) }}
                </p>
              </div>
            </PopoverContent>
          </PopoverPortal>
        </PopoverRoot>
      </div>
    </UiCard>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { PopoverRoot, PopoverAnchor, PopoverPortal, PopoverContent } from 'reka-ui'
import type { CityMapEntry } from '~/types/api'
import { useCityCoords, type CityCoord } from '~/composables/useCityCoords'
import { useTheme } from '~/composables/useTheme'

const { data } = await useAsyncData('home.city_map', () =>
  useApi<{ items: CityMapEntry[] }>('/api/users/by-city').catch(() => ({ items: [] as CityMapEntry[] })),
)
const entries = computed(() => data.value?.items ?? [])

const cityCoords = ref<Record<string, CityCoord>>({})
const mapRegistered = ref(false)

onMounted(async () => {
  const [coords, geoJson] = await Promise.all([
    useCityCoords().load(),
    $fetch<object>('/data/china-provinces.geo.json'),
  ])
  cityCoords.value = coords
  const echarts = await import('echarts/core')
  echarts.registerMap('china', geoJson as never)
  mapRegistered.value = true
})

interface MapPoint {
  cityCode: string
  coord: CityCoord
  entry: CityMapEntry
}

const points = computed<MapPoint[]>(() => {
  const out: MapPoint[] = []
  for (const entry of entries.value) {
    const coord = cityCoords.value[entry.city_code]
    if (coord) out.push({ cityCode: entry.city_code, coord, entry })
  }
  return out
})

const provinceCount = computed(() => new Set(points.value.map(p => p.coord.province)).size)
const cityCount = computed(() => points.value.length)
const playerCount = computed(() => points.value.reduce((sum, p) => sum + p.entry.count, 0))

// Canvas can't resolve CSS custom properties, so literal colors per theme —
// same reasoning as ServerOnlineTrendCard's chart.
const { resolved: themeMode } = useTheme()
const MAP_COLORS = {
  dark: { area: '#1c1f26', border: '#2f343f', hoverArea: '#232730' },
  light: { area: '#f4f6f8', border: '#e1e4e9', hoverArea: '#eef0f3' },
} as const

const PIN_R = 10
const PIN_HEAD_Y = -(PIN_R * 2.2)
function pinPathData(r: number, cy: number): string {
  const tx = r * 0.55
  const ty = cy + r * 0.75
  return `M0,0 L${-tx},${ty} A${r},${r} 0 1,1 ${tx},${ty} Z`
}

const chartOption = computed(() => {
  if (!mapRegistered.value) return null
  const c = MAP_COLORS[themeMode.value]
  const pts = points.value

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: { dataIndex: number }) => {
        const item = pts[params.dataIndex]
        return item ? `${item.coord.name} · ${item.entry.count}` : ''
      },
    },
    geo: {
      map: 'china',
      roam: true,
      scaleLimit: { min: 1, max: 8 },
      itemStyle: { areaColor: c.area, borderColor: c.border },
      emphasis: { itemStyle: { areaColor: c.hoverArea }, label: { show: false } },
      label: { show: false },
    },
    series: [{
      type: 'custom',
      coordinateSystem: 'geo',
      data: pts,
      renderItem: (params: { dataIndex: number }, api: { coord: (v: [number, number]) => number[] }) => {
        const item = pts[params.dataIndex]
        if (!item) return { type: 'group', children: [] }
        const [x, y] = api.coord([item.coord.lng, item.coord.lat])
        const first = item.entry.users[0]
        const imgSize = (PIN_R - 2) * 2

        const children: Record<string, unknown>[] = [
          {
            type: 'path',
            shape: { pathData: pinPathData(PIN_R, PIN_HEAD_Y) },
            position: [x, y],
            style: { fill: '#28abce', stroke: '#fff', lineWidth: 1.5 },
            z2: 10,
          },
        ]
        if (first?.avatar) {
          children.push({
            type: 'image',
            position: [x, y],
            style: { image: first.avatar, x: -imgSize / 2, y: PIN_HEAD_Y - imgSize / 2, width: imgSize, height: imgSize },
            clipPath: { type: 'circle', shape: { cx: 0, cy: PIN_HEAD_Y, r: PIN_R - 2 } },
            z2: 11,
          })
        }
        if (item.entry.count > 1) {
          const bx = PIN_R * 0.75
          const by = PIN_HEAD_Y - PIN_R * 0.75
          children.push({
            type: 'circle',
            position: [x, y],
            shape: { cx: bx, cy: by, r: 7 },
            style: { fill: '#ef4444', stroke: '#fff', lineWidth: 1 },
            z2: 12,
          })
          children.push({
            type: 'text',
            position: [x, y],
            style: {
              text: item.entry.count > 99 ? '99+' : String(item.entry.count),
              x: bx,
              y: by,
              fill: '#fff',
              fontSize: 9,
              fontWeight: 'bold',
              align: 'center',
              verticalAlign: 'middle',
            },
            z2: 13,
          })
        }
        return { type: 'group', children }
      },
    }],
  }
})

const popoverOpen = ref(false)
const anchor = ref({ x: 0, y: 0 })
const activeCity = ref<MapPoint | null>(null)

function onChartClick(params: { dataIndex: number, event?: { offsetX: number, offsetY: number } }) {
  const item = points.value[params.dataIndex]
  if (!item) return
  activeCity.value = item
  if (params.event) anchor.value = { x: params.event.offsetX, y: params.event.offsetY }
  popoverOpen.value = true
}
</script>
