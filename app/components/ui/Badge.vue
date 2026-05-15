<template>
  <span
    :class="[
      'inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[11px] font-semibold rounded-full',
      variantClass,
    ]"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'default' | 'success' | 'danger' | 'warning' | 'info' | 'brand'

const props = withDefaults(defineProps<{ variant?: Variant }>(), { variant: 'default' })

const variantClass = computed(() => ({
  default: 'bg-bg-overlay text-text-secondary',
  success: 'bg-success text-white',
  danger:  'bg-danger  text-white',
  warning: 'bg-warning text-white',
  info:    'bg-info    text-white',
  brand:   'bg-brand-500 text-brand-on',
}[props.variant]))
</script>
