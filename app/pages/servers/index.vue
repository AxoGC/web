<template>
  <div class="px-4 lg:px-6 py-6 pb-20 md:pb-12">
    <h1 class="text-2xl font-bold mb-6">{{ $t('server.list_title') }}</h1>
    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UiSkeleton v-for="i in 6" :key="i" variant="card" :height="120" />
    </div>
    <div v-else-if="!data?.items?.length">
      <UiEmpty :message="$t('empty.servers')" />
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <ServerCard v-for="s in data.items" :key="s.id" :server="s" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ServerSummary } from '~/types/api'
definePageMeta({ layout: 'default' })
useHead({ title: 'Servers' })

const { data, pending, refresh } = await useAsyncData('servers.list', () =>
  useApi<{ items: ServerSummary[] }>('/api/servers'),
)

if (import.meta.client) {
  usePolling(() => refresh(), { interval: 30_000, immediate: false })
}
</script>
