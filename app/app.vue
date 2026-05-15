<template>
  <div>
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
