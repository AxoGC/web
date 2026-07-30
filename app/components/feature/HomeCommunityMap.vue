<template>
  <section>
    <UiCard class="overflow-hidden">
      <div v-if="!entries.length" class="p-8">
        <header class="mb-4">
          <h2 class="text-xl font-semibold">{{ $t('home.community_map_title') }}</h2>
        </header>
        <UiEmpty :message="$t('home.community_map_empty')" />
      </div>
      <div v-else class="relative">
        <header class="absolute top-0 left-0 z-10 m-3 px-3 py-2">
          <i18n-t keypath="home.community_map_subtitle" tag="h2" class="text-lg text-text-primary">
            <template #provinces><span class="text-2xl font-bold text-brand-400">{{ provinceCount }}</span></template>
            <template #cities><span class="text-2xl font-bold text-brand-400">{{ cityCount }}</span></template>
            <template #players><span class="text-2xl font-bold text-brand-400">{{ playerCount }}</span></template>
          </i18n-t>
        </header>
        <ClientOnly>
          <VChart
            v-if="chartOption"
            :option="chartOption"
            autoresize
            class="w-full h-[312px] md:h-[480px]"
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
import { initials, colorForName } from '~/utils/format'
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

// Choropleth: empty province stays the map's blank base color, populated
// provinces wash toward the brand color proportional to their player share.
// Capped well short of full saturation (BLEND_MAX) so even the busiest
// province stays a light tint — the pins are solid brand blue and need to
// read clearly against the fill, not blend into it. Canvas can't resolve
// CSS custom properties, so literal per-theme colors — pure white reads
// fine as "blank" in light mode but is jarringly bright in dark mode.
const { resolved: themeMode } = useTheme()
const MAP_BASE = {
  light: { area: [255, 255, 255], border: '#d8dce2', hoverArea: '#eef2f5' },
  dark: { area: [28, 31, 38], border: '#2f343f', hoverArea: '#232730' },
} as const

const BLEND_MIN = 0.12
const BLEND_MAX = 0.45
const BRAND_RGB = [0x28, 0xab, 0xce]
function blendWithBrand(t: number, base: readonly number[]): string {
  const rgb = BRAND_RGB.map((to, i) => Math.round(base[i]! + (to - base[i]!) * t))
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
}

const provinceRegions = computed(() => {
  const base = MAP_BASE[themeMode.value].area
  const counts = new Map<string, number>()
  for (const p of points.value) {
    counts.set(p.coord.province, (counts.get(p.coord.province) || 0) + p.entry.count)
  }
  const max = Math.max(1, ...counts.values())
  return [...counts.entries()].map(([name, count]) => ({
    name,
    itemStyle: { areaColor: blendWithBrand(BLEND_MIN + (BLEND_MAX - BLEND_MIN) * (count / max), base) },
  }))
})

const PIN_R = 14
// Head-center distance of r*sqrt(2) from the tip is what makes the tip a
// true right angle with both sides tangent to the circle (classic pin
// construction): tangent points sit at (±r/sqrt(2), -r/sqrt(2)) from the
// tip regardless of r, so cy falls out of that same relationship.
const PIN_HEAD_Y = -(PIN_R * Math.SQRT2)
function pinPathData(r: number): string {
  const t = r / Math.SQRT2
  return `M0,0 L${-t},${-t} A${r},${r} 0 1,1 ${t},${-t} Z`
}

const chartOption = computed(() => {
  if (!mapRegistered.value) return null
  const pts = points.value
  const base = MAP_BASE[themeMode.value]

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
      // The bundled boundary includes the South China Sea islands inset,
      // which stretches the auto-fit bounding box far south of anywhere
      // anyone actually lives — recenter/zoom on the mainland instead of
      // defaulting to that full, mostly-empty extent.
      center: [104, 36],
      zoom: 1.7,
      scaleLimit: { min: 1, max: 8 },
      itemStyle: { areaColor: `rgb(${base.area.join(',')})`, borderColor: base.border },
      emphasis: { itemStyle: { areaColor: base.hoverArea }, label: { show: false } },
      regions: provinceRegions.value,
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
            shape: { pathData: pinPathData(PIN_R) },
            position: [x, y],
            style: { fill: '#28abce', stroke: '#fff', lineWidth: 1.5 },
            z2: 10,
          },
        ]
        if (first) {
          // Same fallback as UiAvatar: a colored circle + initials, drawn
          // underneath so it still shows if the avatar image never loads
          // (zrender's Image element has no built-in @error swap like the
          // DOM <img> UiAvatar itself uses).
          children.push({
            type: 'circle',
            position: [x, y],
            shape: { cx: 0, cy: PIN_HEAD_Y, r: PIN_R - 2 },
            style: { fill: colorForName(first.username) },
            z2: 11,
          })
          children.push({
            type: 'text',
            position: [x, y],
            style: {
              text: initials(first.username),
              x: 0,
              y: PIN_HEAD_Y,
              fill: '#fff',
              fontSize: 9,
              fontWeight: 'bold',
              align: 'center',
              verticalAlign: 'middle',
            },
            z2: 12,
          })
          if (first.avatar) {
            children.push({
              type: 'image',
              position: [x, y],
              style: { image: first.avatar, x: -imgSize / 2, y: PIN_HEAD_Y - imgSize / 2, width: imgSize, height: imgSize },
              clipPath: { type: 'circle', shape: { cx: 0, cy: PIN_HEAD_Y, r: PIN_R - 2 } },
              z2: 13,
            })
          }
        }
        if (item.entry.count > 1) {
          const badgeR = PIN_R * 0.65
          const bx = PIN_R * 0.75
          const by = PIN_HEAD_Y - PIN_R * 0.75
          children.push({
            type: 'circle',
            position: [x, y],
            shape: { cx: bx, cy: by, r: badgeR },
            style: { fill: '#ef4444', stroke: '#fff', lineWidth: 1 },
            z2: 14,
          })
          children.push({
            type: 'text',
            position: [x, y],
            style: {
              text: item.entry.count > 99 ? '99+' : String(item.entry.count),
              x: bx,
              y: by,
              fill: '#fff',
              fontSize: 10,
              fontWeight: 'bold',
              align: 'center',
              verticalAlign: 'middle',
            },
            z2: 15,
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
