<template>
  <UiCard hoverable padded class="h-full cursor-pointer" @click="$emit('click')">
    <div class="flex items-start justify-between gap-2 mb-2">
      <UiTag variant="brand" size="sm">{{ $t(`log_query.category_${request.category}`) }}</UiTag>
      <UiTag :variant="statusVariant(request.status)" size="sm">
        {{ $t(`log_query.status_${request.status}`) }}
      </UiTag>
    </div>
    <p class="font-medium text-text-primary truncate">{{ request.target_player || '—' }}</p>
    <p class="mt-1 text-sm text-text-secondary line-clamp-2 min-h-[2.5em]" :title="request.reason">{{ request.reason }}</p>
    <div class="mt-3 text-xs text-text-tertiary">
      {{ formatAuditTimestamp(new Date(request.created_at * 1000)) }}
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { LogQueryRequestItem, LogQueryStatus } from '~/types/api'
import { logQueryStatusVariant } from '~/composables/useLogCategories'
import { useAuditTime } from '~/composables/useAuditTime'

defineProps<{ request: LogQueryRequestItem }>()
defineEmits<{ click: [] }>()

const { formatAuditTimestamp } = useAuditTime()

function statusVariant(status: LogQueryStatus) {
  return logQueryStatusVariant(status)
}
</script>
