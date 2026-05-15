<template>
  <div :class="['relative overflow-hidden bg-bg-overlay animate-pulse', shape, customClass]" :style="style" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'line' | 'block' | 'card' | 'circle'
  width?: string | number
  height?: string | number
  customClass?: string
}>(), {
  variant: 'line',
})

const shape = computed(() => ({
  line: 'rounded-md h-4',
  block: 'rounded-md',
  card: 'rounded-lg',
  circle: 'rounded-full',
}[props.variant]))

const style = computed(() => {
  const s: Record<string, string> = {}
  if (props.width != null) s.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  if (props.height != null) s.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  return s
})
</script>
