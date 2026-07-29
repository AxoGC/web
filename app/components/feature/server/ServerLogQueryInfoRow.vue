<template>
  <div class="flex items-start gap-3 text-sm">
    <span class="text-xs text-text-tertiary shrink-0 w-[84px] pt-0.5">{{ label }}</span>
    <span class="min-w-0"><slot /></span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
</script>
