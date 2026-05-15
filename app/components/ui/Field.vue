<template>
  <div class="mb-4">
    <UiLabel v-if="label" :html-for="forId" :required="required">{{ label }}</UiLabel>
    <slot />
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
    <p v-else-if="help" class="mt-1 text-xs text-text-tertiary">{{ help }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  error?: string
  help?: string
  required?: boolean
  forId?: string
}>()
</script>
