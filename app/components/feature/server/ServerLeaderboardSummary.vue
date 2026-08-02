<template>
  <UiCard padded>
    <div class="flex items-center justify-between mb-4 gap-2">
      <h2 class="text-lg">{{ $t('server.leaderboard') }}</h2>
      <NuxtLink :to="`/servers/${serverId}/leaderboard`">
        <UiButton variant="ghost" size="sm">
          {{ $t('actions.open') }}
          <template #trailing><LucideChevronRight :size="14" /></template>
        </UiButton>
      </NuxtLink>
    </div>
    <div class="grid grid-cols-2 gap-2">
      <div
        v-for="row in champions"
        :key="row.metric"
        class="bg-bg-overlay/40 rounded px-2.5 py-1.5"
      >
        <p class="text-[10px] text-text-tertiary uppercase tracking-wide truncate">
          {{ metrics.labelFor(row.metric) }}
        </p>
        <template v-if="row.name">
          <button
            type="button"
            class="block w-full text-sm font-medium truncate text-left hover:text-brand-400"
            @click="goToPlayer(serverId, row.name)"
          >
            {{ row.name }}
          </button>
          <p class="text-xs font-mono text-text-tertiary tabular-nums truncate">
            {{ metrics.formatScore(row.metric, row.score) }}
          </p>
        </template>
        <p v-else class="text-sm text-text-tertiary">—</p>
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { MetricChampion } from '~/types/api'

const props = defineProps<{ serverId: string | number }>()
const metrics = useServerMetrics(toRef(props, 'serverId'))
const goToPlayer = usePlayerNavigate()

const { data } = await useAsyncData(
  () => `server.champions.${props.serverId}`,
  () => useApi<{ items: MetricChampion[] }>(`/api/servers/${props.serverId}/leaderboard/champions`),
)
const champions = computed<MetricChampion[]>(() => data.value?.items ?? [])
</script>
