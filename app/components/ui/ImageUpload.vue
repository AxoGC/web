<template>
  <div>
    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      class="hidden"
      @change="onPick"
    >
    <div
      :class="[
        'relative rounded-md border border-dashed border-border-default bg-bg-elevated',
        'flex items-center justify-center cursor-pointer overflow-hidden',
        'hover:border-brand-400 transition-colors',
        dragging ? 'border-brand-500 bg-brand-soft/40' : '',
      ]"
      :style="{ aspectRatio: aspectRatio }"
      @click="openPicker"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <img
        v-if="previewSrc"
        :src="previewSrc"
        class="absolute inset-0 w-full h-full object-cover"
        :alt="alt"
      >
      <div v-else class="flex flex-col items-center gap-2 text-text-tertiary text-sm px-4 text-center">
        <LucideImagePlus :size="32" />
        <span>{{ placeholder ?? t('upload.click_or_drop') }}</span>
        <span v-if="hint" class="text-xs">{{ hint }}</span>
      </div>
      <button
        v-if="previewSrc && allowClear"
        type="button"
        class="absolute top-2 right-2 rounded-full bg-bg-overlay/80 backdrop-blur-sm w-7 h-7 grid place-items-center hover:bg-bg-overlay text-text-primary"
        @click.stop="clear"
      >
        <LucideX :size="14" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useToast } from '~/composables/useToast'

const props = withDefaults(defineProps<{
  file?: File | null
  /** Pre-existing image URL to show when no file is selected. */
  previewUrl?: string
  accept?: string
  maxSizeMb?: number
  aspectRatio?: string
  placeholder?: string
  hint?: string
  alt?: string
  allowClear?: boolean
}>(), {
  accept: 'image/jpeg,image/png,image/webp,image/gif',
  maxSizeMb: 5,
  aspectRatio: '16 / 9',
  allowClear: true,
  alt: '',
})

const emit = defineEmits<{
  'update:file': [v: File | null]
}>()

const { t } = useI18n()
const toast = useToast()

const inputRef = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const objectUrl = ref<string | null>(null)

const previewSrc = computed(() => objectUrl.value ?? props.previewUrl ?? '')

watch(() => props.file, (f) => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = null
  }
  if (f) objectUrl.value = URL.createObjectURL(f)
})

onBeforeUnmount(() => {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
})

function openPicker() {
  inputRef.value?.click()
}

function accepted(file: File): boolean {
  if (file.size > props.maxSizeMb * 1024 * 1024) {
    toast.error(t('upload.too_large', { mb: props.maxSizeMb }))
    return false
  }
  if (!file.type.startsWith('image/')) {
    toast.error(t('upload.bad_type'))
    return false
  }
  return true
}

function onPick(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0] ?? null
  target.value = '' // allow re-selecting the same file
  if (!file) return
  if (!accepted(file)) return
  emit('update:file', file)
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  if (!accepted(file)) return
  emit('update:file', file)
}

function clear() {
  emit('update:file', null)
}
</script>
