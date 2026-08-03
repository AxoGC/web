<template>
  <header class="sticky top-0 z-30 border-b border-border-subtle bg-bg-base/90 backdrop-blur supports-backdrop-filter:bg-bg-base/75">
    <div class="mx-auto max-w-page h-16 px-4 lg:px-6 flex items-center gap-4">
      <NuxtLink to="/" class="flex items-center gap-2 shrink-0 text-text-primary">
        <img src="/logo.webp" alt="logo" class="block h-8 w-auto object-contain md:hidden" />
        <span
          class="hidden md:inline-flex items-center italic font-bold text-lg text-[#28abce] whitespace-nowrap select-none"
          aria-label="Axolotland Gaming Club"
        >
          <span>Axo</span>
          <span class="logo-collapse" :class="{ 'is-collapsed': scrolled }" style="--logo-w: 6rem">lotland&nbsp;</span>
          <span>G</span>
          <span class="logo-collapse" :class="{ 'is-collapsed': scrolled }" style="--logo-w: 4.5rem">aming&nbsp;</span>
          <span>C</span>
          <span class="logo-collapse" :class="{ 'is-collapsed': scrolled }" style="--logo-w: 2.5rem">lub</span>
        </span>
      </NuxtLink>

      <nav class="hidden md:flex items-center gap-1 text-sm">
        <AppNavLink to="/">{{ $t('nav.home') }}</AppNavLink>
        <AppNavLink to="/forums">{{ $t('nav.forums') }}</AppNavLink>
        <AppNavLink to="/servers">{{ $t('nav.servers') }}</AppNavLink>
        <AppNavLink to="/donations">{{ $t('nav.donations') }}</AppNavLink>
      </nav>

      <div class="flex-1" />

      <form class="hidden sm:flex relative w-64 lg:w-80" @submit.prevent="onSearch">
        <UiInput
          v-model="searchQ"
          :placeholder="$t('search.placeholder')"
          :leading-icon="LucideSearch"
          size="sm"
        />
      </form>

      <UiTooltip :label="$t('theme.title')">
        <button
          class="p-2 rounded-md hover:bg-bg-hover text-text-secondary"
          @click="cycleTheme"
        >
          <LucideSun v-if="theme.resolved.value === 'light'" :size="18" />
          <LucideMoon v-else :size="18" />
        </button>
      </UiTooltip>

      <UiDropdown align="end">
        <template #trigger>
          <button class="p-2 rounded-md hover:bg-bg-hover text-text-secondary" :aria-label="$t('lang.title')">
            <LucideLanguages :size="18" />
          </button>
        </template>
        <UiDropdownItem v-for="l in availableLocales" :key="l.code" @select="switchLocale(l.code)">
          <span class="text-xs text-text-tertiary mr-2">{{ l.code }}</span>
          <span>{{ l.name }}</span>
        </UiDropdownItem>
      </UiDropdown>

      <!-- ClientOnly: SSR always runs anonymous (no cookies forwarded, see
           useApi's rawFetch), so the server can never know the real auth
           state. Letting the v-if/v-else below hydrate against a
           server-rendered "logged out" DOM while the client's auth store is
           already populated by plugins/auth.client.ts's awaited bootstrap()
           produced a hydration mismatch severe enough that Vue left BOTH
           branches mounted (avatar dropdown AND the login/register links,
           at once) instead of cleanly swapping. ClientOnly sidesteps that by
           not hydrating this block at all — it discards the fallback and
           mounts fresh on the client, where auth state is already correct. -->
      <ClientOnly>
        <template v-if="auth.isLoggedIn">
          <UiDropdown align="end">
            <template #trigger>
              <button class="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60">
                <UiAvatar :src="auth.user?.avatar" :name="auth.user?.username" size="sm" />
              </button>
            </template>
            <div class="px-2.5 py-2 text-xs text-text-tertiary border-b border-border-subtle mb-1">
              <div class="text-sm text-text-primary font-medium">{{ auth.user?.username }}</div>
              <div>{{ auth.user?.email }}</div>
            </div>
            <UiDropdownItem @select="navigate('/me')">
              <LucideUser :size="14" /> {{ $t('nav.me') }}
            </UiDropdownItem>
            <UiDropdownItem @select="navigate('/me/settings')">
              <LucideSettings :size="14" /> {{ $t('nav.settings') }}
            </UiDropdownItem>
            <UiDropdownItem @select="navigate('/points')">
              <LucideCoins :size="14" /> {{ $t('nav.points') }}
            </UiDropdownItem>
            <UiDropdownItem v-if="auth.isAdmin" @select="navigate('/admin')">
              <LucideShieldCheck :size="14" /> {{ $t('nav.admin') }}
            </UiDropdownItem>
            <UiDropdownItem danger @select="doLogout">
              <LucideLogOut :size="14" /> {{ $t('nav.logout') }}
            </UiDropdownItem>
          </UiDropdown>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="hidden sm:inline-flex">
            <UiButton variant="ghost" size="sm">{{ $t('nav.login') }}</UiButton>
          </NuxtLink>
          <NuxtLink to="/register" class="inline-flex">
            <UiButton variant="primary" size="sm">{{ $t('nav.register') }}</UiButton>
          </NuxtLink>
        </template>
        <template #fallback>
          <NuxtLink to="/login" class="hidden sm:inline-flex">
            <UiButton variant="ghost" size="sm">{{ $t('nav.login') }}</UiButton>
          </NuxtLink>
          <NuxtLink to="/register" class="inline-flex">
            <UiButton variant="primary" size="sm">{{ $t('nav.register') }}</UiButton>
          </NuxtLink>
        </template>
      </ClientOnly>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useTheme } from '~/composables/useTheme'
import { useToast } from '~/composables/useToast'
import { LucideSearch } from '#components'

const auth = useAuthStore()
const theme = useTheme()
const router = useRouter()
const { t } = useI18n()
const { locales, setLocale } = useI18n()
const toast = useToast()

const searchQ = ref('')

// Drives the AxoGC letter-collapse animation on the desktop text logo.
const scrolled = ref(false)
function updateScrolled() {
  scrolled.value = window.scrollY > 4
}
onMounted(() => {
  updateScrolled()
  window.addEventListener('scroll', updateScrolled, { passive: true })
})
onUnmounted(() => {
  window.removeEventListener('scroll', updateScrolled)
})

function onSearch() {
  const q = searchQ.value.trim()
  if (q.length < 2) return
  router.push({ path: '/search', query: { q } })
}

function navigate(p: string) {
  router.push(p)
}

async function doLogout() {
  await auth.logout()
  toast.success(t('auth.logged_out'))
  router.push('/')
}

function cycleTheme() {
  const order = ['system', 'light', 'dark'] as const
  const idx = order.indexOf(theme.mode.value)
  theme.set(order[(idx + 1) % order.length]!)
}

const availableLocales = computed(() =>
  (locales.value as Array<{ code: string, name?: string }>).map((l) => ({ code: l.code, name: l.name || l.code })),
)

async function switchLocale(code: string) {
  await setLocale(code as never)
}
</script>

<style scoped>
.logo-collapse {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  max-width: var(--logo-w);
  opacity: 1;
  transition: max-width 0.35s ease, opacity 0.3s ease;
}
.logo-collapse.is-collapsed {
  max-width: 0;
  opacity: 0;
}
</style>
