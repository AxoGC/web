<template>
  <component
    :is="clickable && src && !broken ? 'button' : 'span'"
    :type="clickable && src && !broken ? 'button' : undefined"
    :class="[
      'inline-flex shrink-0 items-center justify-center select-none overflow-hidden rounded-full',
      sizeClass,
      clickable && src && !broken ? 'cursor-zoom-in hover:ring-2 hover:ring-brand-400/40 transition' : '',
    ]"
    :style="(!src || broken) ? { background: bg } : undefined"
    :aria-label="clickable && src && !broken ? (alt || name || 'avatar') : undefined"
    @click="onClick"
  >
    <img
      v-if="src && !broken"
      :src="src"
      :alt="alt || name || 'avatar'"
      class="w-full h-full object-cover pointer-events-none"
      loading="lazy"
      @error="broken = true"
    >
    <span v-else :class="['font-semibold text-white', textSize]">{{ initialsText }}</span>
  </component>

  <UiModal
    v-if="clickable"
    :open="zoomOpen"
    size="sm"
    @update:open="zoomOpen = $event"
  >
    <div class="flex justify-center">
      <!-- blobstore stores avatars at a fixed small size; popping the same
           file at 320 is the practical ceiling before it goes soft. -->
      <img
        :src="src"
        :alt="alt || name || 'avatar'"
        class="rounded-md w-80 h-80 object-cover"
      >
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { initials, colorForName } from '~/utils/format'

const props = withDefaults(defineProps<{
  src?: string
  name?: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** When true and an image is present, clicking pops a modal that renders
   *  the same file at a larger size. No new asset is fetched. */
  clickable?: boolean
}>(), {
  size: 'md',
  clickable: false,
})

const zoomOpen = ref(false)
function onClick() {
  if (props.clickable && props.src && !broken.value) zoomOpen.value = true
}

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
