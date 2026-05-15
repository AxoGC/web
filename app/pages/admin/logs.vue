<template>
  <div>
    <header class="flex items-center justify-between gap-3 mb-6 flex-wrap">
      <h1 class="text-2xl font-bold">{{ $t('admin.logs') }}</h1>
      <div class="flex items-center gap-2">
        <UiInput v-model="action" :placeholder="'action'" size="sm" />
        <UiInput v-model="actorId" :placeholder="'actor_id'" size="sm" />
        <UiButton size="sm" variant="secondary" @click="load">{{ $t('actions.refresh') }}</UiButton>
      </div>
    </header>

    <UiTable>
      <template #head>
        <tr>
          <th class="px-4 py-2 text-left">ID</th>
          <th class="px-4 py-2 text-left">Actor</th>
          <th class="px-4 py-2 text-left">Action</th>
          <th class="px-4 py-2 text-left">Target</th>
          <th class="px-4 py-2 text-left">IP</th>
          <th class="px-4 py-2 text-left">Time</th>
        </tr>
      </template>
      <template v-if="pending">
        <tr v-for="i in 6" :key="i" class="border-t border-border-subtle">
          <td colspan="6" class="px-4 py-3"><UiSkeleton /></td>
        </tr>
      </template>
      <template v-else>
        <tr v-for="row in logs" :key="row.id" class="border-t border-border-subtle">
          <td class="px-4 py-2 text-text-tertiary text-xs">{{ row.id }}</td>
          <td class="px-4 py-2">{{ row.actor_name || row.actor_id }}</td>
          <td class="px-4 py-2 font-mono text-xs">{{ row.action }}</td>
          <td class="px-4 py-2 text-text-secondary">{{ row.target_type }}#{{ row.target_id }}</td>
          <td class="px-4 py-2 font-mono text-xs">{{ row.ip }}</td>
          <td class="px-4 py-2 text-xs text-text-tertiary">{{ row.created_at }}</td>
        </tr>
      </template>
    </UiTable>

    <div class="mt-6 flex justify-center">
      <UiPagination :page="page" :page-size="20" :total="total" @update:page="onPage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Log } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
const toast = useToast()

const action = ref('')
const actorId = ref('')
const page = ref(1)
const logs = ref<Log[]>([])
const total = ref(0)
const pending = ref(false)

async function load() {
  pending.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value) })
    if (action.value) params.set('action', action.value)
    if (actorId.value) params.set('actor_id', actorId.value)
    const r = await useApi<{ items: Log[], total: number }>(`/api/admin/logs?${params}`)
    logs.value = r.items
    total.value = r.total
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    pending.value = false
  }
}

function onPage(p: number) { page.value = p; void load() }

onMounted(load)
</script>
