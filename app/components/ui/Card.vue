<template>
  <component
    :is="as"
    :class="[
      'overflow-hidden transition-colors',
      flat ? '' : 'bg-bg-elevated rounded-lg',
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
  /** Drops the own background + rounded corners, inheriting the ancestor's instead. */
  flat?: boolean
}>(), {
  as: 'div',
  hoverable: false,
  padded: false,
  bordered: false,
  flat: false,
})
</script>
