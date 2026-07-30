<template>
  <div v-if="vertical" class="text-sm">
    <span class="block text-xs text-text-tertiary mb-1">{{ label }}</span>
    <span class="block"><slot /></span>
  </div>
  <div v-else class="flex items-start gap-3 text-sm">
    <span class="text-xs text-text-tertiary shrink-0 w-[84px] pt-0.5">{{ label }}</span>
    <span class="min-w-0 flex-1"><slot /></span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string, vertical?: boolean }>()
</script>
