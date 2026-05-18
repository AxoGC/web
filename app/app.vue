<template>
  <div>
    <!-- @vite-pwa/nuxt doesn't auto-inject the manifest link tag — this
         component is the official way to add it via useHead. -->
    <VitePwaManifest />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppToastViewport />
  </div>
</template>

<script setup lang="ts">
// Apply theme as early as possible on client to prevent FOUC.
import { onMounted } from 'vue'
import { useTheme } from '~/composables/useTheme'
import { useAuthStore } from '~/stores/auth'

const theme = useTheme()
onMounted(() => {
  theme.init()
  // Try to restore session on first paint.
  const auth = useAuthStore()
  auth.bootstrap()
})
</script>
