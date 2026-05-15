<template>
  <NuxtLink
    :to="to"
    :class="[
      'flex items-center gap-2 h-9 px-3 rounded-md text-sm transition-colors',
      isActive
        ? 'bg-brand-soft text-brand-400'
        : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
    ]"
  >
    <component :is="icon" :size="16" />
    <span>{{ label }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'

const props = defineProps<{ to: string, label: string, icon: Component }>()
const route = useRoute()
const isActive = computed(() => {
  if (props.to === '/admin') return route.path === '/admin'
  return route.path === props.to || route.path.startsWith(props.to + '/')
})
</script>
