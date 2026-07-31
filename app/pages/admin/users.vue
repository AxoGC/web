<template>
  <div>
    <header class="flex items-center justify-between flex-wrap gap-3 mb-6">
      <h1 class="text-2xl">{{ $t('admin.users') }}</h1>
      <div class="flex items-center gap-2">
        <UiInput v-model="q" :placeholder="$t('actions.search')" :leading-icon="LucideSearch" size="sm" />
        <UiSelect
          v-model="status"
          :options="[
            { value: '', label: $t('common.all') },
            { value: 'active', label: $t('admin.status_active') },
            { value: 'banned', label: $t('admin.status_banned') },
          ]"
          size="sm"
        />
        <UiButton size="sm" variant="secondary" @click="load">{{ $t('actions.refresh') }}</UiButton>
      </div>
    </header>

    <UiTable>
      <template #head>
        <tr>
          <th class="text-left px-4 py-2">ID</th>
          <th class="text-left px-4 py-2">{{ $t('auth.username') }}</th>
          <th class="text-left px-4 py-2">{{ $t('auth.email') }}</th>
          <th class="text-left px-4 py-2">{{ $t('admin.role') }}</th>
          <th class="text-left px-4 py-2">{{ $t('admin.status') }}</th>
          <th class="text-right px-4 py-2">{{ $t('admin.points') }}</th>
          <th class="text-right px-4 py-2">{{ $t('admin.actions') }}</th>
        </tr>
      </template>
      <template v-if="pending">
        <tr v-for="i in 6" :key="i" class="border-t border-border-subtle">
          <td colspan="7" class="px-4 py-3">
            <UiSkeleton :height="16" />
          </td>
        </tr>
      </template>
      <template v-else>
        <tr v-for="u in users" :key="u.id" class="border-t border-border-subtle">
          <td class="px-4 py-2 text-text-tertiary">{{ u.id }}</td>
          <td class="px-4 py-2 font-medium">{{ u.username }}</td>
          <td class="px-4 py-2 text-text-secondary">{{ u.email }}</td>
          <td class="px-4 py-2">
            <UiSelect
              :model-value="u.role"
              :options="roleOptions"
              size="sm"
              @update:model-value="(v) => patch(u, { role: String(v) })"
            />
          </td>
          <td class="px-4 py-2">
            <UiSelect
              :model-value="u.status"
              :options="statusOptions"
              size="sm"
              @update:model-value="(v) => patch(u, { status: String(v) })"
            />
          </td>
          <td class="px-4 py-2 text-right font-mono text-text-secondary">{{ u.point }}</td>
          <td class="px-4 py-2 text-right">
            <UiButton size="sm" variant="ghost" @click="openPointsDialog(u)">{{ $t('admin.points') }}</UiButton>
            <NuxtLink :to="`/users/${u.id}`">
              <UiButton size="sm" variant="ghost">{{ $t('actions.view') }}</UiButton>
            </NuxtLink>
          </td>
        </tr>
      </template>
    </UiTable>

    <div class="mt-6 flex justify-center">
      <UiPagination :page="page" :page-size="size" :total="total" @update:page="onPage" />
    </div>

    <AdminPointsCorrectionDialog
      v-model:open="pointsDialogOpen"
      :user-id="pointsDialogUserId"
      @corrected="onCorrected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { MeDTO } from '~/stores/auth'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { LucideSearch } from '#components'

definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })
const toast = useToast()
const { t } = useI18n()

const q = ref('')
const status = ref('')
const page = ref(1)
const size = 20
const users = ref<MeDTO[]>([])
const total = ref(0)
const pending = ref(false)

const roleOptions = computed(() => [
  { value: 'user', label: t('admin.role_user') },
  { value: 'mod', label: t('admin.role_mod') },
  { value: 'admin', label: t('admin.role_admin') },
])
const statusOptions = computed(() => [
  { value: 'active', label: t('admin.status_active') },
  { value: 'banned', label: t('admin.status_banned') },
])

async function load() {
  pending.value = true
  try {
    const r = await useApi<{ items: MeDTO[], total: number }>(
      `/api/admin/users?page=${page.value}&size=${size}` +
      (q.value ? `&q=${encodeURIComponent(q.value)}` : '') +
      (status.value ? `&status=${status.value}` : ''),
    )
    users.value = r.items
    total.value = r.total
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    pending.value = false
  }
}

async function patch(u: MeDTO, patchData: { role?: string, status?: string }) {
  try {
    const r = await useApi<MeDTO>(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      body: patchData,
    })
    Object.assign(u, r)
    toast.success(t('actions.save'))
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  }
}

const pointsDialogOpen = ref(false)
const pointsDialogUserId = ref<number | null>(null)

function openPointsDialog(u: MeDTO) {
  pointsDialogUserId.value = u.id
  pointsDialogOpen.value = true
}

function onCorrected(updated: MeDTO) {
  const row = users.value.find(u => u.id === updated.id)
  if (row) row.point = updated.point
}

function onPage(p: number) {
  page.value = p
  void load()
}

let debouncer: ReturnType<typeof setTimeout> | null = null
watch([q, status], () => {
  if (debouncer) clearTimeout(debouncer)
  debouncer = setTimeout(() => {
    page.value = 1
    void load()
  }, 300)
})

onMounted(load)
</script>
