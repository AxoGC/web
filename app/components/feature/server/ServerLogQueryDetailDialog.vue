<template>
  <UiModal :open="open" :title="$t('log_query.detail_title')" size="xl" @update:open="emit('update:open', $event)">
    <div v-if="request" class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <ServerLogQueryInfoRow :label="$t('log_query.col_target')">
          <span class="font-medium">{{ request.target_player || '—' }}</span>
        </ServerLogQueryInfoRow>
        <ServerLogQueryInfoRow :label="$t('log_query.col_category')">
          <UiTag variant="brand" size="sm">{{ $t(`log_query.category_${request.category}`) }}</UiTag>
        </ServerLogQueryInfoRow>
        <ServerLogQueryInfoRow :label="$t('admin.qr_col_requester')">
          <span class="font-medium">{{ request.requester_username || `#${request.requester_user_id}` }}</span>
        </ServerLogQueryInfoRow>
        <ServerLogQueryInfoRow :label="$t('log_query.col_status')">
          <UiTag :variant="logQueryStatusVariant(request.status)" size="sm">
            {{ $t(`log_query.status_${request.status}`) }}
          </UiTag>
        </ServerLogQueryInfoRow>
        <ServerLogQueryInfoRow :label="$t('log_query.field_from')">
          {{ request.from_ts ? formatTime(request.from_ts) : '—' }}
        </ServerLogQueryInfoRow>
        <ServerLogQueryInfoRow :label="$t('log_query.field_to')">
          {{ request.to_ts ? formatTime(request.to_ts) : '—' }}
        </ServerLogQueryInfoRow>
      </div>
      <ServerLogQueryInfoRow :label="$t('log_query.field_reason')">
        <span class="whitespace-pre-wrap">{{ request.reason }}</span>
      </ServerLogQueryInfoRow>
      <ServerLogQueryInfoRow v-if="request.status === 'rejected' && request.reject_reason" :label="$t('log_query.reject_reason')">
        <span class="whitespace-pre-wrap">{{ request.reject_reason }}</span>
      </ServerLogQueryInfoRow>

      <template v-if="request.status === 'approved'">
        <div class="pt-3 border-t border-border-subtle">
          <p class="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">
            {{ $t('log_query.result_title') }}
          </p>
          <UiSkeleton v-if="loadingRows" variant="card" :height="120" />
          <ServerLogQueryResultTable v-else :rows="detailRows ?? []" :category="request.category" />
        </div>
      </template>
      <p v-else class="text-xs text-text-tertiary">
        {{ $t(request.status === 'pending' ? 'log_query.no_result_pending' : 'log_query.no_result_rejected') }}
      </p>
    </div>

    <template #footer>
      <UiButton v-if="auth.isAdmin" variant="ghost" class="text-danger" @click="confirmOpen = true">
        {{ $t('actions.delete') }}
      </UiButton>
      <UiButton variant="ghost" @click="emit('update:open', false)">{{ $t('actions.close') }}</UiButton>
    </template>
  </UiModal>

  <UiConfirmModal
    :open="confirmOpen"
    :title="$t('actions.delete')"
    :message="$t('admin.qr_delete_confirm')"
    variant="danger"
    :loading="deleting"
    @update:open="confirmOpen = $event"
    @confirm="doDelete"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { LogQueryRequestItem } from '~/types/api'
import { logQueryStatusVariant } from '~/composables/useLogCategories'
import { useAuthStore } from '~/stores/auth'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

const props = defineProps<{ open: boolean, request: LogQueryRequestItem | null }>()
const emit = defineEmits<{ 'update:open': [value: boolean], 'deleted': [id: number] }>()

const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const confirmOpen = ref(false)
const deleting = ref(false)

const detailRows = ref<Record<string, unknown>[] | null>(null)
const loadingRows = ref(false)

// The list endpoint deliberately never sends `rows` (an approved snapshot
// can hold up to 5000 entries) — fetch the single item on demand each time
// the dialog opens on an approved request, instead of relying on the caller
// having already loaded it.
watch(() => [props.open, props.request?.id] as const, async ([isOpen, id]) => {
  detailRows.value = null
  if (!isOpen || !id || props.request?.status !== 'approved') return
  loadingRows.value = true
  try {
    const full = await useApi<LogQueryRequestItem>(`/api/query-requests/${id}`)
    detailRows.value = full.rows ?? []
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    loadingRows.value = false
  }
}, { immediate: true })

function formatTime(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleString()
}

async function doDelete() {
  if (!props.request) return
  deleting.value = true
  try {
    await useApi(`/api/admin/query-requests/${props.request.id}`, { method: 'DELETE' })
    toast.success(t('admin.qr_deleted_toast'))
    confirmOpen.value = false
    emit('update:open', false)
    emit('deleted', props.request.id)
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    deleting.value = false
  }
}
</script>
