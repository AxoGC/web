<template>
  <UiModal :open="open" :title="$t('admin.points_correction_title')" size="sm" @update:open="onUpdateOpen">
    <div v-if="loadingUser" class="py-6">
      <UiSkeleton :height="16" />
    </div>
    <div v-else-if="current" class="space-y-4">
      <p class="text-sm text-text-secondary">
        {{ $t('admin.points_correction_current', { username: current.username, point: current.point }) }}
      </p>
      <UiField :label="$t('admin.points_correction_new_value')">
        <UiInput v-model.number="point" type="number" min="0" />
      </UiField>
      <UiField :label="$t('admin.points_correction_reason')">
        <UiTextarea
          v-model="reason"
          :rows="2"
          :placeholder="$t('admin.points_correction_reason_placeholder')"
        />
      </UiField>
    </div>

    <template #footer>
      <UiButton variant="ghost" @click="onUpdateOpen(false)">{{ $t('actions.cancel') }}</UiButton>
      <UiButton
        variant="primary"
        :disabled="!current || point < 0 || point === current.point"
        @click="confirmOpen = true"
      >
        {{ $t('actions.confirm') }}
      </UiButton>
    </template>
  </UiModal>

  <UiConfirmModal
    :open="confirmOpen"
    :title="$t('admin.points_correction_title')"
    :message="confirmMessage"
    :loading="submitting"
    @update:open="confirmOpen = $event"
    @confirm="submit"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { MeDTO } from '~/stores/auth'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

const props = defineProps<{
  open: boolean
  userId: number | null
}>()
const emit = defineEmits<{
  'update:open': [boolean]
  corrected: [MeDTO]
}>()

const { t } = useI18n()
const toast = useToast()

const current = ref<MeDTO | null>(null)
const loadingUser = ref(false)
const point = ref(0)
const reason = ref('')
const confirmOpen = ref(false)
const submitting = ref(false)

// Always re-fetches on open rather than trusting a caller-supplied balance —
// callers only have list-page or claim-record data, both of which can be
// stale by the time an admin opens this dialog.
watch(() => props.open, async (isOpen) => {
  if (!isOpen || !props.userId) return
  reason.value = ''
  confirmOpen.value = false
  current.value = null
  loadingUser.value = true
  try {
    current.value = await useApi<MeDTO>(`/api/admin/users/${props.userId}`)
    point.value = current.value.point
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
    emit('update:open', false)
  } finally {
    loadingUser.value = false
  }
})

const confirmMessage = computed(() => {
  if (!current.value) return ''
  const delta = point.value - current.value.point
  return t('admin.points_correction_confirm_message', {
    username: current.value.username,
    before: current.value.point,
    after: point.value,
    delta: delta > 0 ? `+${delta}` : String(delta),
    reason: reason.value.trim() || t('admin.points_correction_no_reason'),
  })
})

function onUpdateOpen(v: boolean) {
  if (submitting.value) return
  emit('update:open', v)
}

async function submit() {
  if (!props.userId || !current.value) return
  submitting.value = true
  try {
    const r = await useApi<MeDTO>(`/api/admin/users/${props.userId}/points-correction`, {
      method: 'POST',
      body: { point: point.value, reason: reason.value.trim() },
    })
    toast.success(t('actions.save'))
    confirmOpen.value = false
    emit('corrected', r)
    emit('update:open', false)
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    submitting.value = false
  }
}
</script>
