<template>
  <div class="flex flex-col items-center justify-center py-12 text-center select-none">
    <div class="w-16 h-16 rounded-full bg-bg-overlay flex items-center justify-center text-text-tertiary mb-4">
      <slot name="icon">
        <LucideInbox :size="28" />
      </slot>
    </div>
    <p class="text-text-secondary text-base">
      <slot>{{ message || $t('empty.default') }}</slot>
    </p>
    <p v-if="$slots.description" class="mt-1 text-sm text-text-tertiary max-w-md">
      <slot name="description" />
    </p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ message?: string }>()
</script>
