<template>
  <UiCard padded>
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg">{{ $t('server.online_trend') }}</h2>
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
import { useTheme } from '~/composables/useTheme'

const props = defineProps<{ serverId: string | number }>()
const range = ref<'24h' | '7d' | '30d'>('24h')
const { t, locale } = useI18n()

const MAX_TOOLTIP_PLAYERS = 10

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => HTML_ESCAPES[c]!)
}

const { data: stats, refresh } = await useAsyncData(
  () => `server.stats.${props.serverId}.${range.value}`,
  () => useApi<{ points: OnlineStatPoint[] }>(`/api/servers/${props.serverId}/stats?range=${range.value}`),
  { watch: [() => props.serverId, range] },
)

watch(range, () => void refresh())

// Canvas can't resolve CSS custom properties (var(--foo) silently falls back
// to black on an invalid color), so echarts needs literal colors here —
// picked per theme instead of copy-pasting design tokens.
const { resolved: themeMode } = useTheme()
const CHART_COLORS = {
  dark: { axisLine: '#2f343f', splitLine: '#232730', label: '#9199a6', tooltipBg: '#232730', tooltipBorder: '#2f343f', tooltipText: '#e8eaed' },
  light: { axisLine: '#e1e4e9', splitLine: '#eef0f3', label: '#6b7280', tooltipBg: '#f1f3f5', tooltipBorder: '#e1e4e9', tooltipText: '#1a1d23' },
} as const

const chartOption = computed(() => {
  const pts = stats.value?.points || []
  const c = CHART_COLORS[themeMode.value]
  return {
    backgroundColor: 'transparent',
    grid: { left: 36, right: 12, top: 16, bottom: 32 },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: c.axisLine } },
      axisLabel: { color: c.label, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: c.splitLine } },
      axisLabel: { color: c.label, fontSize: 11 },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: c.tooltipBg,
      borderColor: c.tooltipBorder,
      textStyle: { color: c.tooltipText },
      // echarts' tooltip DOM defaults to white-space:nowrap, which would
      // clip the wrapped player-name block instead of letting it wrap —
      // override it here since it can't be set from the formatter's own HTML.
      extraCssText: 'white-space: normal;',
      // Custom formatter so hovering a point shows who was online at that
      // sample, not just the count — styled to match UiTooltip (text-xs,
      // same color tokens as the rest of the chart).
      formatter: (params: unknown) => {
        const p = (params as { dataIndex: number, axisValue: number }[])[0]
        if (!p) return ''
        const point = pts[p.dataIndex]
        if (!point) return ''
        const time = new Date(p.axisValue).toLocaleString(locale.value)
        const players = point.players || []
        const shown = players.slice(0, MAX_TOOLTIP_PLAYERS)
        const more = players.length - shown.length
        // Comma-joined and wrapped instead of one row per player — keeps the
        // tooltip short even at 10 names. Long names hyphen-break rather than
        // pushing the box wide.
        let names = shown.length
          ? shown.map(escapeHtml).join(', ')
          : `<span style="color:${c.label}">${escapeHtml(t('server.no_online_players'))}</span>`
        if (more > 0) {
          names += `<span style="color:${c.label}"> ${escapeHtml(t('server.online_trend_tooltip_more', { n: more }))}</span>`
        }
        return `
          <div class="text-xs" style="width:200px">
            <div style="color:${c.label}" class="mb-1">${escapeHtml(time)}</div>
            <div class="mb-1" style="font-weight:500">${escapeHtml(t('server.online_trend_tooltip_count', { n: point.online }))}</div>
            <div style="overflow-wrap:break-word;word-break:break-word;hyphens:auto;">${names}</div>
          </div>
        `
      },
    },
    series: [{
      type: 'line',
      smooth: 0.5,
      smoothMonotone: 'x',
      showSymbol: false,
      data: pts.map(p => [p.recorded_at * 1000, p.online]),
      lineStyle: { color: '#28abce', width: 2 },
      areaStyle: { color: 'rgba(40,171,206,0.15)' },
    }],
  }
})
</script>
