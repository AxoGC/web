<template>
  <div class="grid grid-cols-[1.5rem_1fr_1fr] items-center gap-x-2 gap-y-2">
    <span class="text-xs text-text-tertiary">X</span>
    <UiInput v-model="local.xMin" type="number" :placeholder="$t('log_query.pos_min')" />
    <UiInput v-model="local.xMax" type="number" :placeholder="$t('log_query.pos_max')" />
    <span class="text-xs text-text-tertiary">Y</span>
    <UiInput v-model="local.yMin" type="number" :placeholder="$t('log_query.pos_min')" />
    <UiInput v-model="local.yMax" type="number" :placeholder="$t('log_query.pos_max')" />
    <span class="text-xs text-text-tertiary">Z</span>
    <UiInput v-model="local.zMin" type="number" :placeholder="$t('log_query.pos_min')" />
    <UiInput v-model="local.zMax" type="number" :placeholder="$t('log_query.pos_max')" />
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

// Wire shape is [[xMin,xMax],[yMin,yMax],[zMin,zMax]] — grouped by axis, not
// by corner point, so each row here maps 1:1 onto one array entry with no
// transposition and no "which point is the min corner" ambiguity.
const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const local = reactive({ xMin: '', xMax: '', yMin: '', yMax: '', zMin: '', zMax: '' })

function clear() {
  local.xMin = local.xMax = local.yMin = local.yMax = local.zMin = local.zMax = ''
}

// Re-hydrate only on an *external* reset to empty (e.g. category change
// clearing this filter) — our own edits below already keep modelValue in
// sync, so re-parsing on every emitted update would just be redundant.
watch(() => props.modelValue, (v) => {
  if (!v) clear()
})

watch(local, () => {
  const nums = [local.xMin, local.xMax, local.yMin, local.yMax, local.zMin, local.zMax]
  if (nums.some(n => n === '')) {
    emit('update:modelValue', '')
    return
  }
  const [xMin, xMax, yMin, yMax, zMin, zMax] = nums.map(Number)
  emit('update:modelValue', JSON.stringify([[xMin, xMax], [yMin, yMax], [zMin, zMax]]))
})
</script>
