<template>
  <section
    class="relative rounded-xl overflow-hidden border border-border-subtle bg-bg-elevated"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <div class="relative w-full" :style="{ aspectRatio: '21 / 9' }">
      <div
        class="absolute inset-0 flex transition-transform duration-500 ease-out"
        :style="{ transform: `translateX(-${index * 100}%)` }"
      >
        <NuxtLink
          v-for="slide in slides"
          :key="slide.id"
          :to="slide.link_url || '#'"
          :target="isExternal(slide.link_url) ? '_blank' : undefined"
          :rel="isExternal(slide.link_url) ? 'noopener' : undefined"
          class="relative block w-full shrink-0 overflow-hidden bg-bg-overlay"
          :tabindex="slide.link_url ? 0 : -1"
        >
          <img
            :src="slide.image_url"
            :alt="slide.caption"
            class="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            decoding="async"
          >
          <!-- Left-to-right dark gradient gives the caption text a readable backdrop without hiding the photo. -->
          <div class="absolute inset-0 bg-black/30" />
          <div class="absolute inset-0 flex items-end md:items-center p-6 md:p-12">
            <div class="max-w-xl text-white drop-shadow-md flex flex-col gap-3">
              <p class="text-base md:text-2xl font-medium whitespace-pre-line wrap-break-word leading-snug">
                {{ slide.caption }}
              </p>
              <div v-if="slide.link_url">
                <UiButton variant="primary" size="sm">
                  {{ t('home.learn_more') }}
                  <template #trailing><LucideArrowRight :size="14" /></template>
                </UiButton>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>

      <button
        v-if="slides.length > 1"
        type="button"
        class="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-bg-overlay/80 backdrop-blur-sm grid place-items-center text-text-primary hover:bg-bg-overlay focus:outline-none"
        :aria-label="t('home.carousel_prev')"
        @click="go(-1)"
      >
        <LucideChevronLeft :size="18" />
      </button>
      <button
        v-if="slides.length > 1"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-bg-overlay/80 backdrop-blur-sm grid place-items-center text-text-primary hover:bg-bg-overlay focus:outline-none"
        :aria-label="t('home.carousel_next')"
        @click="go(1)"
      >
        <LucideChevronRight :size="18" />
      </button>
    </div>

    <div
      v-if="slides.length > 1"
      class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2"
    >
      <button
        v-for="(s, i) in slides"
        :key="s.id"
        type="button"
        :class="[
          'rounded-full transition-all',
          i === index ? 'w-6 h-2 bg-brand-500' : 'w-2 h-2 bg-bg-overlay/80',
        ]"
        :aria-label="t('home.carousel_goto', { n: i + 1 })"
        @click="index = i"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Carousel } from '~/types/api'

const props = defineProps<{
  slides: Carousel[]
}>()

const { t } = useI18n()

const index = ref(0)
const paused = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const total = computed(() => props.slides.length)

function go(delta: number) {
  if (total.value === 0) return
  index.value = (index.value + delta + total.value) % total.value
}

function start() {
  stop()
  if (total.value <= 1) return
  timer = setInterval(() => {
    if (!paused.value) go(1)
  }, 5000)
}

function stop() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function isExternal(url?: string) {
  if (!url) return false
  return /^https?:\/\//i.test(url)
}

watch(() => props.slides, () => {
  index.value = 0
  start()
})

onMounted(start)
onBeforeUnmount(stop)
</script>
