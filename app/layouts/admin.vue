<template>
  <div class="min-h-dvh flex flex-col bg-bg-base">
    <header class="sticky top-0 z-30 h-14 border-b border-border-subtle bg-bg-elevated flex items-center px-4">
      <NuxtLink to="/admin" class="flex items-center gap-2 font-bold text-text-primary mr-6">
        <span class="inline-block w-7 h-7 rounded-md bg-brand-500 grid place-items-center">
          <LucideShieldCheck :size="16" class="text-brand-on" />
        </span>
        <span>{{ $t('nav.admin') }}</span>
      </NuxtLink>
      <div class="flex-1" />
      <UiDropdown align="end">
        <template #trigger>
          <button class="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60">
            <UiAvatar :src="auth.user?.avatar" :name="auth.user?.username" size="sm" />
          </button>
        </template>
        <UiDropdownItem @select="goSite">
          <LucideExternalLink :size="14" /> {{ $t('nav.home') }}
        </UiDropdownItem>
        <UiDropdownItem danger @select="doLogout">
          <LucideLogOut :size="14" /> {{ $t('nav.logout') }}
        </UiDropdownItem>
      </UiDropdown>
    </header>
    <div v-if="mobileWarn" class="md:hidden flex-1 grid place-items-center text-text-secondary px-8 text-center">
      <div>
        <LucideMonitor :size="48" class="mx-auto mb-4 text-text-tertiary" />
        <p>{{ $t('admin.mobile_unsupported') }}</p>
      </div>
    </div>
    <div v-else class="flex-1 hidden md:flex">
      <aside class="w-60 shrink-0 border-r border-border-subtle py-4 px-2 space-y-0.5">
        <AdminNavLink to="/admin" :label="$t('admin.dashboard')" :icon="LucideLayoutDashboard" />
        <AdminNavLink to="/admin/users" :label="$t('admin.users')" :icon="LucideUsers" />
        <AdminNavLink to="/admin/servers" :label="$t('admin.servers')" :icon="LucideServer" />
        <AdminNavLink to="/admin/forums" :label="$t('admin.forums')" :icon="LucideMessageSquare" />
        <AdminNavLink to="/admin/tags" :label="$t('admin.tags')" :icon="LucideTag" />
        <AdminNavLink to="/admin/carousels" :label="$t('admin.carousels')" :icon="LucideImages" />
        <AdminNavLink to="/admin/donations" :label="$t('admin.donations')" :icon="LucideHeart" />
        <AdminNavLink to="/admin/logs" :label="$t('admin.logs')" :icon="LucideScroll" />
        <AdminNavLink to="/admin/audit" :label="$t('admin.audit')" :icon="LucideSearchCheck" />
        <AdminNavLink to="/admin/config" :label="$t('admin.config')" :icon="LucideSettings" />
      </aside>
      <main class="flex-1 px-6 py-6 overflow-x-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import {
  LucideLayoutDashboard, LucideUsers, LucideServer, LucideMessageSquare,
  LucideHeart, LucideScroll, LucideSettings, LucideSearchCheck, LucideImages,
  LucideTag,
} from '#components'

const auth = useAuthStore()
const router = useRouter()
const mobileWarn = ref(false)

onMounted(() => {
  mobileWarn.value = window.matchMedia('(max-width: 767.98px)').matches
})

async function doLogout() {
  await auth.logout()
  router.push('/')
}
function goSite() { router.push('/') }
</script>
