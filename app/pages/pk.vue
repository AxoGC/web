<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ $t('pk.title') }}</h1>
    <UiCard padded class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <UiField :label="$t('pk.game')">
          <UiSelect v-model="game" :options="gameOptions" />
        </UiField>
        <UiField :label="$t('pk.player_a')">
          <UiInput v-model="a" />
        </UiField>
        <UiField :label="$t('pk.player_b')">
          <UiInput v-model="b" />
        </UiField>
        <UiField :label="' '">
          <UiButton block :loading="pending" :disabled="!canCompare" @click="onCompare">
            {{ $t('pk.compare') }}
          </UiButton>
        </UiField>
      </div>
    </UiCard>

    <UiCard v-if="data" padded>
      <ClientOnly>
        <VChart class="w-full h-96" :option="chartOption" autoresize />
      </ClientOnly>
    </UiCard>
    <UiEmpty v-else-if="!canCompare" :message="$t('pk.pick_both')" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({ layout: 'detail' })
useHead({ title: 'PK' })

const route = useRoute()
const router = useRouter()

const game = ref(String(route.query.game || 'mc-java'))
const a = ref(String(route.query.a || ''))
const b = ref(String(route.query.b || ''))

const gameOptions = [
  { value: 'mc-java', label: 'MC Java' },
  { value: 'mc-bedrock', label: 'MC Bedrock' },
]

const canCompare = computed(() => !!(a.value.trim() && b.value.trim()))

interface PkResp {
  a: { name: string, stats: Record<string, number> }
  b: { name: string, stats: Record<string, number> }
}

const { data, pending, refresh } = await useAsyncData(
  () => `pk.${game.value}.${a.value}.${b.value}`,
  () => {
    if (!canCompare.value) return null
    return useApi<PkResp>(`/api/server/pk?game=${game.value}&a=${encodeURIComponent(a.value)}&b=${encodeURIComponent(b.value)}`)
  },
  { watch: [game, a, b], lazy: true, immediate: false },
)

function onCompare() {
  router.replace({ query: { game: game.value, a: a.value, b: b.value } })
  void refresh()
}

const radarFields = [
  'play_time', 'mob_kills_total', 'pvp_kills', 'deaths',
  'damage_dealt', 'damage_taken', 'blocks_broken_total', 'distance_walked',
]

const chartOption = computed(() => {
  if (!data.value) return null
  const aSt = data.value.a.stats || {}
  const bSt = data.value.b.stats || {}
  const indicator = radarFields.map((f) => ({
    name: f,
    max: Math.max(Number(aSt[f] || 0), Number(bSt[f] || 0)) * 1.15 || 1,
  }))
  return {
    backgroundColor: 'transparent',
    radar: {
      indicator,
      shape: 'polygon',
      axisName: { color: 'var(--text-secondary)' },
      splitLine: { lineStyle: { color: 'var(--border-default)' } },
      axisLine: { lineStyle: { color: 'var(--border-default)' } },
      splitArea: { areaStyle: { color: ['rgba(40,171,206,0.04)', 'rgba(40,171,206,0.08)'] } },
    },
    legend: { textStyle: { color: 'var(--text-secondary)' }, top: 0 },
    tooltip: { backgroundColor: 'var(--bg-overlay)', borderColor: 'var(--border-default)', textStyle: { color: 'var(--text-primary)' } },
    series: [{
      type: 'radar',
      data: [
        { value: radarFields.map((f) => Number(aSt[f] || 0)), name: data.value.a.name, areaStyle: { color: 'rgba(40,171,206,0.25)' }, lineStyle: { color: '#28abce' } },
        { value: radarFields.map((f) => Number(bSt[f] || 0)), name: data.value.b.name, areaStyle: { color: 'rgba(245,158,11,0.25)' }, lineStyle: { color: '#f59e0b' } },
      ],
    }],
  }
})
</script>
