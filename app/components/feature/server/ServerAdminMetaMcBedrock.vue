<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
    <UiField :label="$t('admin.meta.bluemap_url')">
      <UiInput
        :model-value="readStr('bluemap_url')"
        placeholder="https://map.example.com"
        @update:model-value="setStr('bluemap_url', $event)"
      />
    </UiField>
    <UiField :label="$t('admin.meta.world_name')">
      <UiInput :model-value="readStr('world_name')" @update:model-value="setStr('world_name', $event)" />
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
