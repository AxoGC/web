<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="classes"
    @click="$emit('click', $event)"
  >
    <LucideLoader v-if="loading" :size="iconSize" class="animate-spin" />
    <slot v-else name="leading" />
    <span v-if="$slots.default" class="inline-flex items-center"><slot /></span>
    <slot name="trailing" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  variant?: Variant
  size?: Size
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  block?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  block: false,
})

defineEmits<{ click: [event: MouseEvent] }>()

const iconSize = computed(() => (props.size === 'sm' ? 14 : props.size === 'lg' ? 18 : 16))

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-md',
  md: 'h-10 px-4 text-base gap-2 rounded-md',
  lg: 'h-12 px-6 text-lg gap-2 rounded-md',
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-brand-on hover:bg-brand-400 active:bg-brand-600 disabled:bg-brand-500/40 disabled:cursor-not-allowed',
  secondary:
    'bg-bg-overlay text-text-primary hover:bg-bg-hover border border-border-default disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'text-text-primary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed',
  outline:
    'border border-border-strong text-text-primary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'bg-danger text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
}

const classes = computed(() => [
  'inline-flex items-center justify-center font-medium transition-colors select-none whitespace-nowrap shrink-0',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-0',
  sizeClasses[props.size],
  variantClasses[props.variant],
  props.block ? 'w-full' : '',
])
</script>
