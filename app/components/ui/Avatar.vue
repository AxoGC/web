<template>
  <span
    :class="[
      'inline-flex shrink-0 items-center justify-center select-none overflow-hidden rounded-full',
      sizeClass,
    ]"
    :style="(!src || broken) ? { background: bg } : undefined"
  >
    <img
      v-if="src && !broken"
      :src="src"
      :alt="alt || name || 'avatar'"
      class="w-full h-full object-cover"
      loading="lazy"
      @error="broken = true"
    >
    <span v-else :class="['font-semibold text-white', textSize]">{{ initialsText }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { initials, colorForName } from '~/utils/format'

const props = withDefaults(defineProps<{
  src?: string
  name?: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>(), {
  size: 'md',
})

const broken = ref(false)

const sizeClass = computed(() => ({
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-20 h-20',
}[props.size]))

const textSize = computed(() => ({
  xs: 'text-[10px]',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
  xl: 'text-2xl',
}[props.size]))

const bg = computed(() => colorForName(props.name || ''))
const initialsText = computed(() => initials(props.name || '?'))
</script>
