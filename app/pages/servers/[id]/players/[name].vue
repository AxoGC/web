<template>
  <div>
    <header class="flex items-center gap-3 mb-6">
      <UiAvatar :name="name" size="md" />
      <div>
        <h1 class="text-2xl font-bold">{{ name }}</h1>
        <p class="text-sm text-text-tertiary">
          <NuxtLink :to="`/servers/${id}`" class="hover:text-brand-400">{{ $t('server.detail_title') }}</NuxtLink>
        </p>
      </div>
    </header>

    <div v-if="error">
      <UiEmpty :message="$t(`errors.${errorCode}`)" />
    </div>
    <UiCard v-else-if="data" padded>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div v-for="(v, k) in displayStats" :key="k" class="bg-bg-overlay/40 rounded-md px-3 py-2">
          <p class="text-xs text-text-tertiary font-mono uppercase">{{ k }}</p>
          <p class="font-semibold text-text-primary">{{ formatVal(v) }}</p>
        </div>
      </div>
    </UiCard>
    <UiSkeleton v-else :height="200" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PlayerStats } from '~/types/api'

definePageMeta({ layout: 'detail' })
const route = useRoute()
const id = computed(() => String(route.params.id))
const name = computed(() => decodeURIComponent(String(route.params.name)))

const { data, error } = await useAsyncData(
  () => `srv.player.${id.value}.${name.value}`,
  () => useApi<PlayerStats>(`/api/servers/${id.value}/players/${encodeURIComponent(name.value)}/stats`),
)

const errorCode = computed(() => {
  const e = error.value as unknown as { code?: string } | null
  return e?.code || 'UNKNOWN'
})

const displayStats = computed(() => data.value?.stats || {})

function formatVal(v: unknown) {
  if (typeof v === 'number') return v.toLocaleString()
  return String(v)
}
</script>
