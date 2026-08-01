<template>
  <div class="px-4 lg:px-6 py-6 pb-20 md:pb-12">
    <button
      type="button"
      class="md:hidden inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-4"
      @click="goBack"
    >
      <LucideChevronLeft :size="16" />
      {{ $t('actions.back') }}
    </button>

    <header class="mb-6">
      <h1 class="text-2xl">{{ $t('pk.title') }}</h1>
      <p v-if="server" class="mt-1 text-sm text-text-tertiary flex flex-wrap items-center gap-2">
        <span>{{ $t('pk.on_server') }}</span>
        <NuxtLink
          :to="`/servers/${server.id}`"
          class="font-medium text-text-secondary hover:text-brand-400 inline-flex items-center gap-1"
        >
          <span>{{ server.name }}</span>
          <LucideExternalLink :size="12" />
        </NuxtLink>
        <UiTag size="sm">{{ typeLabel(server.type) }}</UiTag>
      </p>
    </header>

    <div v-if="!hasQuery">
      <UiEmpty :message="$t('pk.pick_both')" />
    </div>

    <UiSkeleton v-else-if="loading" :height="400" />

    <template v-else-if="loaded">
      <!-- Versus header: two columns + center badge / W-L labels -->
      <UiCard padded class="mb-4">
        <div class="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <!-- Left side: viewer -->
          <div class="flex flex-col items-center text-center">
            <UiAvatar :src="aUser?.avatar" :name="aUser?.username || aName" size="xl" clickable />
            <NuxtLink
              v-if="aUser"
              :to="`/users/${aUser.id}`"
              class="mt-2 hover:text-brand-400 truncate max-w-full"
            >
              {{ aUser.username }}
            </NuxtLink>
            <NuxtLink
              :to="`/servers/${serverId}/players/${encodeURIComponent(aName)}`"
              class="text-xs text-text-tertiary hover:text-brand-400 truncate max-w-full"
            >
              {{ aName }}
            </NuxtLink>
          </div>

          <!-- Center: VS badge + W/L/Draw -->
          <div class="flex flex-col items-center gap-3 px-2 sm:px-6">
            <span class="text-3xl sm:text-5xl tracking-widest text-brand-400 leading-none">
              VS
            </span>
            <div class="flex items-center gap-3">
              <span :class="['px-2.5 py-1 rounded text-xs uppercase', labelClass(aResult)]">
                {{ $t(`pk.result.${aResult}`) }}
              </span>
              <span class="text-text-tertiary text-xs">{{ aWins }}–{{ bWins }}</span>
              <span :class="['px-2.5 py-1 rounded text-xs uppercase', labelClass(bResult)]">
                {{ $t(`pk.result.${bResult}`) }}
              </span>
            </div>
          </div>

          <!-- Right side: target -->
          <div class="flex flex-col items-center text-center">
            <UiAvatar :src="bUser?.avatar" :name="bUser?.username || bName" size="xl" clickable />
            <NuxtLink
              v-if="bUser"
              :to="`/users/${bUser.id}`"
              class="mt-2 hover:text-brand-400 truncate max-w-full"
            >
              {{ bUser.username }}
            </NuxtLink>
            <NuxtLink
              :to="`/servers/${serverId}/players/${encodeURIComponent(bName)}`"
              class="text-xs text-text-tertiary hover:text-brand-400 truncate max-w-full"
            >
              {{ bName }}
            </NuxtLink>
          </div>
        </div>
      </UiCard>

      <!-- Per-axis comparison: one row per metric, left/right values flanking the label,
           with confronting progress bars beneath (left grows rightward, right grows leftward). -->
      <UiCard padded class="mb-4">
        <ul class="divide-y divide-border-subtle">
          <li
            v-for="row in rows"
            :key="row.key"
            class="py-2.5"
          >
            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div
                :class="[
                  'text-right font-mono tabular-nums',
                  row.winner === 'a' ? 'text-brand-400' : 'text-text-secondary',
                ]"
              >
                {{ metrics.formatScore(row.key, row.aValue) }}
              </div>
              <div class="text-xs text-text-tertiary uppercase tracking-wide text-center min-w-[6rem]">
                {{ metrics.labelFor(row.key) }}
              </div>
              <div
                :class="[
                  'text-left font-mono tabular-nums',
                  row.winner === 'b' ? 'text-amber-400' : 'text-text-secondary',
                ]"
              >
                {{ metrics.formatScore(row.key, row.bValue) }}
              </div>
            </div>
            <div class="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <!-- Left bar: anchored at left edge, grows rightward -->
              <div class="h-1.5 rounded-full bg-bg-overlay overflow-hidden">
                <div class="h-full bg-brand-400 transition-all" :style="{ width: barWidth(row.aPercent) }" />
              </div>
              <div class="text-[10px] text-text-tertiary font-mono tabular-nums min-w-[6rem] text-center">
                {{ row.aPercent.toFixed(0) }}% · {{ row.bPercent.toFixed(0) }}%
              </div>
              <!-- Right bar: anchored at right edge, grows leftward (flex justify-end) -->
              <div class="h-1.5 rounded-full bg-bg-overlay overflow-hidden flex justify-end">
                <div class="h-full bg-amber-400 transition-all" :style="{ width: barWidth(row.bPercent) }" />
              </div>
            </div>
          </li>
        </ul>
      </UiCard>

      <!-- Overlapping radar -->
      <UiCard padded>
        <ClientOnly>
          <VChart
            v-if="chartOption"
            class="w-full"
            style="height: 380px;"
            :option="chartOption"
            autoresize
          />
        </ClientOnly>
      </UiCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PlayerStats, PublicUser, ServerSummary, StatsAxis } from '~/types/api'

definePageMeta({ layout: 'detail' })
useHead({ title: 'VS' })

const goBack = useGoBack()
const route = useRoute()

const serverId = computed(() => String(route.query.server_id || ''))
const aUid = computed(() => String(route.query.a_uid || ''))
const bUid = computed(() => String(route.query.b_uid || ''))
const aName = computed(() => String(route.query.a || ''))
const bName = computed(() => String(route.query.b || ''))

const hasQuery = computed(() =>
  !!(serverId.value && aUid.value && bUid.value && aName.value && bName.value),
)

const aUser = ref<PublicUser | null>(null)
const bUser = ref<PublicUser | null>(null)
const server = ref<ServerSummary | null>(null)
const aStats = ref<StatsAxis[]>([])
const bStats = ref<StatsAxis[]>([])
const loaded = ref(false)
const loading = ref(false)

const metrics = useServerMetrics(serverId)
const typeLabel = useServerTypeLabel()

async function load() {
  if (!hasQuery.value) return
  loading.value = true
  try {
    // Metric defs drive axis labels and value formatting; wait for them so
    // the SSR render is fully populated.
    await metrics.ready.value
    const [u1, u2, srv, s1, s2] = await Promise.all([
      useApi<PublicUser>(`/api/users/${aUid.value}`).catch(() => null),
      useApi<PublicUser>(`/api/users/${bUid.value}`).catch(() => null),
      useApi<ServerSummary>(`/api/servers/${serverId.value}`).catch(() => null),
      useApi<PlayerStats>(`/api/servers/${serverId.value}/players/${encodeURIComponent(aName.value)}/stats`)
        .catch(() => ({ name: aName.value, stats: [] as StatsAxis[] }) as PlayerStats),
      useApi<PlayerStats>(`/api/servers/${serverId.value}/players/${encodeURIComponent(bName.value)}/stats`)
        .catch(() => ({ name: bName.value, stats: [] as StatsAxis[] }) as PlayerStats),
    ])
    aUser.value = u1
    bUser.value = u2
    server.value = srv
    aStats.value = s1.stats ?? []
    bStats.value = s2.stats ?? []
    loaded.value = true
  } finally {
    loading.value = false
  }
}

await useAsyncData(`pk.${serverId.value}.${aUid.value}.${bUid.value}`, async () => {
  await load()
  return true
})

// Axis-by-axis comparison, aligned by key (defensive against ordering drift).
const rows = computed(() => {
  const bByKey: Record<string, StatsAxis> = {}
  for (const x of bStats.value) bByKey[x.key] = x
  return aStats.value.map(a => {
    const b = bByKey[a.key]
    const aV = a.value || 0
    const bV = b?.value || 0
    let winner: 'a' | 'b' | 'tie' = 'tie'
    if (aV > bV) winner = 'a'
    else if (bV > aV) winner = 'b'
    return { key: a.key, aValue: aV, bValue: bV, aPercent: a.percent || 0, bPercent: b?.percent || 0, winner }
  })
})

const aWins = computed(() => rows.value.filter(r => r.winner === 'a').length)
const bWins = computed(() => rows.value.filter(r => r.winner === 'b').length)

// 4-6 → win, 0-2 → loss, 3-3 → draw. Computed for each side so labels are
// independent (avoids "A=win, B=loss" coupling letting one side look ambiguous).
type Outcome = 'win' | 'loss' | 'draw'
function outcomeFor(myWins: number, theirWins: number): Outcome {
  if (myWins === theirWins) return 'draw'
  return myWins > theirWins ? 'win' : 'loss'
}
const aResult = computed<Outcome>(() => outcomeFor(aWins.value, bWins.value))
const bResult = computed<Outcome>(() => outcomeFor(bWins.value, aWins.value))

function barWidth(percent: number): string {
  const v = Math.max(0, Math.min(100, percent || 0))
  return `${v}%`
}

function labelClass(r: Outcome) {
  if (r === 'win') return 'bg-success/15 text-success'
  if (r === 'loss') return 'bg-danger/15 text-danger'
  return 'bg-bg-overlay text-text-secondary'
}

const chartOption = computed(() => {
  const list = aStats.value
  if (!list.length) return null
  const bByKey: Record<string, StatsAxis> = {}
  for (const x of bStats.value) bByKey[x.key] = x

  // indicator.max fixed at 100 so the plotted radius exactly matches the
  // displayed percent; values > 100 (above-baseline players) are clamped on
  // the chart but the raw value still appears in the comparison rows above.
  const clamp = (v: number) => Math.min(100, Math.max(0, v || 0))

  return {
    backgroundColor: 'transparent',
    radar: {
      indicator: list.map(x => ({ name: metrics.labelFor(x.key), max: 100 })),
      shape: 'polygon',
      axisName: { color: 'var(--text-secondary)' },
      splitLine: { lineStyle: { color: 'var(--border-default)' } },
      axisLine: { lineStyle: { color: 'var(--border-default)' } },
      splitArea: { areaStyle: { color: ['rgba(40,171,206,0.04)', 'rgba(40,171,206,0.08)'] } },
    },
    legend: { textStyle: { color: 'var(--text-secondary)' }, top: 0 },
    tooltip: {
      backgroundColor: 'var(--bg-overlay)',
      borderColor: 'var(--border-default)',
      textStyle: { color: 'var(--text-primary)' },
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: list.map(x => clamp(x.percent)),
          name: aUser.value?.username || aName.value,
          areaStyle: { color: 'rgba(40,171,206,0.25)' },
          lineStyle: { color: '#28abce', width: 2 },
          itemStyle: { color: '#28abce' },
        },
        {
          value: list.map(x => clamp(bByKey[x.key]?.percent ?? 0)),
          name: bUser.value?.username || bName.value,
          areaStyle: { color: 'rgba(245,158,11,0.25)' },
          lineStyle: { color: '#f59e0b', width: 2 },
          itemStyle: { color: '#f59e0b' },
        },
      ],
    }],
  }
})
</script>
