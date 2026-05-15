<template>
  <NuxtLink
    :to="to"
    :class="[
      'inline-flex items-center h-9 px-3 rounded-md text-sm font-medium transition-colors',
      isActive
        ? 'text-text-primary bg-bg-overlay'
        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
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
