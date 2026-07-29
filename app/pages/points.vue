<template>
  <div>
    <header class="flex items-center justify-between gap-3 mb-6 flex-wrap">
      <h1 class="text-2xl font-bold">{{ $t('promotion.title') }}</h1>
      <UiButton v-if="auth.isLoggedIn" size="sm" @click="dialogOpen = true">
        <template #leading><LucideSparkles :size="14" /></template>
        {{ $t('promotion.submit_button') }}
      </UiButton>
    </header>

    <UiTable v-if="pending || items.length > 0">
      <template #head>
        <tr>
          <th class="text-left px-4 py-2">{{ $t('promotion.col_user') }}</th>
          <th class="text-left px-4 py-2">{{ $t('promotion.field_description') }}</th>
          <th class="text-left px-4 py-2 w-24">{{ $t('promotion.col_points') }}</th>
          <th class="text-left px-4 py-2 w-28">{{ $t('promotion.col_status') }}</th>
          <th class="text-left px-4 py-2 w-40">{{ $t('promotion.col_created_at') }}</th>
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
          <td class="px-4 py-2 font-medium">#{{ item.user_id }}</td>
          <td class="px-4 py-2 text-text-secondary truncate max-w-xs">{{ item.description_text }}</td>
          <td class="px-4 py-2 font-medium">+{{ item.points }}</td>
          <td class="px-4 py-2">
            <UiTag :variant="statusVariant(item.status)" size="sm">
              {{ $t(`promotion.status_${item.status}`) }}
            </UiTag>
          </td>
          <td class="px-4 py-2 text-xs text-text-tertiary">{{ formatAuditTimestamp(new Date(item.created_at * 1000)) }}</td>
        </tr>
      </template>
    </UiTable>
    <UiEmpty v-else :message="$t('promotion.list_empty')" />

    <div class="mt-6 flex justify-center">
      <UiPagination :page="page" :page-size="pageSize" :total="total" @update:page="onPage" />
    </div>

    <PromotionClaimSubmitDialog v-model:open="dialogOpen" @submitted="onSubmitted" />
    <PromotionClaimDetailDialog v-model:open="detailOpen" :claim="detailTarget" @revoked="onRevoked" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { PromotionClaimItem, PromotionClaimStatus } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { useAuthStore } from '~/stores/auth'
import { useAuditTime } from '~/composables/useAuditTime'

definePageMeta({ layout: 'default' })

const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()
const { formatAuditTimestamp } = useAuditTime()

const items = ref<PromotionClaimItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const pending = ref(false)
const dialogOpen = ref(false)

const detailOpen = ref(false)
const detailTarget = ref<PromotionClaimItem | null>(null)

async function load() {
  pending.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), size: String(pageSize) })
    const r = await useApi<{ items: PromotionClaimItem[], total: number }>(`/api/promotion-claims?${params}`)
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

function openDetail(item: PromotionClaimItem) {
  detailTarget.value = item
  detailOpen.value = true
}

function onRevoked() {
  void load()
}

function statusVariant(status: PromotionClaimStatus) {
  return status === 'granted' ? 'success' : 'danger'
}

onMounted(load)

useHead(() => ({ title: t('promotion.title') }))
</script>
