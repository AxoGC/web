<template>
  <div class="px-4 lg:px-6 py-6 pb-20 md:pb-12">
    <NuxtLink
      :to="`/servers/${id}`"
      class="md:hidden inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-4"
    >
      <LucideChevronLeft :size="16" />
      {{ $t('actions.back') }}
    </NuxtLink>

    <header class="mb-6">
      <h1 class="text-2xl">{{ $t('server.leaderboard') }}</h1>
    </header>

    <div class="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      <UiCard
        v-for="key in keys"
        :key="key"
        padded
      >
        <h2 class="text-sm text-text-secondary mb-3 uppercase tracking-wide">
          {{ labelFor(key) }}
        </h2>

        <UiSkeleton v-if="pending[key]" :height="320" />
        <UiEmpty
          v-else-if="!boards[key]?.length"
          :message="$t('empty.default')"
        />
        <ul v-else class="divide-y divide-border-subtle">
          <li
            v-for="item in boards[key]"
            :key="item.rank"
            class="flex items-center gap-3 py-2"
          >
            <span :class="['w-7 h-7 grid place-items-center rounded-full text-xs shrink-0', rankClass(item.rank)]">
              {{ item.rank }}
            </span>
            <UiAvatar :name="item.name" size="xs" />
            <NuxtLink
              :to="`/servers/${id}/players/${encodeURIComponent(item.name)}`"
              class="flex-1 font-medium hover:text-brand-400 truncate"
            >
              {{ item.name }}
            </NuxtLink>
            <span class="font-mono text-xs text-text-secondary tabular-nums">
              {{ formatScore(key, item.score) }}
            </span>
          </li>
        </ul>
      </UiCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { LeaderboardItem } from '~/types/api'

definePageMeta({ layout: 'detail' })
const route = useRoute()
const id = computed(() => String(route.params.id))

const { keys, labelFor, formatScore, ready } = useServerMetrics(id)

// Per-axis state. Reactive object keyed by metric key so each card loads
// independently — one slow / failing axis doesn't block the others.
const boards = reactive<Record<string, LeaderboardItem[]>>({})
const pending = reactive<Record<string, boolean>>({})

async function loadOne(metric: string) {
  pending[metric] = true
  try {
    const res = await useApi<{ metric: string, items: LeaderboardItem[] }>(
      `/api/servers/${id.value}/leaderboard?metric=${metric}&limit=6`,
    )
    boards[metric] = res.items || []
  } catch {
    boards[metric] = []
  } finally {
    pending[metric] = false
  }
}

async function loadAll() {
  // Wait for metric defs (used for axis labels + the grid keys), then prime
  // every leaderboard card in parallel.
  await ready.value
  await Promise.all(keys.value.map(k => loadOne(k)))
}

await useAsyncData(() => `srv.lb.all.${id.value}`, async () => {
  await loadAll()
  return true
}, { watch: [id] })

watch(id, () => { void loadAll() })

function rankClass(rank: number) {
  if (rank === 1) return 'bg-yellow-500/15 text-yellow-400'
  if (rank === 2) return 'bg-gray-400/15 text-gray-300'
  if (rank === 3) return 'bg-amber-600/15 text-amber-400'
  return 'bg-bg-overlay text-text-tertiary'
}
</script>
