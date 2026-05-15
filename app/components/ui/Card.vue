<template>
  <component
    :is="as"
    :class="[
      'bg-bg-elevated border border-border-subtle rounded-lg overflow-hidden transition-colors',
      hoverable ? 'hover:border-border-default hover:bg-bg-overlay/40 cursor-pointer' : '',
      padded ? 'p-5' : '',
    ]"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  as?: string
  hoverable?: boolean
  padded?: boolean
}>(), {
  as: 'div',
  hoverable: false,
  padded: false,
})
</script>
