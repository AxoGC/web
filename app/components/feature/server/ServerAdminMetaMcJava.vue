<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
    <UiField :label="$t('admin.meta.motd')">
      <UiInput :model-value="readStr('motd')" @update:model-value="setStr('motd', $event)" />
    </UiField>
    <UiField :label="$t('admin.meta.bluemap_url')">
      <UiInput
        :model-value="readStr('bluemap_url')"
        placeholder="https://map.example.com"
        @update:model-value="setStr('bluemap_url', $event)"
      />
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

// Writes back a new object — Vue can see the change. Empty strings drop the
// key entirely so we don't leave `motd: ""` in the serialized payload.
function setStr(key: string, val: string) {
  const next = { ...(props.modelValue || {}) }
  if (val) next[key] = val
  else delete next[key]
  emit('update:modelValue', next)
}
</script>
