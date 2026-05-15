<template>
  <div class="min-h-dvh flex flex-col bg-bg-base">
    <AppHeader class="hidden md:flex md:block" />
    <header class="md:hidden sticky top-0 z-30 h-12 px-2 flex items-center gap-2 bg-bg-base/95 backdrop-blur border-b border-border-subtle">
      <button class="p-2 rounded-md hover:bg-bg-hover" :aria-label="$t('actions.back')" @click="goBack">
        <LucideChevronLeft :size="20" />
      </button>
      <h1 v-if="$slots.title" class="text-base font-semibold truncate"><slot name="title" /></h1>
      <div class="flex-1" />
      <slot name="header-trailing" />
    </header>
    <main class="flex-1 mx-auto w-full max-w-[1080px] px-4 lg:px-6 py-6 pb-20 md:pb-12">
      <slot />
    </main>
    <!-- detail layout hides tab bar on mobile for immersion (plan §5.5.1 C) -->
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
function goBack() {
  if (history.length > 1) router.back()
  else router.push('/')
}
</script>
