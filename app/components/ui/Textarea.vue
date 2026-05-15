<template>
  <textarea
    :id="id"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :rows="rows"
    :class="classes"
    @input="onInput"
    @blur="$emit('blur', $event)"
    @focus="$emit('focus', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  invalid?: boolean
  rows?: number
  id?: string
}>(), {
  rows: 5,
  invalid: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}

const classes = computed(() => [
  'block w-full bg-bg-elevated rounded-md transition-colors px-3 py-2 text-base',
  'border placeholder:text-text-tertiary text-text-primary resize-y',
  'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30',
  'disabled:bg-bg-overlay disabled:cursor-not-allowed disabled:text-text-disabled',
  props.invalid ? 'border-danger' : 'border-border-default hover:border-border-strong',
])
</script>
