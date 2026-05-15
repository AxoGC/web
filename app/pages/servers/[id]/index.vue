<template>
  <div>
    <div v-if="!server && error">
      <UiEmpty :message="$t('errors.SERVER_NOT_FOUND')" />
    </div>
    <template v-else>
      <header class="flex flex-wrap items-start gap-4 mb-6">
        <div class="w-16 h-16 rounded-lg bg-bg-overlay overflow-hidden grid place-items-center shrink-0">
          <img v-if="server?.icon" :src="server.icon" :alt="server.name" class="w-full h-full object-cover">
          <LucideServer v-else :size="28" class="text-text-tertiary" />
        </div>
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold flex flex-wrap items-center gap-2">
            <span>{{ server?.name || '…' }}</span>
            <UiTag v-if="server" variant="info">{{ server.type }}</UiTag>
          </h1>
          <p v-if="server?.description" class="text-text-secondary mt-1">{{ server.description }}</p>
          <div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <UiStatusDot v-if="server" :status="server.status">
              <span class="font-medium">{{ statusLabel }}</span>
            </UiStatusDot>
            <span v-if="server?.status === 'online'" class="text-text-secondary">
              {{ server.online }}/{{ server.max }}
            </span>
            <span class="font-mono text-xs text-text-tertiary">{{ server?.host }}:{{ server?.port }}</span>
            <button
              v-if="server?.host"
              class="text-xs text-brand-400 hover:underline inline-flex items-center gap-1"
              @click="copyHost"
            >
              <LucideCopy :size="12" /> {{ $t('actions.copy') }}
            </button>
          </div>
        </div>
        <div v-if="auth.isLoggedIn" class="shrink-0">
          <NuxtLink :to="`/me/bindings?server=${id}`">
            <UiButton variant="secondary" size="sm">
              <template #leading><LucideLink :size="14" /></template>
              {{ $t('server.bind_title') }}
            </UiButton>
          </NuxtLink>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <UiCard padded class="lg:col-span-2">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">{{ $t('server.online_trend') }}</h2>
            <div class="flex items-center gap-1">
              <button
                v-for="r in (['24h','7d','30d'] as const)"
                :key="r"
                :class="[
                  'px-2 h-7 rounded text-xs font-medium',
                  range === r ? 'bg-brand-soft text-brand-400' : 'text-text-secondary hover:bg-bg-hover',
                ]"
                @click="range = r"
              >
                {{ r }}
              </button>
            </div>
          </div>
          <ClientOnly>
            <VChart v-if="chartOption" class="w-full h-64" :option="chartOption" autoresize />
          </ClientOnly>
        </UiCard>

        <UiCard padded>
          <h2 class="text-lg font-semibold mb-4">{{ $t('server.leaderboard') }}</h2>
          <NuxtLink :to="`/servers/${id}/leaderboard`">
            <UiButton variant="secondary" block>
              {{ $t('actions.open') }}
            </UiButton>
          </NuxtLink>
        </UiCard>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ServerDetail, OnlineStatPoint } from '~/types/api'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'detail' })

const route = useRoute()
const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const id = computed(() => String(route.params.id))
const range = ref<'24h' | '7d' | '30d'>('24h')

const { data: server, error, refresh: refreshServer } = await useAsyncData(
  () => `server.${id.value}`,
  () => useApi<ServerDetail>(`/api/servers/${id.value}`),
)

useHead(() => ({ title: server.value?.name || 'Server' }))

const { data: stats, refresh: refreshStats } = await useAsyncData(
  () => `server.stats.${id.value}.${range.value}`,
  () => useApi<{ points: OnlineStatPoint[] }>(`/api/servers/${id.value}/stats?range=${range.value}`),
  { watch: [id, range] },
)

const statusLabel = computed(() => server.value
  ? ({
      online: t('common.online'),
      offline: t('common.offline'),
      maintenance: t('common.maintenance'),
    }[server.value.status] || server.value.status)
  : '',
)

const chartOption = computed(() => {
  const pts = stats.value?.points || []
  return {
    backgroundColor: 'transparent',
    grid: { left: 36, right: 12, top: 16, bottom: 32 },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: 'var(--border-default)' } },
      axisLabel: { color: 'var(--text-tertiary)', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'var(--border-subtle)' } },
      axisLabel: { color: 'var(--text-tertiary)', fontSize: 11 },
    },
    tooltip: { trigger: 'axis', backgroundColor: 'var(--bg-overlay)', borderColor: 'var(--border-default)', textStyle: { color: 'var(--text-primary)' } },
    series: [{
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: pts.map((p) => [p.recorded_at * 1000, p.online]),
      lineStyle: { color: '#28abce', width: 2 },
      areaStyle: { color: 'rgba(40,171,206,0.15)' },
    }],
  }
})

async function copyHost() {
  if (!server.value) return
  const text = `${server.value.host}:${server.value.port}`
  try {
    await navigator.clipboard.writeText(text)
    toast.success(t('actions.copied'))
  } catch {
    // ignore
  }
}

watch(range, () => void refreshStats())
if (import.meta.client) {
  usePolling(async () => {
    await refreshServer()
  }, { interval: 30_000, immediate: false })
}
</script>
