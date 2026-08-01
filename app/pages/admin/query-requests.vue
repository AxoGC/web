<template>
  <div>
    <header class="flex items-center justify-between gap-3 mb-6 flex-wrap">
      <h1 class="text-2xl">{{ $t('admin.query_requests') }}</h1>
      <div class="flex flex-wrap gap-2">
        <UiButton
          v-for="tab in TABS"
          :key="tab"
          :variant="status === tab ? 'primary' : 'secondary'"
          size="sm"
          @click="status = tab; page = 1"
        >
          {{ $t(`admin.qr_tab_${tab}`) }}
        </UiButton>
      </div>
    </header>

    <UiTable v-if="pending || items.length > 0">
      <template #head>
        <tr>
          <th class="text-left px-4 py-2 w-16">{{ $t('admin.qr_col_id') }}</th>
          <th class="text-left px-4 py-2">{{ $t('admin.qr_col_target_server') }}</th>
          <th class="text-left px-4 py-2">{{ $t('admin.qr_col_target') }}</th>
          <th class="text-left px-4 py-2">{{ $t('admin.qr_col_category') }}</th>
          <th class="text-left px-4 py-2">{{ $t('admin.qr_col_requester') }}</th>
          <th class="text-left px-4 py-2">{{ $t('log_query.field_reason') }}</th>
          <th class="text-left px-4 py-2">{{ $t('admin.qr_col_status') }}</th>
          <th class="text-left px-4 py-2 w-40">{{ $t('admin.qr_col_created_at') }}</th>
        </tr>
      </template>
      <template v-if="pending">
        <tr v-for="i in 5" :key="i" class="border-t border-border-subtle">
          <td colspan="8" class="px-4 py-3"><UiSkeleton /></td>
        </tr>
      </template>
      <template v-else>
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-t border-border-subtle cursor-pointer hover:bg-bg-hover"
          @click="openReview(item)"
        >
          <td class="px-4 py-2 text-text-tertiary">{{ item.id }}</td>
          <td class="px-4 py-2">{{ serverName(item.target_server_id) }}</td>
          <td class="px-4 py-2 font-medium">{{ item.target_player || '—' }}</td>
          <td class="px-4 py-2">
            <UiTag variant="brand" size="sm">{{ $t(`log_query.category_${item.category}`) }}</UiTag>
          </td>
          <td class="px-4 py-2 text-text-secondary">{{ item.requester_username || `#${item.requester_user_id}` }}</td>
          <td class="px-4 py-2 text-text-secondary truncate max-w-xs" :title="item.reason">{{ item.reason }}</td>
          <td class="px-4 py-2">
            <UiTag :variant="logQueryStatusVariant(item.status)" size="sm">
              {{ $t(`log_query.status_${item.status}`) }}
            </UiTag>
          </td>
          <td class="px-4 py-2 text-xs text-text-tertiary">{{ formatAuditTimestamp(new Date(item.created_at * 1000)) }}</td>
        </tr>
      </template>
    </UiTable>
    <UiEmpty v-else :message="$t('admin.qr_empty')" />

    <div class="mt-6 flex justify-center">
      <UiPagination :page="page" :page-size="pageSize" :total="total" @update:page="onPage" />
    </div>

    <ServerLogQueryReviewDialog
      v-model:open="reviewOpen"
      :request="reviewTarget"
      @resolved="load"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { AdminServerItem, LogQueryRequestItem, LogQueryStatus } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { logQueryStatusVariant } from '~/composables/useLogCategories'
import { useAuditTime } from '~/composables/useAuditTime'

definePageMeta({ layout: 'admin', middleware: ['admin'], ssr: false })

const toast = useToast()
const { t } = useI18n()
const { formatAuditTimestamp } = useAuditTime()

// Submissions are granted instantly now (see logquery.Service.Submit) — the
// "pending" status can only appear on legacy rows from before that change,
// so the default view is "approved", not "pending".
const TABS = ['approved', 'rejected', 'pending', 'all'] as const
type Tab = typeof TABS[number]
const status = ref<Tab>('approved')

const items = ref<LogQueryRequestItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const pending = ref(false)

const serverNames = ref<Record<number, string>>({})
function serverName(id: number) {
  return serverNames.value[id] ?? `#${id}`
}

const reviewOpen = ref(false)
const reviewTarget = ref<LogQueryRequestItem | null>(null)

async function loadServers() {
  try {
    const r = await useApi<{ items: AdminServerItem[] }>('/api/admin/servers')
    serverNames.value = Object.fromEntries(r.items.map(s => [s.id, s.name]))
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  }
}

async function load() {
  pending.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), size: String(pageSize) })
    if (status.value !== 'all') params.set('status', status.value as LogQueryStatus)
    const r = await useApi<{ items: LogQueryRequestItem[], total: number }>(`/api/query-requests?${params}`)
    items.value = r.items
    total.value = r.total
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    pending.value = false
  }
}

function onPage(p: number) { page.value = p; void load() }

function openReview(item: LogQueryRequestItem) {
  reviewTarget.value = item
  reviewOpen.value = true
}

watch(status, () => { void load() })
onMounted(() => { void loadServers(); void load() })

useHead(() => ({ title: t('admin.query_requests') }))
</script>
