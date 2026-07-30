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

    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UiSkeleton v-for="i in 6" :key="i" variant="card" :height="120" />
    </div>
    <div v-else-if="items.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <ServerLogQueryCard v-for="item in items" :key="item.id" :request="item" @click="openDetail(item)" />
    </div>
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
import type { LogQueryRequestItem, ServerSummary } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'detail' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

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

onMounted(load)

useHead(() => ({ title: `${server.value?.name ?? ''} · ${t('log_query.title')}` }))
</script>
