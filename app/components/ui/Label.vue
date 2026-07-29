<template>
  <label
    :for="htmlFor"
    :class="[
      'block mb-1.5 text-sm font-medium',
      required ? 'after:content-[\'*\'] after:ml-1 after:text-danger' : '',
      'text-text-secondary',
      horizontal ? [labelWidth ?? 'w-36', 'shrink-0 pt-2 mb-0'] : '',
    ]"
  >
    <slot />
  </label>
</template>

<script setup lang="ts">
defineProps<{ htmlFor?: string, required?: boolean, horizontal?: boolean, labelWidth?: string }>()
</script>
