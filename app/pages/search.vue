<template>
  <div class="px-4 lg:px-6 py-6 pb-20 md:pb-12">
    <header class="mb-6">
      <h1 class="text-2xl font-bold">{{ $t('nav.search') }}</h1>
      <form class="mt-4 flex gap-2" @submit.prevent="onSubmit">
        <UiInput v-model="qInput" :placeholder="$t('search.placeholder')" :leading-icon="LucideSearch" />
        <UiButton type="submit">{{ $t('actions.search') }}</UiButton>
      </form>
      <div class="mt-3 flex gap-1">
        <button
          v-for="t in (['all','post','user','server'] as const)"
          :key="t"
          :class="[
            'px-3 h-8 rounded-md text-sm font-medium transition-colors',
            type === t ? 'bg-bg-overlay text-text-primary' : 'text-text-secondary hover:bg-bg-hover',
          ]"
          @click="setType(t)"
        >
          {{ $t(`search.type_${t}`) }}
        </button>
      </div>
    </header>

    <div v-if="!q">
      <UiEmpty :message="$t('search.placeholder')" />
    </div>
    <div v-else-if="pending">
      <UiSkeleton v-for="i in 4" :key="i" :height="56" class="mb-2" />
    </div>
    <div v-else-if="!hasResults">
      <UiEmpty :message="$t('search.no_results')" />
    </div>
    <div v-else class="space-y-8">
      <section v-if="data?.posts?.length">
        <h2 class="text-sm font-semibold uppercase text-text-tertiary mb-3">{{ $t('search.type_post') }}</h2>
        <ul class="space-y-2">
          <li v-for="p in data.posts" :key="`p${p.id}`">
            <NuxtLink :to="`/posts/${p.id}`" class="flex items-center gap-3 p-3 bg-bg-elevated border border-border-subtle rounded-md hover:border-border-default">
              <LucideMessageSquare :size="16" class="text-text-tertiary" />
              <span class="flex-1 truncate">{{ p.title }}</span>
              <span class="text-xs text-text-tertiary">{{ p.author?.username }}</span>
            </NuxtLink>
          </li>
        </ul>
      </section>
      <section v-if="data?.users?.length">
        <h2 class="text-sm font-semibold uppercase text-text-tertiary mb-3">{{ $t('search.type_user') }}</h2>
        <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <li v-for="u in data.users" :key="`u${u.id}`">
            <NuxtLink :to="`/users/${u.id}`" class="flex items-center gap-3 p-3 bg-bg-elevated border border-border-subtle rounded-md hover:border-border-default">
              <UiAvatar :src="u.avatar" :name="u.username" size="sm" />
              <span class="truncate">{{ u.username }}</span>
            </NuxtLink>
          </li>
        </ul>
      </section>
      <section v-if="data?.servers?.length">
        <h2 class="text-sm font-semibold uppercase text-text-tertiary mb-3">{{ $t('search.type_server') }}</h2>
        <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <li v-for="s in data.servers" :key="`s${s.id}`">
            <NuxtLink :to="`/servers/${s.id}`" class="flex items-center gap-3 p-3 bg-bg-elevated border border-border-subtle rounded-md hover:border-border-default">
              <LucideServer :size="16" class="text-text-tertiary" />
              <span class="flex-1 truncate">{{ s.name }}</span>
              <span class="text-xs text-text-tertiary">{{ typeLabel(s.type) }}</span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SearchResults } from '~/types/api'
import { LucideSearch } from '#components'

definePageMeta({ layout: 'default', ssr: false })
const route = useRoute()
const typeLabel = useServerTypeLabel()
const router = useRouter()

const qInput = ref(String(route.query.q || ''))
const q = computed(() => String(route.query.q || ''))
const type = computed(() => {
  const t = String(route.query.type || 'all')
  return ['all', 'post', 'user', 'server'].includes(t) ? t : 'all'
})

useHead({ title: 'Search' })

const { data, pending } = await useAsyncData(
  () => `search.${q.value}.${type.value}`,
  async () => {
    if (!q.value || q.value.length < 2) return null
    const t = type.value === 'all' ? '' : `&type=${type.value}`
    return useApi<SearchResults>(`/api/search?q=${encodeURIComponent(q.value)}${t}`)
  },
  { watch: [q, type] },
)

const hasResults = computed(() => {
  const d = data.value
  return !!(d?.posts?.length || d?.users?.length || d?.servers?.length)
})

function onSubmit() {
  const v = qInput.value.trim()
  if (v.length < 2) return
  router.replace({ query: { ...route.query, q: v } })
}

function setType(t: 'all' | 'post' | 'user' | 'server') {
  router.replace({ query: { ...route.query, type: t === 'all' ? undefined : t } })
}
</script>
