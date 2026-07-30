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

const theme = useTheme()
onMounted(() => {
  theme.init()
})
// Session restore now happens in plugins/auth.client.ts, awaited before the
// first route's middleware runs — see that file for why it can't live here.
</script>
