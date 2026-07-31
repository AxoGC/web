<template>
  <UiModal :open="open" :title="$t('admin.qr_review_title')" size="xl" @update:open="onUpdateOpen">
    <div v-if="request" class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <ServerLogQueryInfoRow :label="$t('log_query.col_target')">
          <span class="font-medium">{{ request.target_player || '—' }}</span>
        </ServerLogQueryInfoRow>
        <ServerLogQueryInfoRow :label="$t('admin.qr_col_category')">
          <UiTag variant="brand" size="sm">{{ $t(`log_query.category_${request.category}`) }}</UiTag>
        </ServerLogQueryInfoRow>
        <ServerLogQueryInfoRow :label="$t('admin.qr_col_requester')">
          <span class="font-medium">{{ request.requester_username || `#${request.requester_user_id}` }}</span>
        </ServerLogQueryInfoRow>
        <ServerLogQueryInfoRow :label="$t('admin.qr_col_status')">
          <UiTag :variant="logQueryStatusVariant(request.status)" size="sm">
            {{ $t(`log_query.status_${request.status}`) }}
          </UiTag>
        </ServerLogQueryInfoRow>
        <ServerLogQueryInfoRow :label="$t('log_query.field_from')">
          {{ request.approved_from_ts ? formatTime(request.approved_from_ts) : '—' }}
        </ServerLogQueryInfoRow>
        <ServerLogQueryInfoRow :label="$t('log_query.field_to')">
          {{ request.approved_to_ts ? formatTime(request.approved_to_ts) : '—' }}
        </ServerLogQueryInfoRow>
      </div>
      <ServerLogQueryInfoRow :label="$t('admin.qr_reason')">
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

        <UiField :label="$t('admin.qr_reject_reason')" :help="$t('admin.qr_reject_reason_hint')">
          <UiTextarea
            v-model="rejectReason"
            :rows="2"
            :placeholder="$t('admin.qr_reject_reason_placeholder')"
          />
        </UiField>
      </template>
    </div>

    <template #footer>
      <UiButton v-if="request?.status === 'approved'" variant="ghost" class="text-danger" @click="confirmOpen = true">
        {{ $t('admin.qr_reject') }}
      </UiButton>
      <UiButton variant="ghost" @click="onUpdateOpen(false)">{{ $t('actions.close') }}</UiButton>
    </template>
  </UiModal>

  <UiConfirmModal
    :open="confirmOpen"
    :title="$t('admin.qr_reject')"
    :message="$t('admin.qr_reject_confirm')"
    variant="danger"
    :loading="busy === 'reject'"
    @update:open="confirmOpen = $event"
    @confirm="doReject"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { LogQueryRequestItem } from '~/types/api'
import { logQueryStatusVariant } from '~/composables/useLogCategories'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

const props = defineProps<{
  open: boolean
  request: LogQueryRequestItem | null
}>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'resolved': []
}>()

const { t } = useI18n()
const toast = useToast()

const rejectReason = ref('')
const busy = ref<'reject' | null>(null)
const confirmOpen = ref(false)

const detailRows = ref<Record<string, unknown>[] | null>(null)
const loadingRows = ref(false)

// Admin needs to see the actual evidence to decide whether to pull it — same
// on-demand fetch as the public detail dialog, since the list/review payload
// never carries the (possibly huge) row set.
watch(() => [props.open, props.request?.id] as const, async ([isOpen, id]) => {
  detailRows.value = null
  rejectReason.value = ''
  confirmOpen.value = false
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

function onUpdateOpen(value: boolean) {
  if (busy.value) return
  emit('update:open', value)
}

async function doReject() {
  if (!props.request) return
  busy.value = 'reject'
  try {
    await useApi(`/api/admin/query-requests/${props.request.id}/reject`, {
      method: 'POST',
      body: { reason: rejectReason.value.trim() },
    })
    toast.success(t('admin.qr_rejected_toast'))
    confirmOpen.value = false
    emit('update:open', false)
    emit('resolved')
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    busy.value = null
  }
}
</script>
