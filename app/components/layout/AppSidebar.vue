<template>
  <aside class="hidden md:block sticky top-16 self-start w-60 shrink-0 h-[calc(100vh-4rem)] overflow-y-auto py-6 pr-6 border-r border-border-subtle">
    <div v-if="loading" class="space-y-2">
      <UiSkeleton variant="line" />
      <UiSkeleton variant="line" />
      <UiSkeleton variant="line" />
    </div>
    <slot />
  </aside>
</template>

<script setup lang="ts">
defineProps<{ loading?: boolean }>()
</script>
