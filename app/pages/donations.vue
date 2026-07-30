<template>
  <div class="px-4 lg:px-6 py-6 pb-20 md:pb-12">
    <h1 class="text-2xl font-bold mb-6">{{ $t('donation.list_title') }}</h1>
    <div v-if="pending" class="space-y-2">
      <UiSkeleton v-for="i in 6" :key="i" :height="56" />
    </div>
    <div v-else-if="!data?.items?.length">
      <UiEmpty :message="$t('empty.donations')" />
    </div>
    <UiCard v-else>
      <ul>
        <li
          v-for="(d, i) in data.items"
          :key="i"
          class="flex items-center gap-4 px-5 py-3 border-b border-border-subtle last:border-b-0"
        >
          <span :class="['w-8 h-8 rounded-full grid place-items-center text-sm font-bold', rankClass(i + 1)]">
            {{ i + 1 }}
          </span>
          <UiAvatar :name="d.display_name" size="sm" />
          <div class="flex-1 min-w-0">
            <p class="truncate">
              <span class="font-medium">{{ d.display_name || $t('donation.anonymous') }}</span>
              <span v-if="d.message" class="ml-2 text-xs text-text-tertiary">{{ d.message }}</span>
            </p>
          </div>
          <span class="font-mono font-semibold text-brand-400">¥{{ d.amount.toFixed(2) }}</span>
        </li>
      </ul>
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import type { DonationItem } from '~/types/api'

definePageMeta({ layout: 'default' })
useHead({ title: 'Donations' })

const { data, pending } = await useAsyncData('donations.list', () =>
  useApi<{ items: DonationItem[] }>('/api/donations/ranking?limit=50'),
)

function rankClass(rank: number) {
  if (rank === 1) return 'bg-yellow-500/15 text-yellow-400'
  if (rank === 2) return 'bg-gray-400/15 text-gray-300'
  if (rank === 3) return 'bg-amber-600/15 text-amber-400'
  return 'bg-bg-overlay text-text-tertiary'
}
</script>
