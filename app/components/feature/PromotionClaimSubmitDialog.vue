<template>
  <UiModal :open="open" :title="$t('promotion.dialog_title')" size="xl" @update:open="onUpdateOpen">
    <UiField
      :label="$t('promotion.field_description')"
      :help="$t('promotion.field_description_placeholder')"
      required
      :error="descErr"
    >
      <RichEditor
        v-model="descDoc"
        @update:text="descText = $event"
      />
    </UiField>

    <template #footer>
      <UiButton variant="ghost" @click="onUpdateOpen(false)">{{ $t('actions.cancel') }}</UiButton>
      <UiButton :loading="submitting" :disabled="!canSubmit" @click="submit">
        {{ $t('promotion.submit_button') }}
      </UiButton>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PromotionClaimItem } from '~/types/api'
import { emptyDoc, isEmptyDoc } from '~/utils/tiptap'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'submitted': [item: PromotionClaimItem]
}>()

const { t } = useI18n()
const toast = useToast()

const descDoc = ref(emptyDoc())
const descText = ref('')
const submitting = ref(false)
const descErr = ref('')

const canSubmit = computed(() => !isEmptyDoc(descDoc.value) && !submitting.value)

// Reset on every open so a cancelled draft never lingers into the next submission.
watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  descDoc.value = emptyDoc()
  descText.value = ''
  descErr.value = ''
})

function onUpdateOpen(value: boolean) {
  if (submitting.value) return
  emit('update:open', value)
}

async function submit() {
  descErr.value = ''
  if (isEmptyDoc(descDoc.value)) {
    descErr.value = t('promotion.error_description_required')
    return
  }
  submitting.value = true
  try {
    const item = await useApi<PromotionClaimItem>('/api/promotion-claims', {
      method: 'POST',
      body: {
        description_json: descDoc.value,
        description_text: descText.value,
      },
    })
    toast.success(t('promotion.submit_success'))
    emit('update:open', false)
    emit('submitted', item)
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
  } finally {
    submitting.value = false
  }
}
</script>
