<template>
  <component
    :is="as"
    :class="[
      'bg-bg-elevated rounded-lg overflow-hidden transition-colors',
      bordered ? 'border border-border-subtle' : '',
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
  bordered?: boolean
}>(), {
  as: 'div',
  hoverable: false,
  padded: false,
  bordered: false,
})
</script>
