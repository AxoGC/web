<template>
  <div class="px-4 lg:px-6 py-6 pb-20 md:pb-12">
    <UiCard v-if="server" padded class="mb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 p-1 rounded-md bg-bg-overlay overflow-hidden grid place-items-center shrink-0">
          <img
            v-if="serverIconSrc && !serverIconBroken"
            :src="serverIconSrc"
            :alt="server.name"
            class="w-full h-full object-cover"
            @error="serverIconBroken = true"
          >
          <LucideServer v-else :size="18" class="text-text-tertiary" />
        </div>
        <div class="flex-1 min-w-0">
          <NuxtLink
            :to="`/servers/${id}`"
            class="hover:text-brand-400 inline-flex items-center gap-1"
          >
            <span>{{ server.name }}</span>
            <LucideExternalLink :size="14" class="text-text-tertiary" />
          </NuxtLink>
          <div class="mt-0.5 flex items-center gap-2 text-xs text-text-tertiary">
            <UiTag size="sm">{{ typeLabel(server.type) }}</UiTag>
            <UiStatusDot :status="server.status">
              <span>{{ statusLabel }}</span>
            </UiStatusDot>
            <span v-if="server.status === 'online'">{{ server.online }}/{{ server.max }}</span>
          </div>
        </div>
      </div>
    </UiCard>

    <header class="flex items-center gap-3 mb-6 flex-wrap">
      <UiAvatar :name="name" size="md" />
      <h1 class="text-2xl">{{ name }}</h1>
      <span
        v-if="binding"
        :class="[
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
          binding.is_online ? 'bg-emerald-500/10 text-emerald-400' : 'bg-bg-overlay text-text-tertiary',
        ]"
      >
        <span
          :class="[
            'inline-block w-1.5 h-1.5 rounded-full',
            binding.is_online ? 'bg-emerald-400' : 'bg-text-tertiary',
          ]"
        />
        {{ presenceText }}
      </span>
      <NuxtLink
        v-if="boundUser"
        :to="`/users/${boundUser.id}`"
        class="ml-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-bg-overlay/60 hover:bg-bg-hover transition-colors"
      >
        <UiAvatar :src="boundUser.avatar" :name="boundUser.username" size="xs" />
        <span class="text-sm font-medium">{{ boundUser.username }}</span>
        <LucideExternalLink :size="12" class="text-text-tertiary" />
      </NuxtLink>
    </header>

    <div v-if="error">
      <UiEmpty :message="$t(`errors.${errorCode}`)" />
    </div>
    <UiSkeleton v-else-if="!data" :height="320" />
    <!-- Desktop: radar left, stat grid right. Mobile: stacked (radar on top).
         lg breakpoint matches the rest of the site for "tablet+" treatment. -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <UiCard padded>
        <ClientOnly>
          <VChart
            v-if="chartOption"
            :option="chartOption"
            autoresize
            style="width: 100%; height: 360px;"
          />
          <UiEmpty v-else :message="$t('metric.no_data')" />
        </ClientOnly>
      </UiCard>

      <UiCard padded>
        <div class="grid grid-cols-2 gap-3">
          <div
            v-for="axis in axes"
            :key="axis.key"
            class="bg-bg-overlay/40 rounded-md px-3 py-2"
          >
            <p class="text-xs text-text-tertiary uppercase tracking-wide">
              {{ metrics.labelFor(axis.key) }}
            </p>
            <p class="text-text-primary">{{ metrics.formatScore(axis.key, axis.value) }}</p>
          </div>
        </div>
      </UiCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PlayerStats, PublicUser, ServerSummary, StatsAxis } from '~/types/api'
import { gameTypeIcon } from '~/composables/useGameTypeIcon'
import { primaryServerType } from '~/composables/useServerTypes'

definePageMeta({ layout: 'detail' })
const route = useRoute()
const { t } = useI18n()
const id = computed(() => String(route.params.id))
const name = computed(() => decodeURIComponent(String(route.params.name)))

const metrics = useServerMetrics(id)
const typeLabel = useServerTypeLabel()

const { data: server } = await useAsyncData(
  () => `server.head.${id.value}`,
  () => useApi<ServerSummary>(`/api/servers/${id.value}`).catch(() => null),
)

const serverIconBroken = ref(false)
const serverIconSrc = computed(() => server.value?.icon || gameTypeIcon(primaryServerType(server.value?.type)))
watch(serverIconSrc, () => { serverIconBroken.value = false })

const statusLabel = computed(() => {
  const s = server.value?.status
  return s ? ({
    online: t('common.online'),
    offline: t('common.offline'),
    maintenance: t('common.maintenance'),
  }[s] || s) : ''
})

const { data, error } = await useAsyncData(
  () => `srv.player.${id.value}.${name.value}`,
  async () => {
    // Wait for axis defs so SSR markup has labels in place when the radar /
    // stat grid render.
    await metrics.ready.value
    return useApi<PlayerStats>(`/api/servers/${id.value}/players/${encodeURIComponent(name.value)}/stats`)
  },
)

// Reverse-lookup the bound platform user + presence info. Both calls
// tolerate 404 silently — an unbound player just hides the chip and shows
// no presence badge.
interface BindingResp {
  user_id: number
  is_online: boolean
  joined_at: number
  last_seen_at: number
}
const { data: binding } = await useAsyncData(
  () => `srv.player.${id.value}.${name.value}.binding`,
  () => useApi<BindingResp>(
    `/api/servers/${id.value}/players/${encodeURIComponent(name.value)}/binding`,
  ).catch(() => null),
)
const { data: boundUser } = await useAsyncData(
  () => `srv.player.${id.value}.${name.value}.user`,
  async () => {
    const uid = binding.value?.user_id
    if (!uid) return null
    return useApi<PublicUser>(`/api/users/${uid}`).catch(() => null)
  },
  { watch: [binding] },
)
const presence = usePresence()
const presenceText = computed(() => {
  const b = binding.value
  if (!b) return ''
  return presence({ isOnline: b.is_online, joinedAt: b.joined_at, lastSeenAt: b.last_seen_at })
})

const errorCode = computed(() => {
  const e = error.value as unknown as { code?: string } | null
  return e?.code || 'UNKNOWN'
})

const axes = computed<StatsAxis[]>(() => data.value?.stats ?? [])

const chartOption = computed(() => {
  const list = axes.value
  if (!list.length || !list.some(a => a.value > 0)) return null
  // indicator.max fixed at 100 so the plotted radius == displayed percent.
  // Above-baseline players (percent > 100) are clamped on the chart; the raw
  // value remains in the stat grid below.
  const clamp = (v: number) => Math.min(100, Math.max(0, v || 0))
  return {
    backgroundColor: 'transparent',
    radar: {
      indicator: list.map(a => ({ name: metrics.labelFor(a.key), max: 100 })),
      shape: 'polygon',
      splitNumber: 4,
      // Shrink the web so axis labels have room inside the 360px box.
      center: ['50%', '54%'],
      radius: '62%',
      // Keep labels clear of the outer ring.
      axisName: {
        color: '#4dc0df',
        fontSize: 12,
        fontWeight: 600,
      },
      // Faint brand-tinted grid so the web reads as part of the chart,
      // brightening slightly toward the outer rings.
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
    tooltip: {
      backgroundColor: 'var(--bg-overlay)',
      borderColor: 'var(--border-default)',
      textStyle: { color: 'var(--text-primary)' },
      formatter: () => list.map(a =>
        `<div style="display:flex;justify-content:space-between;gap:12px;">
           <span>${metrics.labelFor(a.key)}</span>
           <span style="font-family:monospace;">${metrics.formatScore(a.key, a.value)}</span>
         </div>`,
      ).join(''),
    },
    series: [{
      type: 'radar',
      symbol: 'circle',
      symbolSize: 5,
      data: [{
        value: list.map(a => clamp(a.percent)),
        name: name.value,
        // Radial gradient: brighter core fading out toward the rim gives the
        // plot presence even when scores are low.
        areaStyle: {
          color: {
            type: 'radial',
            x: 0.5, y: 0.5, r: 0.5,
            colorStops: [
              { offset: 0, color: 'rgba(77,192,223,0.45)' },
              { offset: 1, color: 'rgba(40,171,206,0.12)' },
            ],
          },
        },
        lineStyle: {
          color: '#4dc0df',
          width: 2.5,
        },
        itemStyle: {
          color: '#4dc0df',
        },
      }],
    }],
  }
})

useHead(() => ({ title: name.value }))
</script>
