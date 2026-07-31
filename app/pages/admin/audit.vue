<template>
  <div>
    <header class="flex items-center justify-between gap-3 mb-6 flex-wrap">
      <h1 class="text-2xl">{{ $t('admin.audit') }}</h1>
      <div class="flex items-center gap-2">
        <UiInput v-model="serverId" placeholder="server_id" size="sm" />
        <UiInput v-model="player" placeholder="player" size="sm" />
        <UiInput v-model="action" placeholder="action" size="sm" />
        <UiButton size="sm" variant="secondary" @click="load">{{ $t('actions.refresh') }}</UiButton>
      </div>
    </header>

    <UiTable>
      <template #head>
        <tr>
          <th class="px-4 py-2 text-left">ID</th>
          <th class="px-4 py-2 text-left">Server</th>
          <th class="px-4 py-2 text-left">Player</th>
          <th class="px-4 py-2 text-left">Action</th>
          <th class="px-4 py-2 text-left">Target</th>
          <th class="px-4 py-2 text-left">Pos</th>
          <th class="px-4 py-2 text-left">Time</th>
        </tr>
      </template>
      <template v-if="pending">
        <tr v-for="i in 6" :key="i" class="border-t border-border-subtle">
          <td colspan="7" class="px-4 py-3"><UiSkeleton /></td>
        </tr>
      </template>
      <template v-else>
        <tr v-for="row in logs" :key="row.id" class="border-t border-border-subtle">
          <td class="px-4 py-2 text-text-tertiary text-xs">{{ row.id }}</td>
          <td class="px-4 py-2">{{ row.server_id }}</td>
          <td class="px-4 py-2">{{ row.player_name }}</td>
          <td class="px-4 py-2 font-mono text-xs">{{ row.action }}</td>
          <td class="px-4 py-2 text-text-secondary">{{ row.target_name }}</td>
          <td class="px-4 py-2 font-mono text-xs">{{ row.pos_x }},{{ row.pos_y }},{{ row.pos_z }}</td>
          <td class="px-4 py-2 text-xs text-text-tertiary">{{ row.timestamp }}</td>
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
import type { AuditLog } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })

const serverId = ref('')
const player = ref('')
const action = ref('')
const page = ref(1)
const logs = ref<AuditLog[]>([])
const total = ref(0)
const pending = ref(false)

async function load() {
  pending.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value) })
    if (serverId.value) params.set('server_id', serverId.value)
    if (player.value) params.set('player', player.value)
    if (action.value) params.set('action', action.value)
    const r = await useApi<{ items: AuditLog[], total: number }>(`/api/admin/audit?${params}`)
    logs.value = r.items
    total.value = r.total
  } finally { pending.value = false }
}

function onPage(p: number) { page.value = p; void load() }

onMounted(load)
</script>
