<template>
  <NuxtLink
    :to="to"
    :class="[
      'flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
      isActive ? 'text-brand-500' : 'text-text-tertiary',
    ]"
  >
    <component :is="icon" :size="20" />
    <span>{{ label }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'

const props = defineProps<{ to: string, label: string, icon: Component }>()
const route = useRoute()
const isActive = computed(() => {
  if (props.to === '/') return route.path === '/'
  return route.path === props.to || route.path.startsWith(props.to + '/')
})
</script>
