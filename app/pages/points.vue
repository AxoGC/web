<template>
  <div class="px-4 lg:px-6 py-6 pb-20 md:pb-12">
    <header class="flex items-center justify-between gap-3 mb-6 flex-wrap">
      <h1 class="text-2xl font-bold">{{ $t('promotion.title') }}</h1>
      <div class="flex items-center gap-3">
        <div v-if="auth.isLoggedIn" class="flex items-center gap-1.5 rounded-full bg-bg-subtle px-3 py-1.5 text-sm">
          <LucideCoins :size="14" class="text-brand-500" />
          <span class="text-text-tertiary">{{ $t('promotion.current_points') }}</span>
          <span class="font-semibold text-text-primary">{{ auth.user?.point ?? 0 }}</span>
        </div>
        <UiButton v-if="auth.isLoggedIn" size="sm" @click="dialogOpen = true">
          <template #leading><LucideSparkles :size="14" /></template>
          {{ $t('promotion.submit_button') }}
        </UiButton>
      </div>
    </header>

    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UiSkeleton v-for="i in 6" :key="i" variant="card" :height="120" />
    </div>
    <div v-else-if="items.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <PromotionClaimCard v-for="item in items" :key="item.id" :claim="item" @click="openDetail(item)" />
    </div>
    <UiEmpty v-else :message="$t('promotion.list_empty')" />

    <div class="mt-6 flex justify-center">
      <UiPagination :page="page" :page-size="pageSize" :total="total" @update:page="onPage" />
    </div>

    <PromotionClaimSubmitDialog v-model:open="dialogOpen" @submitted="onSubmitted" />
    <PromotionClaimDetailDialog v-model:open="detailOpen" :claim="detailTarget" @revoked="onRevoked" @deleted="onRevoked" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { PromotionClaimItem } from '~/types/api'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'default' })

const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

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

onMounted(load)

useHead(() => ({ title: t('promotion.title') }))
</script>
