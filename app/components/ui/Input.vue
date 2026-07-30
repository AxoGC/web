<template>
  <div :class="['relative', block ? 'w-full' : '']">
    <component
      :is="leadingIcon"
      v-if="leadingIcon"
      :size="16"
      class="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
    />
    <input
      :id="id"
      ref="inputEl"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :class="inputClasses"
      @input="onInput"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    >
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: string | number
  type?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  invalid?: boolean
  block?: boolean
  size?: 'sm' | 'md' | 'lg'
  id?: string
  autocomplete?: string
  inputmode?: 'text' | 'email' | 'numeric' | 'tel' | 'url' | 'search' | 'decimal'
  leadingIcon?: Component
}>(), {
  type: 'text',
  size: 'md',
  block: true,
  invalid: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

const inputEl = ref<HTMLInputElement | null>(null)

defineExpose({
  focus: () => inputEl.value?.focus(),
})

const sizeClasses = computed(() => ({
  sm: 'h-8 text-sm',
  md: 'h-10 text-base',
  lg: 'h-12 text-lg',
}[props.size]))

const padX = computed(() => (props.leadingIcon ? 'pl-9 pr-3' : 'px-3'))

const inputClasses = computed(() => [
  'block w-full bg-bg-elevated rounded-md transition-colors',
  'border placeholder:text-text-tertiary text-text-primary',
  'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30',
  'disabled:bg-bg-overlay disabled:cursor-not-allowed disabled:text-text-disabled',
  props.invalid ? 'border-danger' : 'border-border-default hover:border-border-strong',
  sizeClasses.value,
  padX.value,
])
</script>
