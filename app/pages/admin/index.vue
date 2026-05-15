<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ $t('admin.dashboard') }}</h1>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UiCard padded>
        <p class="text-xs text-text-tertiary uppercase">{{ $t('admin.users') }}</p>
        <p class="text-2xl font-bold mt-1">{{ stats.users ?? '—' }}</p>
      </UiCard>
      <UiCard padded>
        <p class="text-xs text-text-tertiary uppercase">{{ $t('admin.servers') }}</p>
        <p class="text-2xl font-bold mt-1">{{ stats.servers ?? '—' }}</p>
      </UiCard>
      <UiCard padded>
        <p class="text-xs text-text-tertiary uppercase">{{ $t('admin.donations') }}</p>
        <p class="text-2xl font-bold mt-1">{{ stats.donations ?? '—' }}</p>
      </UiCard>
      <UiCard padded>
        <p class="text-xs text-text-tertiary uppercase">{{ $t('admin.logs') }}</p>
        <p class="text-2xl font-bold mt-1">{{ stats.logs ?? '—' }}</p>
      </UiCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'

definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
useHead({ title: 'Admin' })

const stats = reactive<{ users?: number, servers?: number, donations?: number, logs?: number }>({})

onMounted(async () => {
  // Best-effort summary cards — admin endpoints already return totals via list endpoints.
  try {
    const u = await useApi<{ total: number }>('/api/admin/users?page=1&size=1')
    stats.users = u.total
  } catch { /* ignore */ }
  try {
    const s = await useApi<{ items: unknown[] }>('/api/servers')
    stats.servers = s.items.length
  } catch { /* ignore */ }
  try {
    const d = await useApi<{ items: unknown[] }>('/api/donations/ranking?limit=200')
    stats.donations = d.items.length
  } catch { /* ignore */ }
  try {
    const l = await useApi<{ total: number }>('/api/admin/logs?page=1')
    stats.logs = l.total
  } catch { /* ignore */ }
})
</script>
