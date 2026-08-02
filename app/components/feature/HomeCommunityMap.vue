<template>
  <section ref="sectionEl">
    <UiCard class="overflow-hidden">
      <div v-if="!entries.length" class="p-8">
        <header class="mb-4">
          <h2 class="text-xl">{{ $t('home.community_map_title') }}</h2>
        </header>
        <UiEmpty :message="$t('home.community_map_empty')" />
      </div>
      <div v-else class="relative">
        <header
          class="absolute top-0 left-0 z-10 m-3 px-3 py-2 transition-all duration-700 ease-out motion-reduce:transition-none"
          :class="revealed ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'"
        >
          <i18n-t keypath="home.community_map_subtitle" tag="h2" class="text-base md:text-lg text-text-primary">
            <template #provinces><span class="text-xl md:text-2xl text-brand-400">{{ provinceCount }}</span></template>
            <template #cities><span class="text-xl md:text-2xl text-brand-400">{{ cityCount }}</span></template>
            <template #players><span class="text-xl md:text-2xl text-brand-400">{{ playerCount }}</span></template>
          </i18n-t>
          <p v-if="cityHintText" class="mt-1 text-xs text-text-tertiary">{{ cityHintText }}</p>
        </header>
        <div class="h-[312px] md:h-[480px]">
          <ClientOnly>
            <VChart
              v-if="chartOption"
              :option="chartOption"
              autoresize
              class="w-full h-full"
              @click="onChartClick"
            />
          </ClientOnly>
        </div>

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
                <div>{{ activeCity.coord.name }} · {{ activeCity.entry.count }}</div>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { PopoverRoot, PopoverAnchor, PopoverPortal, PopoverContent } from 'reka-ui'
import type { CityMapEntry } from '~/types/api'
import { useCityCoords, type CityCoord } from '~/composables/useCityCoords'
import { initials, colorForName } from '~/utils/format'
import { useTheme } from '~/composables/useTheme'
import { useAuthStore } from '~/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()

const { data } = await useAsyncData('home.city_map', () =>
  useApi<{ items: CityMapEntry[] }>('/api/users/by-city').catch(() => ({ items: [] as CityMapEntry[] })),
)
const entries = computed(() => data.value?.items ?? [])

// Second subtitle line nudging players to opt in to the map: hidden once
// they've already set a city, worded differently for guests (need to log in
// first) vs. logged-in players who just haven't filled in a city yet.
const myCityCode = computed(() => auth.user?.city_code)
const cityHintText = computed(() => {
  if (myCityCode.value) return null
  return auth.isLoggedIn ? t('home.community_map_hint_no_city') : t('home.community_map_hint_guest')
})

const cityCoords = ref<Record<string, CityCoord>>({})
const mapRegistered = ref(false)

// Reveal choreography: header fades/slides in immediately once the section
// scrolls into view (from either direction — IntersectionObserver doesn't
// care which way you crossed the threshold), pins start dropping a beat
// later so it reads as "text, then pins" rather than everything at once.
// Plays once per page load — once `revealed` flips the observer disconnects,
// so scrolling away and back doesn't replay it.
const sectionEl = ref<HTMLElement | null>(null)
const revealed = ref(false)
const pinsRevealed = ref(false)
const motionOk = ref(true)
let observer: IntersectionObserver | null = null
const PINS_AFTER_TEXT_MS = 200

onMounted(async () => {
  motionOk.value = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const [coords, geoJson] = await Promise.all([
    useCityCoords().load(),
    $fetch<object>('/data/china-provinces.geo.json'),
  ])
  cityCoords.value = coords
  const echarts = await import('echarts/core')
  echarts.registerMap('china', geoJson as never)
  mapRegistered.value = true

  if (sectionEl.value && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      revealed.value = true
      if (motionOk.value) {
        setTimeout(() => { pinsRevealed.value = true }, PINS_AFTER_TEXT_MS)
      } else {
        pinsRevealed.value = true
      }
      observer?.disconnect()
      observer = null
    }, { threshold: 0.2 })
    observer.observe(sectionEl.value)
  } else {
    // No IntersectionObserver (very old browser) — just show everything.
    revealed.value = true
    pinsRevealed.value = true
  }
})

onBeforeUnmount(() => observer?.disconnect())

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
// CSS custom properties, so literal per-theme colors — matched to the
// `--bg-base` token (the recessed layer beneath `--bg-elevated`, which is
// what the card itself, and thus the transparent area outside China's
// border, renders as) rather than pure white/near-black, so an empty
// province reads as a faint gray tile instead of blending into that
// surrounding blank space.
const { resolved: themeMode } = useTheme()
const MAP_BASE = {
  light: { area: [246, 247, 249], border: '#d8dce2', hoverArea: '#eef2f5' },
  dark: { area: [15, 17, 21], border: '#2f343f', hoverArea: '#232730' },
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
const PIN_STROKE_WIDTH = 1.5
// The 2x/3x/4x-person head-circle scaling (cbrt(count), see renderItem) is
// defined on this — the solid fill disc actually visible inside the white
// ring — not on the path's own centerline radius. Canvas strokes straddle
// the path outline (half in, half out), and that white ring stays a fixed
// 1.5px wide regardless of headcount, so scaling the centerline radius
// directly would leave the visible fill disc growing at a slightly-off
// ratio once that constant border width is netted out.
const PIN_FILL_R = PIN_R - PIN_STROKE_WIDTH / 2
const AVATAR_R = PIN_R - 2
// Head-center distance of r*sqrt(2) from the tip is what makes the tip a
// true right angle with both sides tangent to the circle (classic pin
// construction): tangent points sit at (±r/sqrt(2), -r/sqrt(2)) from the
// tip regardless of r, so head-center-y falls out of that same relationship.
function pinHeadY(r: number): number {
  return -(r * Math.SQRT2)
}
function pinPathData(r: number): string {
  const t = r / Math.SQRT2
  return `M0,0 L${-t},${-t} A${r},${r} 0 1,1 ${t},${-t} Z`
}

// Layout for up to 4 avatars sharing one pin head: individual avatar circles
// stay a fixed size (AVATAR_R), but their distance from the head center is
// *not* fixed — it's set so each avatar circle is internally tangent to the
// (headcount-scaled) head circle, i.e. center-to-center distance = headR -
// AVATAR_R. That distance grows with headR, so more players both enlarges
// the head circle and spreads its avatars further apart, keeping every
// avatar touching the inside of the border instead of overflowing past it
// (as a fixed offset would once the head circle shrinks/grows with count).
// Positions are relative to the head center; array order is top-to-bottom
// z-stacking (index 0 drawn last, on top), matching the order users are
// returned in. 5+ players falls back to a single avatar + count badge until
// that population size is worth designing a dedicated layout for.
function avatarOffsets(n: number, headR: number): { dx: number, dy: number }[] {
  const dist = headR - AVATAR_R
  switch (n) {
    case 2:
      return [{ dx: -dist, dy: 0 }, { dx: dist, dy: 0 }]
    case 3:
      return [
        { dx: 0, dy: -dist },
        { dx: -dist * 0.866, dy: dist * 0.5 },
        { dx: dist * 0.866, dy: dist * 0.5 },
      ]
    case 4: {
      const off = dist / Math.SQRT2
      return [
        { dx: -off, dy: -off },
        { dx: off, dy: -off },
        { dx: -off, dy: off },
        { dx: off, dy: off },
      ]
    }
    default:
      return [{ dx: 0, dy: 0 }]
  }
}

// Faded label under the current user's own pin tip — same per-theme muted
// tone as other canvas-rendered secondary text in the app (e.g. the online-
// trend chart's axis labels), since canvas can't resolve CSS custom
// properties the way regular DOM text can.
const MY_PIN_LABEL_COLOR = { light: '#6b7280', dark: '#9199a6' } as const

// Pin "drop" entrance: rendered via ECharts custom series' declarative
// enter animation (enterFrom + enterAnimation) rather than hand-rolled
// keyframes — it's the documented way to animate elements newly added to a
// custom series, and it only fires once per element's actual first
// appearance (later re-renders from theme toggles/resizes just update the
// already-mounted element, no replay). Gating series `data` on
// `pinsRevealed` (empty → full) is what makes every pin "newly added" the
// moment they're allowed to appear. The fall (position) animates on the
// group; the fade (opacity) is applied per child leaf element instead — see
// the renderItem comment below for why.
const PIN_DROP_OFFSET = PIN_R / 2
const PIN_DROP_DURATION = 550
// Per-pin stagger step, up to a total spread cap: below the cap every pin
// gets the full 50ms step; once there are enough pins that dataIndex * 50ms
// would blow past the cap, the step shrinks so the stagger still spans every
// pin evenly instead of the pins beyond index (cap/50) all landing on the
// same clamped delay and popping in together.
const PIN_DROP_STAGGER_MS = 50
const PIN_DROP_STAGGER_MAX = 600

const chartOption = computed(() => {
  if (!mapRegistered.value) return null
  const pts = points.value
  const seriesData = pinsRevealed.value ? pts : []
  const base = MAP_BASE[themeMode.value]
  const myCity = myCityCode.value
  const myLabelColor = MY_PIN_LABEL_COLOR[themeMode.value]
  const animatePins = motionOk.value

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: { dataIndex: number }) => {
        const item = seriesData[params.dataIndex]
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
      data: seriesData,
      renderItem: (params: { dataIndex: number }, api: { coord: (v: [number, number]) => number[] }) => {
        const item = seriesData[params.dataIndex]
        if (!item) return { type: 'group', children: [] }
        const [x, y] = api.coord([item.coord.lng, item.coord.lat])
        const count = item.entry.count
        const layoutN = Math.min(count, 4)
        const fillR = count <= 4 ? PIN_FILL_R * Math.cbrt(count) : PIN_FILL_R
        const headR = fillR + PIN_STROKE_WIDTH / 2
        const headY = pinHeadY(headR)
        const imgSize = AVATAR_R * 2

        // zrender sorts z2 globally across every shape in the scene, not
        // per group — so pins further south (larger pixel y) need their
        // *whole* stack of shapes to outrank a pin further north's whole
        // stack, not just tie at each shape's own local z2 (10-22 below).
        // Bucketing by rounded y and spacing buckets 100 apart gives each
        // pin's local z2 range room without colliding with its neighbors'.
        const zBase = Math.round(y) * 100

        const children: Record<string, unknown>[] = [
          {
            type: 'path',
            shape: { pathData: pinPathData(headR) },
            position: [x, y],
            style: { fill: '#28abce', stroke: '#fff', lineWidth: PIN_STROKE_WIDTH },
            z2: zBase + 10,
          },
        ]

        const shown = item.entry.users.slice(0, layoutN)
        const offsets = avatarOffsets(shown.length, headR)
        shown.forEach((u, i) => {
          const { dx, dy } = offsets[i]!
          const cy = headY + dy
          const layerIndex = shown.length - 1 - i
          const z2 = zBase + 11 + layerIndex * 3
          // Same fallback as UiAvatar: a colored circle + initials, drawn
          // underneath so it still shows if the avatar image never loads
          // (zrender's Image element has no built-in @error swap like the
          // DOM <img> UiAvatar itself uses).
          children.push({
            type: 'circle',
            position: [x, y],
            shape: { cx: dx, cy, r: AVATAR_R },
            style: { fill: colorForName(u.username) },
            z2,
          })
          children.push({
            type: 'text',
            position: [x, y],
            style: {
              text: initials(u.username),
              x: dx,
              y: cy,
              fill: '#fff',
              fontSize: 9,
              fontWeight: 'bold',
              align: 'center',
              verticalAlign: 'middle',
            },
            z2: z2 + 1,
          })
          if (u.avatar) {
            children.push({
              type: 'image',
              position: [x, y],
              style: { image: u.avatar, x: dx - imgSize / 2, y: cy - imgSize / 2, width: imgSize, height: imgSize },
              clipPath: { type: 'circle', shape: { cx: dx, cy, r: AVATAR_R } },
              z2: z2 + 2,
            })
          }
        })

        if (count > 4) {
          const badgeR = PIN_R * 0.65
          const bx = PIN_R * 0.75
          const by = headY - PIN_R * 0.75
          children.push({
            type: 'circle',
            position: [x, y],
            shape: { cx: bx, cy: by, r: badgeR },
            style: { fill: '#ef4444', stroke: '#fff', lineWidth: 1 },
            z2: zBase + 14,
          })
          children.push({
            type: 'text',
            position: [x, y],
            style: {
              text: count > 99 ? '99+' : String(count),
              x: bx,
              y: by,
              fill: '#fff',
              fontSize: 10,
              fontWeight: 'bold',
              align: 'center',
              verticalAlign: 'middle',
            },
            z2: zBase + 15,
          })
        }
        if (myCity && item.cityCode === myCity) {
          children.push({
            type: 'text',
            position: [x, y],
            style: {
              text: t('home.community_map_me'),
              x: 0,
              y: 4,
              fill: myLabelColor,
              fontSize: 10,
              align: 'center',
              verticalAlign: 'top',
            },
            z2: zBase + 20,
          })
        }
        if (animatePins) {
          const stepMs = seriesData.length > 1
            ? Math.min(PIN_DROP_STAGGER_MS, PIN_DROP_STAGGER_MAX / (seriesData.length - 1))
            : 0
          const enterAnimation = {
            duration: PIN_DROP_DURATION,
            delay: params.dataIndex * stepMs,
            easing: 'quarticOut' as const,
          }
          // ECharts' custom-series group container has no `style` of its own
          // (only Displayable leaf elements do), so an `enterFrom: { style:
          // { opacity: 0 } }` set on the *group* is silently a no-op — the
          // pin would render fully opaque the instant it's created and just
          // sit there for its stagger `delay` before the position tween
          // kicks in, reading as a hover-then-drop rather than a clean fall.
          // The fall (position) animates fine on the group since x/y are
          // real group transform props; the fade has to be applied to each
          // child leaf instead so it's actually invisible during the delay.
          children.forEach((child) => {
            child.enterFrom = { style: { opacity: 0 } }
            child.enterAnimation = enterAnimation
          })
          return {
            type: 'group',
            children,
            enterFrom: { position: [0, -PIN_DROP_OFFSET] },
            enterAnimation,
          }
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
