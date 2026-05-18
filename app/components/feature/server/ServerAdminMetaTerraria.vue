<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
    <UiField :label="$t('admin.meta.world')">
      <UiInput :model-value="readStr('world')" @update:model-value="setStr('world', $event)" />
    </UiField>
    <UiField :label="$t('admin.meta.difficulty')">
      <UiInput :model-value="readStr('difficulty')" @update:model-value="setStr('difficulty', $event)" />
    </UiField>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: Record<string, unknown> }>()
const emit = defineEmits<{ 'update:modelValue': [v: Record<string, unknown>] }>()

function readStr(key: string): string {
  const v = props.modelValue?.[key]
  return typeof v === 'string' ? v : ''
}

function setStr(key: string, val: string) {
  const next = { ...(props.modelValue || {}) }
  if (val) next[key] = val
  else delete next[key]
  emit('update:modelValue', next)
}
</script>
