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
          <span class="font-mono text-text-secondary">{{ item.score.toLocaleString() }}</span>
        </li>
      </ul>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LeaderboardItem } from '~/types/api'

definePageMeta({ layout: 'detail' })
const route = useRoute()
const id = computed(() => String(route.params.id))
const metric = ref('play_time')

const metricOptions = [
  { value: 'play_time', label: 'play_time' },
  { value: 'mob_kills_total', label: 'mob_kills_total' },
  { value: 'pvp_kills', label: 'pvp_kills' },
  { value: 'deaths', label: 'deaths' },
  { value: 'blocks_broken_total', label: 'blocks_broken_total' },
  { value: 'distance_walked', label: 'distance_walked' },
]

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
