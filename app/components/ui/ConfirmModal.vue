<template>
  <UiModal :open="open" :title="title" @update:open="onClose">
    <p class="text-text-secondary">{{ message }}</p>
    <slot />
    <template #footer>
      <UiButton variant="ghost" @click="onClose(false)">
        {{ cancelText || $t('actions.cancel') }}
      </UiButton>
      <UiButton :variant="variant === 'danger' ? 'danger' : 'primary'" :loading="loading" @click="onConfirm">
        {{ confirmText || $t('actions.confirm') }}
      </UiButton>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'primary' | 'danger'
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()

function onClose(_v?: boolean) {
  if (props.loading) return
  emit('update:open', false)
}
function onConfirm() {
  emit('confirm')
}
</script>
