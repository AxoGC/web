<template>
  <div :class="['mb-4', horizontal ? 'flex items-start gap-3' : '']">
    <UiLabel v-if="label" :html-for="forId" :required="required" :horizontal="horizontal" :label-width="labelWidth">{{ label }}</UiLabel>
    <div :class="horizontal ? 'flex-1 min-w-0' : ''">
      <slot />
      <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
      <p v-else-if="help" class="mt-1 text-xs text-text-tertiary">{{ help }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  error?: string
  help?: string
  required?: boolean
  forId?: string
  // Opt-in per-field: label sits left of the value instead of above it, on
  // every screen size. Default stays false so the ~17 existing UiField call
  // sites are unaffected.
  horizontal?: boolean
  // Tailwind width class for the label column when horizontal. Per-field so
  // call sites with shorter labels aren't stuck with the default's spacing.
  labelWidth?: string
}>()
</script>
