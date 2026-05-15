<template>
  <span :class="classes" :style="customStyle">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand'

const props = withDefaults(defineProps<{
  variant?: Variant
  color?: string
  size?: 'sm' | 'md'
}>(), {
  variant: 'default',
  size: 'sm',
})

const variantClasses: Record<Variant, string> = {
  default: 'bg-bg-overlay text-text-secondary border border-border-default',
  success: 'bg-success-soft text-success border border-success/30',
  warning: 'bg-warning-soft text-warning border border-warning/30',
  danger:  'bg-danger-soft  text-danger  border border-danger/30',
  info:    'bg-info-soft    text-info    border border-info/30',
  brand:   'bg-brand-soft   text-brand-400 border border-brand-500/30',
}

const sizeClasses = computed(() => (props.size === 'md' ? 'h-7 px-3 text-sm' : 'h-6 px-2 text-xs'))

const classes = computed(() => [
  'inline-flex items-center gap-1 rounded-md font-medium select-none whitespace-nowrap',
  sizeClasses.value,
  props.color ? '' : variantClasses[props.variant],
])

const customStyle = computed(() => {
  if (!props.color) return undefined
  return {
    color: props.color,
    backgroundColor: `color-mix(in srgb, ${props.color} 14%, transparent)`,
    border: `1px solid color-mix(in srgb, ${props.color} 40%, transparent)`,
  }
})
</script>
