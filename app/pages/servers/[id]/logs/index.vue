<template>
  <div>
    <NuxtLink
      :to="`/servers/${id}`"
      class="hidden md:inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-4"
    >
      <LucideChevronLeft :size="16" />
      {{ server?.name || $t('actions.back') }}
    </NuxtLink>

    <header class="flex items-center justify-between gap-3 mb-6 flex-wrap">
      <h1 class="text-2xl font-bold">{{ $t('log_query.title') }}</h1>
      <UiButton v-if="auth.isLoggedIn" size="sm" @click="dialogOpen = true">
        <template #leading><LucideSearch :size="14" /></template>
        {{ $t('log_query.submit_button') }}
      </UiButton>
    </header>

    <UiTable v-if="pending || items.length > 0">
      <template #head>
        <tr>
          <th class="text-left px-4 py-2">{{ $t('log_query.col_category') }}</th>
          <th class="text-left px-4 py-2">{{ $t('log_query.col_target') }}</th>
          <th class="text-left px-4 py-2">{{ $t('log_query.field_reason') }}</th>
          <th class="text-left px-4 py-2">{{ $t('log_query.col_status') }}</th>
          <th class="text-left px-4 py-2 w-40">{{ $t('log_query.col_created_at') }}</th>
        </tr>
      </template>
      <template v-if="pending">
        <tr v-for="i in 5" :key="i" class="border-t border-border-subtle">
          <td colspan="5" class="px-4 py-3"><UiSkeleton /></td>
        </tr>
      </template>
      <template v-else>
        <tr
          v-for="item in items"
          :key="item.id"
          class="border-t border-border-subtle cursor-pointer hover:bg-bg-hover"
          @click="openDetail(item)"
        >
          <td class="px-4 py-2">
            <UiTag variant="brand" size="sm">{{ $t(`log_query.category_${item.category}`) }}</UiTag>
          </td>
          <td class="px-4 py-2 font-medium">{{ item.target_player || '—' }}</td>
          <td class="px-4 py-2 text-text-secondary truncate max-w-xs" :title="item.reason">{{ item.reason }}</td>
          <td class="px-4 py-2">
            <UiTag :variant="statusVariant(item.status)" size="sm">
              {{ $t(`log_query.status_${item.status}`) }}
            </UiTag>
          </td>
          <td class="px-4 py-2 text-xs text-text-tertiary">{{ formatAuditTimestamp(new Date(item.created_at * 1000)) }}</td>
        </tr>
      </template>
    </UiTable>
    <UiEmpty v-else :message="$t('log_query.list_empty')" />

    <div class="mt-6 flex justify-center">
      <UiPagination :page="page" :page-size="pageSize" :total="total" @update:page="onPage" />
    </div>

    <ServerLogQuerySubmitDialog
      v-model:open="dialogOpen"
      :server-id="id"
      :server-type="server?.type ?? ''"
      @submitted="onSubmitted"
    />

    <ServerLogQueryDetailDialog v-model:open="detailOpen" :request="detailTarget" @deleted="onDeleted" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import type { LogQueryRequestItem, LogQueryStatus, ServerSummary } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { useAuthStore } from '~/stores/auth'
import { logQueryStatusVariant } from '~/composables/useLogCategories'
import { useAuditTime } from '~/composables/useAuditTime'

definePageMeta({ layout: 'detail' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()
const { formatAuditTimestamp } = useAuditTime()

const { data: server } = await useAsyncData(
  () => `server.head.${id.value}`,
  () => useApi<ServerSummary>(`/api/servers/${id.value}`).catch(() => null),
)

const items = ref<LogQueryRequestItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const pending = ref(false)
const dialogOpen = ref(false)

const detailOpen = ref(false)
const detailTarget = ref<LogQueryRequestItem | null>(null)

async function load() {
  pending.value = true
  try {
    const params = new URLSearchParams({
      target_server_id: id.value,
      page: String(page.value),
      size: String(pageSize),
    })
    const r = await useApi<{ items: LogQueryRequestItem[], total: number }>(`/api/query-requests?${params}`)
    items.value = r.items
    total.value = r.total
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    pending.value = false
  }
}

function onPage(p: number) {
  page.value = p
  void load()
}

function onSubmitted() {
  page.value = 1
  void load()
}

function openDetail(item: LogQueryRequestItem) {
  detailTarget.value = item
  detailOpen.value = true
}

function onDeleted() {
  void load()
}

function statusVariant(status: LogQueryStatus) {
  return logQueryStatusVariant(status)
}

onMounted(load)

useHead(() => ({ title: `${server.value?.name ?? ''} · ${t('log_query.title')}` }))
</script>
