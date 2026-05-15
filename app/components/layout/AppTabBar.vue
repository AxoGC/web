<template>
  <nav class="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-bg-elevated/95 backdrop-blur border-t border-border-subtle flex justify-around items-stretch">
    <AppTabBarItem to="/" :label="$t('nav.home')" :icon="LucideHome" />
    <AppTabBarItem to="/forums" :label="$t('nav.forums')" :icon="LucideMessageSquare" />
    <AppTabBarItem to="/servers" :label="$t('nav.servers')" :icon="LucideServer" />
    <AppTabBarItem :to="auth.isLoggedIn ? '/me' : '/login'" :label="$t('nav.me')" :icon="LucideUser" />
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { LucideHome, LucideMessageSquare, LucideServer, LucideUser } from '#components'
const auth = useAuthStore()
</script>
