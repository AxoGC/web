<template>
  <UiCard padded>
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
      <!-- echarts measures the container at init via offsetHeight; an explicit
           height keeps it from collapsing to a few px while ClientOnly hydrates. -->
      <VChart
        v-if="chartOption"
        :option="chartOption"
        autoresize
        style="width: 100%; height: 240px;"
      />
    </ClientOnly>
  </UiCard>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { OnlineStatPoint } from '~/types/api'

const props = defineProps<{ serverId: string | number }>()
const range = ref<'24h' | '7d' | '30d'>('24h')

const { data: stats, refresh } = await useAsyncData(
  () => `server.stats.${props.serverId}.${range.value}`,
  () => useApi<{ points: OnlineStatPoint[] }>(`/api/servers/${props.serverId}/stats?range=${range.value}`),
  { watch: [() => props.serverId, range] },
)

watch(range, () => void refresh())

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
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--bg-overlay)',
      borderColor: 'var(--border-default)',
      textStyle: { color: 'var(--text-primary)' },
    },
    series: [{
      type: 'line',
      smooth: true,
      showSymbol: false,
      data: pts.map(p => [p.recorded_at * 1000, p.online]),
      lineStyle: { color: '#28abce', width: 2 },
      areaStyle: { color: 'rgba(40,171,206,0.15)' },
    }],
  }
})
</script>
