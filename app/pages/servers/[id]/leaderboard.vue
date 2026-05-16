<template>
  <div>
    <header class="flex items-center justify-between gap-4 mb-6">
      <h1 class="text-2xl font-bold">{{ $t('server.leaderboard') }}</h1>
      <div class="w-48">
        <UiSelect v-model="metric" :options="metricOptions" />
      </div>
    </header>

    <div v-if="pending" class="space-y-2">
      <UiSkeleton v-for="i in 8" :key="i" :height="44" />
    </div>
    <div v-else-if="!data?.items?.length">
      <UiEmpty :message="$t('empty.default')" />
    </div>
    <UiCard v-else>
      <ul>
        <li
          v-for="item in data.items"
          :key="item.rank"
          class="flex items-center gap-4 px-5 py-3 border-b border-border-subtle last:border-b-0"
        >
          <span :class="['w-8 h-8 grid place-items-center rounded-full font-bold text-sm', rankClass(item.rank)]">
            {{ item.rank }}
          </span>
          <UiAvatar :name="item.name" size="sm" />
          <NuxtLink :to="`/servers/${id}/players/${encodeURIComponent(item.name)}`" class="flex-1 font-medium hover:text-brand-400 truncate">
            {{ item.name }}
          </NuxtLink>
          <span class="font-mono text-text-secondary">{{ formatScore(metric, item.score) }}</span>
        </li>
      </ul>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { LeaderboardItem, ServerSummary } from '~/types/api'

definePageMeta({ layout: 'detail' })
const route = useRoute()
const id = computed(() => String(route.params.id))

// Need the server type to pick the right metric registry.
const { data: server } = await useAsyncData(
  () => `server.head.${id.value}`,
  () => useApi<ServerSummary>(`/api/servers/${id.value}`),
)
const { options: metricOptions, formatScore } = useGameMetrics(() => server.value?.type)
const metric = ref<string>('')

watch(metricOptions, opts => {
  if (!metric.value && opts.length) metric.value = opts[0]!.value
}, { immediate: true })

const { data, pending } = await useAsyncData(
  () => `srv.lb.${id.value}.${metric.value}`,
  () => useApi<{ metric: string, items: LeaderboardItem[] }>(`/api/servers/${id.value}/leaderboard?metric=${metric.value}&limit=50`),
  { watch: [id, metric] },
)

function rankClass(rank: number) {
  if (rank === 1) return 'bg-yellow-500/15 text-yellow-400'
  if (rank === 2) return 'bg-gray-400/15 text-gray-300'
  if (rank === 3) return 'bg-amber-600/15 text-amber-400'
  return 'bg-bg-overlay text-text-tertiary'
}
</script>
