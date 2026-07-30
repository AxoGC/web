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
        <template v-if="!isPending">
          <ServerLogQueryInfoRow :label="$t('log_query.field_from')">
            {{ request.approved_from_ts ? formatTime(request.approved_from_ts) : '—' }}
          </ServerLogQueryInfoRow>
          <ServerLogQueryInfoRow :label="$t('log_query.field_to')">
            {{ request.approved_to_ts ? formatTime(request.approved_to_ts) : '—' }}
          </ServerLogQueryInfoRow>
        </template>
      </div>
      <ServerLogQueryInfoRow :label="$t('admin.qr_reason')">
        <span class="whitespace-pre-wrap">{{ request.reason }}</span>
      </ServerLogQueryInfoRow>
      <ServerLogQueryInfoRow v-if="request.status === 'rejected' && request.reject_reason" :label="$t('log_query.reject_reason')">
        <span class="whitespace-pre-wrap">{{ request.reject_reason }}</span>
      </ServerLogQueryInfoRow>

      <template v-if="isPending">
        <p class="text-xs text-text-tertiary">{{ $t('admin.qr_override_hint') }}</p>

        <UiField :label="$t('log_query.field_from')" horizontal label-width="w-[84px]">
          <UiDateTimePicker v-model="fromTs" />
        </UiField>
        <UiField :label="$t('log_query.field_to')" horizontal label-width="w-[84px]">
          <UiDateTimePicker v-model="toTs" />
        </UiField>

        <UiField :label="$t('admin.qr_reject_reason')" :help="$t('admin.qr_reject_reason_hint')">
          <UiTextarea
            v-model="rejectReason"
            :rows="2"
            :placeholder="$t('admin.qr_reject_reason_placeholder')"
          />
        </UiField>

        <template v-if="filterKeys.length">
          <p class="text-xs font-medium text-text-tertiary uppercase tracking-wide pt-1">
            {{ $t('log_query.filters_title') }}
          </p>
          <UiField v-if="filterKeys.includes('action')" :label="$t('log_query.filter_action')" horizontal label-width="w-[84px]">
            <UiSelect v-model="filters.action" :options="actionOptions" :placeholder="$t('log_query.filter_unset')" />
          </UiField>
          <UiField v-if="filterKeys.includes('block_id')" :label="$t('log_query.filter_block_id')" horizontal label-width="w-[84px]">
            <ServerLogFieldSearchInput
              v-model="filters.block_id"
              :server-id="request.target_server_id"
              :category="request.category"
              field="block_id"
              placeholder="minecraft:chest"
            />
          </UiField>
          <UiField v-if="filterKeys.includes('item_id')" :label="$t('log_query.filter_item_id')" horizontal label-width="w-[84px]">
            <ServerLogFieldSearchInput
              v-model="filters.item_id"
              :server-id="request.target_server_id"
              :category="request.category"
              field="item_id"
              placeholder="minecraft:diamond"
            />
          </UiField>
          <UiField v-if="filterKeys.includes('entity_type')" :label="$t('log_query.filter_entity_type')">
            <UiInput v-model="filters.entity_type" placeholder="minecraft:zombie" />
          </UiField>
          <UiField v-if="filterKeys.includes('world')" :label="$t('log_query.filter_world')" horizontal label-width="w-[84px]">
            <UiSelect v-model="filters.world" :options="worldOptions" :placeholder="$t('log_query.filter_unset')" />
          </UiField>
          <UiField v-if="filterKeys.includes('pos_range')" :label="$t('log_query.filter_pos_range')" horizontal label-width="w-[84px]">
            <ServerLogPosRangeField v-model="filters.pos_range" />
          </UiField>
        </template>
      </template>
    </div>

    <template #footer>
      <template v-if="isPending">
        <UiButton variant="ghost" class="text-danger" :loading="busy === 'reject'" @click="doReject">
          {{ $t('admin.qr_reject') }}
        </UiButton>
        <UiButton :loading="busy === 'approve'" @click="doApprove">
          {{ $t('admin.qr_approve') }}
        </UiButton>
      </template>
      <UiButton v-else variant="ghost" @click="onUpdateOpen(false)">{{ $t('actions.close') }}</UiButton>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { LogQueryRequestItem } from '~/types/api'
import {
  filterKeysForCategory, actionValuesForCategory, actionI18nKey, logQueryStatusVariant,
  worldOptionValues, worldI18nKey,
} from '~/composables/useLogCategories'
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

const isPending = computed(() => props.request?.status === 'pending')
const filterKeys = computed(() => filterKeysForCategory(props.request?.category ?? ''))
const actionOptions = computed(() =>
  actionValuesForCategory(props.request?.category ?? '').map(v => ({ value: v, label: t(actionI18nKey(v)) })),
)
const worldOptions = computed(() =>
  worldOptionValues().map(v => ({ value: v, label: t(worldI18nKey(v)) })),
)

const fromTs = ref<number | undefined>(undefined)
const toTs = ref<number | undefined>(undefined)
const filters = reactive<Record<string, string>>({ action: '', block_id: '', item_id: '', entity_type: '', world: '', pos_range: '' })
const rejectReason = ref('')
const busy = ref<'approve' | 'reject' | null>(null)

function formatTime(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleString()
}

// Re-seed the editable overrides from the requester's original values every
// time a (pending) request is opened, so stale edits from a previously
// reviewed request never leak into the next one.
watch(() => props.request, (r) => {
  fromTs.value = r?.from_ts
  toTs.value = r?.to_ts
  rejectReason.value = ''
  const src = (r?.filters ?? {}) as Record<string, string | undefined>
  filters.action = src.action ?? ''
  filters.block_id = src.block_id ?? ''
  filters.item_id = src.item_id ?? ''
  filters.entity_type = src.entity_type ?? ''
  filters.world = src.world ?? ''
  filters.pos_range = src.pos_range ?? ''
}, { immediate: true })

function onUpdateOpen(value: boolean) {
  if (busy.value) return
  emit('update:open', value)
}

async function doApprove() {
  if (!props.request) return
  busy.value = 'approve'
  try {
    const activeFilters: Record<string, string> = {}
    for (const k of filterKeys.value) {
      if (filters[k]) activeFilters[k] = filters[k]
    }
    await useApi(`/api/admin/query-requests/${props.request.id}/approve`, {
      method: 'POST',
      body: {
        from_ts: fromTs.value,
        to_ts: toTs.value,
        filters: activeFilters,
      },
    })
    toast.success(t('admin.qr_approved_toast'))
    emit('update:open', false)
    emit('resolved')
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    busy.value = null
  }
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
    emit('update:open', false)
    emit('resolved')
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    busy.value = null
  }
}
</script>
