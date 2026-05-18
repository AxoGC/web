<template>
  <div>
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
            class="font-semibold hover:text-brand-400 inline-flex items-center gap-1"
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
      <h1 class="text-2xl font-bold">{{ name }}</h1>
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
            <p class="font-semibold text-text-primary">{{ metrics.formatScore(axis.key, axis.value) }}</p>
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

definePageMeta({ layout: 'detail' })
const route = useRoute()
const { t } = useI18n()
const id = computed(() => String(route.params.id))
const name = computed(() => decodeURIComponent(String(route.params.name)))

const metrics = useGameMetrics()
const typeLabel = useServerTypeLabel()

const { data: server } = await useAsyncData(
  () => `server.head.${id.value}`,
  () => useApi<ServerSummary>(`/api/servers/${id.value}`).catch(() => null),
)

const serverIconBroken = ref(false)
const serverIconSrc = computed(() => server.value?.icon || gameTypeIcon(server.value?.type))
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
  () => useApi<PlayerStats>(`/api/servers/${id.value}/players/${encodeURIComponent(name.value)}/stats`),
)

// Reverse-lookup the bound platform user, then fetch their public profile so we
// can render the "linked user" chip. Both calls tolerate 404 silently — an
// unbound player just hides the chip.
const { data: boundUser } = await useAsyncData(
  () => `srv.player.${id.value}.${name.value}.user`,
  async () => {
    const link = await useApi<{ user_id: number }>(
      `/api/servers/${id.value}/players/${encodeURIComponent(name.value)}/binding`,
    ).catch(() => null)
    if (!link?.user_id) return null
    return useApi<PublicUser>(`/api/users/${link.user_id}`).catch(() => null)
  },
)

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
      axisName: { color: 'var(--text-secondary)', fontSize: 12 },
      splitLine: { lineStyle: { color: 'var(--border-default)' } },
      axisLine: { lineStyle: { color: 'var(--border-default)' } },
      splitArea: { areaStyle: { color: ['rgba(40,171,206,0.04)', 'rgba(40,171,206,0.08)'] } },
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
      data: [{
        value: list.map(a => clamp(a.percent)),
        name: name.value,
        areaStyle: { color: 'rgba(40,171,206,0.25)' },
        lineStyle: { color: '#28abce', width: 2 },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#28abce' },
      }],
    }],
  }
})

useHead(() => ({ title: name.value }))
</script>
