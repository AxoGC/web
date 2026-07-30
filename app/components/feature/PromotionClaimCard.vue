<template>
  <UiCard hoverable padded class="h-full cursor-pointer" @click="$emit('click')">
    <div class="flex items-start justify-between gap-2 mb-2">
      <span class="font-medium text-text-primary">{{ claim.username || `#${claim.user_id}` }}</span>
      <UiTag :variant="statusVariant(claim.status)" size="sm">
        {{ $t(`promotion.status_${claim.status}`) }}
      </UiTag>
    </div>
    <p class="text-sm text-text-secondary line-clamp-2 min-h-[2.5em]">{{ claim.description_text }}</p>
    <div class="mt-3 flex items-center justify-between text-xs text-text-tertiary">
      <span class="font-medium text-text-secondary">+{{ claim.points }}</span>
      <span>{{ formatAuditTimestamp(new Date(claim.created_at * 1000)) }}</span>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { PromotionClaimItem, PromotionClaimStatus } from '~/types/api'
import { useAuditTime } from '~/composables/useAuditTime'

defineProps<{ claim: PromotionClaimItem }>()
defineEmits<{ click: [] }>()

const { formatAuditTimestamp } = useAuditTime()

function statusVariant(status: PromotionClaimStatus) {
  return status === 'granted' ? 'success' : 'danger'
}
</script>
