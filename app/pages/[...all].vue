<template>
  <div class="text-center py-12">
    <div class="text-7xl font-black text-text-tertiary select-none mb-6">404</div>
    <h1 class="text-2xl font-bold mb-2">{{ $t('page.not_found_title') }}</h1>
    <p class="text-text-secondary max-w-md mx-auto">{{ $t('page.not_found_subtitle') }}</p>
    <NuxtLink to="/" class="inline-block mt-6">
      <UiButton variant="primary">
        <template #leading><LucideHome :size="16" /></template>
        {{ $t('page.go_home') }}
      </UiButton>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', ssr: false })
useHead({ title: 'Not found' })
</script>
