<template>
  <NuxtLink
    :to="to"
    :class="[
      'inline-flex items-center h-9 px-3 rounded-md text-sm transition-colors',
      isActive
        ? 'text-brand-500 font-semibold'
        : 'text-text-secondary font-medium hover:text-text-primary hover:bg-bg-hover',
    ]"
  >
    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ to: string }>()
const route = useRoute()
const isActive = computed(() => {
  if (props.to === '/') return route.path === '/'
  return route.path === props.to || route.path.startsWith(props.to + '/')
})
</script>
