<template>
  <DialogRoot :open="open" @update:open="onUpdate">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] data-[state=open]:animate-fadein" />
      <DialogContent
        :class="[
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          widthClass,
          'max-h-[88vh] overflow-auto',
          'bg-bg-elevated border border-border-default rounded-xl shadow-lg',
          'p-6 data-[state=open]:animate-popin focus:outline-none',
        ]"
      >
        <div v-if="$slots.title || title" class="flex items-start justify-between gap-4 mb-3">
          <DialogTitle as="h2" class="text-xl font-semibold text-text-primary">
            <slot name="title">{{ title }}</slot>
          </DialogTitle>
          <DialogClose
            class="text-text-tertiary hover:text-text-primary p-1 rounded-md hover:bg-bg-hover"
            aria-label="close"
          >
            <LucideX :size="18" />
          </DialogClose>
        </div>
        <DialogDescription v-if="description" class="text-sm text-text-secondary mb-4">
          {{ description }}
        </DialogDescription>
        <div class="text-text-primary">
          <slot />
        </div>
        <div v-if="$slots.footer" class="mt-6 flex items-center justify-end gap-2">
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'

const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>(), { size: 'md' })

const widthClass = computed(() => ({
  sm: 'w-[min(94vw,24rem)]',
  md: 'w-[min(94vw,32rem)]',
  lg: 'w-[min(94vw,42rem)]',
  xl: 'w-[min(94vw,56rem)]',
}[props.size]))

const emit = defineEmits<{ 'update:open': [value: boolean] }>()

function onUpdate(value: boolean) {
  emit('update:open', value)
}
</script>

<style scoped>
@keyframes fadein {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes popin {
  from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
  to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
.animate-fadein { animation: fadein 160ms ease-out; }
.animate-popin  { animation: popin  180ms ease-out; }
</style>
