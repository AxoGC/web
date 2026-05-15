<template>
  <span class="inline-flex items-center gap-1.5">
    <span :class="['inline-block w-2 h-2 rounded-full', dotClass, animated ? 'animate-pulse' : '']" />
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  status: 'online' | 'offline' | 'maintenance'
  animated?: boolean
}>(), {
  animated: true,
})

const dotClass = computed(() => ({
  online:      'bg-success shadow-[0_0_0_3px_color-mix(in_srgb,var(--success)_25%,transparent)]',
  offline:     'bg-text-tertiary',
  maintenance: 'bg-warning',
}[props.status]))
</script>
