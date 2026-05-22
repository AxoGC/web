<template>
  <UiCard padded>
    <div class="flex items-center justify-between mb-4 gap-2">
      <h2 class="text-lg font-semibold">{{ $t('server.leaderboard') }}</h2>
      <NuxtLink :to="`/servers/${serverId}/leaderboard`">
        <UiButton variant="ghost" size="sm">
          {{ $t('actions.open') }}
          <template #trailing><LucideChevronRight :size="14" /></template>
        </UiButton>
      </NuxtLink>
    </div>
    <ul class="space-y-2">
      <li
        v-for="row in champions"
        :key="row.metric"
        class="flex items-center gap-3 text-sm"
      >
        <span class="flex-1 text-text-secondary truncate">{{ metrics.labelFor(row.metric) }}</span>
        <template v-if="row.name">
          <NuxtLink
            :to="`/servers/${serverId}/players/${encodeURIComponent(row.name)}`"
            class="font-medium truncate max-w-[8rem] hover:text-brand-400"
          >
            {{ row.name }}
          </NuxtLink>
          <span class="font-mono text-xs text-text-tertiary tabular-nums">
            {{ metrics.formatScore(row.metric, row.score) }}
          </span>
        </template>
        <span v-else class="text-text-tertiary text-xs">—</span>
      </li>
    </ul>
  </UiCard>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { MetricChampion } from '~/types/api'

const props = defineProps<{ serverId: string | number }>()
const metrics = useServerMetrics(toRef(props, 'serverId'))

const { data } = await useAsyncData(
  () => `server.champions.${props.serverId}`,
  () => useApi<{ items: MetricChampion[] }>(`/api/servers/${props.serverId}/leaderboard/champions`),
)
const champions = computed<MetricChampion[]>(() => data.value?.items ?? [])
</script>
