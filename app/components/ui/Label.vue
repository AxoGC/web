<template>
  <label :for="htmlFor" :class="['block mb-1.5 text-sm font-medium', required ? 'after:content-[\'*\'] after:ml-1 after:text-danger' : '', 'text-text-secondary']">
    <slot />
  </label>
</template>

<script setup lang="ts">
defineProps<{ htmlFor?: string, required?: boolean }>()
</script>
