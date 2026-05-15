<template>
  <div :class="['relative', block ? 'w-full' : '']">
    <select
      :value="modelValue"
      :disabled="disabled"
      :class="classes"
      @change="onChange"
    >
      <option v-if="placeholder" :value="''" disabled>{{ placeholder }}</option>
      <option
        v-for="opt in options"
        :key="String(opt.value)"
        :value="opt.value"
        :disabled="opt.disabled"
      >
        {{ opt.label }}
      </option>
    </select>
    <LucideChevronDown
      :size="16"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Option {
  value: string | number
  label: string
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue?: string | number
  options: Option[]
  placeholder?: string
  disabled?: boolean
  block?: boolean
  size?: 'sm' | 'md' | 'lg'
  invalid?: boolean
}>(), {
  block: true,
  size: 'md',
})

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLSelectElement).value)
}

const sizeClasses = computed(() => ({
  sm: 'h-8 text-sm pr-8 pl-3',
  md: 'h-10 text-base pr-9 pl-3',
  lg: 'h-12 text-lg pr-10 pl-4',
}[props.size]))

const classes = computed(() => [
  'appearance-none w-full bg-bg-elevated rounded-md transition-colors',
  'border text-text-primary',
  'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-400/30',
  'disabled:bg-bg-overlay disabled:cursor-not-allowed disabled:text-text-disabled',
  props.invalid ? 'border-danger' : 'border-border-default hover:border-border-strong',
  sizeClasses.value,
])
</script>
