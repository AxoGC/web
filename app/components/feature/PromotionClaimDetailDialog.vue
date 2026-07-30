<template>
  <UiModal :open="open" :title="$t('promotion.detail_title')" size="xl" @update:open="onUpdateOpen">
    <div v-if="claim" class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        <PromotionClaimInfoRow :label="$t('promotion.col_user')">
          <span class="font-medium">{{ claim.username || `#${claim.user_id}` }}</span>
        </PromotionClaimInfoRow>
        <PromotionClaimInfoRow :label="$t('promotion.col_status')">
          <UiTag :variant="statusVariant(claim.status)" size="sm">
            {{ $t(`promotion.status_${claim.status}`) }}
          </UiTag>
        </PromotionClaimInfoRow>
        <PromotionClaimInfoRow :label="$t('promotion.col_points')">
          <span class="font-medium">+{{ claim.points }}</span>
        </PromotionClaimInfoRow>
        <PromotionClaimInfoRow :label="$t('promotion.col_created_at')">
          {{ formatAuditTimestamp(new Date(claim.created_at * 1000)) }}
        </PromotionClaimInfoRow>
      </div>

      <PromotionClaimInfoRow :label="$t('promotion.field_description')" vertical>
        <RichContent :doc="claim.description_json" />
      </PromotionClaimInfoRow>

      <PromotionClaimInfoRow v-if="claim.status === 'revoked' && claim.revoke_reason" :label="$t('promotion.revoke_reason')">
        <span class="whitespace-pre-wrap">{{ claim.revoke_reason }}</span>
      </PromotionClaimInfoRow>

      <template v-if="auth.isAdmin && claim.status === 'granted'">
        <div class="pt-3 border-t border-border-subtle space-y-3">
          <p class="text-xs font-medium text-text-tertiary uppercase tracking-wide">
            {{ $t('promotion.revoke_section_title') }}
          </p>
          <UiField :label="$t('promotion.revoke_reason')">
            <UiTextarea
              v-model="revokeReason"
              :rows="2"
              :placeholder="$t('promotion.revoke_reason_placeholder')"
            />
          </UiField>
          <UiField :label="$t('promotion.revoke_penalty')">
            <UiInput
              v-model.number="revokePenalty"
              type="number"
              min="0"
              :placeholder="$t('promotion.revoke_penalty_placeholder')"
            />
          </UiField>
        </div>
      </template>
    </div>

    <template #footer>
      <UiButton
        v-if="auth.isAdmin"
        variant="ghost"
        class="text-danger"
        @click="confirmDeleteOpen = true"
      >
        {{ $t('actions.delete') }}
      </UiButton>
      <UiButton
        v-if="auth.isAdmin"
        variant="ghost"
        @click="pointsDialogOpen = true"
      >
        {{ $t('promotion.correct_points_button') }}
      </UiButton>
      <UiButton
        v-if="auth.isAdmin && claim?.status === 'granted'"
        variant="ghost"
        class="text-danger"
        @click="confirmRevokeOpen = true"
      >
        {{ $t('promotion.revoke_button') }}
      </UiButton>
      <UiButton variant="ghost" @click="onUpdateOpen(false)">{{ $t('actions.close') }}</UiButton>
    </template>
  </UiModal>

  <UiConfirmModal
    :open="confirmDeleteOpen"
    :title="$t('actions.delete')"
    :message="$t('promotion.delete_confirm')"
    variant="danger"
    :loading="deleting"
    @update:open="confirmDeleteOpen = $event"
    @confirm="doDelete"
  />

  <UiConfirmModal
    :open="confirmRevokeOpen"
    :title="$t('promotion.revoke_confirm_title')"
    :message="revokeConfirmMessage"
    variant="danger"
    :loading="revoking"
    @update:open="confirmRevokeOpen = $event"
    @confirm="doRevoke"
  />

  <AdminPointsCorrectionDialog
    v-model:open="pointsDialogOpen"
    :user-id="claim?.user_id ?? null"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PromotionClaimItem, PromotionClaimStatus } from '~/types/api'
import { useAuthStore } from '~/stores/auth'
import { useAuditTime } from '~/composables/useAuditTime'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

const props = defineProps<{ open: boolean, claim: PromotionClaimItem | null }>()
const emit = defineEmits<{ 'update:open': [value: boolean], 'revoked': [id: number], 'deleted': [id: number] }>()

const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()
const { formatAuditTimestamp } = useAuditTime()

const revokeReason = ref('')
const revokePenalty = ref<number | undefined>(undefined)
const revoking = ref(false)
const confirmRevokeOpen = ref(false)

const confirmDeleteOpen = ref(false)
const deleting = ref(false)

const pointsDialogOpen = ref(false)

watch(() => props.claim?.id, () => {
  revokeReason.value = ''
  revokePenalty.value = undefined
  confirmDeleteOpen.value = false
  confirmRevokeOpen.value = false
  pointsDialogOpen.value = false
})

const revokeConfirmMessage = computed(() => {
  if (!props.claim) return ''
  const penalty = revokePenalty.value && revokePenalty.value > 0 ? Math.floor(revokePenalty.value) : 0
  return t('promotion.revoke_confirm_message', {
    points: props.claim.points,
    penalty: penalty > 0
      ? t('promotion.revoke_confirm_penalty_part', { penalty })
      : t('promotion.revoke_confirm_no_penalty_part'),
    reason: revokeReason.value.trim() || t('promotion.revoke_confirm_no_reason'),
  })
})

function statusVariant(status: PromotionClaimStatus) {
  return status === 'granted' ? 'success' : 'danger'
}

function onUpdateOpen(value: boolean) {
  if (revoking.value) return
  emit('update:open', value)
}

async function doRevoke() {
  if (!props.claim) return
  revoking.value = true
  try {
    await useApi(`/api/admin/promotion-claims/${props.claim.id}/revoke`, {
      method: 'POST',
      body: {
        reason: revokeReason.value.trim(),
        penalty: revokePenalty.value && revokePenalty.value > 0 ? Math.floor(revokePenalty.value) : 0,
      },
    })
    toast.success(t('promotion.revoked_toast'))
    confirmRevokeOpen.value = false
    emit('update:open', false)
    emit('revoked', props.claim.id)
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    revoking.value = false
  }
}

async function doDelete() {
  if (!props.claim) return
  deleting.value = true
  try {
    await useApi(`/api/admin/promotion-claims/${props.claim.id}`, { method: 'DELETE' })
    toast.success(t('promotion.deleted_toast'))
    confirmDeleteOpen.value = false
    emit('update:open', false)
    emit('deleted', props.claim.id)
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    deleting.value = false
  }
}
</script>
