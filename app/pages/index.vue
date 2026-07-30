<template>
  <div class="px-4 lg:px-6 py-6 pb-20 md:pb-12 space-y-10">
    <!-- Hero / Carousel -->
    <HomeCarousel v-if="slides.length > 0" :slides="slides" />
    <section
      v-else
      class="rounded-xl bg-gradient-to-br from-brand-soft/40 via-bg-elevated to-bg-elevated border border-border-subtle p-8 md:p-12"
    >
      <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
        {{ $t('home.hero_title') }}
      </h1>
      <p class="mt-3 max-w-2xl text-base text-text-secondary">
        {{ $t('home.hero_subtitle') }}
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <NuxtLink to="/servers">
          <UiButton variant="primary">
            <template #leading><LucideServer :size="16" /></template>
            {{ $t('nav.servers') }}
          </UiButton>
        </NuxtLink>
        <NuxtLink to="/forums">
          <UiButton variant="secondary">
            <template #leading><LucideMessageSquare :size="16" /></template>
            {{ $t('nav.forums') }}
          </UiButton>
        </NuxtLink>
      </div>
    </section>

    <!-- Live servers -->
    <section>
      <header class="flex items-end justify-between mb-4">
        <h2 class="text-xl font-semibold">{{ $t('home.online_servers') }}</h2>
        <NuxtLink to="/servers" class="text-sm text-brand-400 hover:text-brand-500">{{ $t('home.view_all') }} →</NuxtLink>
      </header>
      <div v-if="serversPending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <UiSkeleton v-for="i in 6" :key="i" variant="card" :height="120" />
      </div>
      <div v-else-if="!servers?.items?.length">
        <UiEmpty :message="$t('empty.servers')" />
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ServerCard v-for="s in topServers" :key="s.id" :server="s" />
      </div>
    </section>

    <!-- Community map -->
    <HomeCommunityMap />

    <!-- Curated one-liners carousel -->
    <HomeOneliners />

    <!-- QQ communities -->
    <HomeQqGroups />

    <!-- Hot threads -->
    <section>
      <header class="flex items-end justify-between mb-4">
        <h2 class="text-xl font-semibold">{{ $t('home.hot_posts') }}</h2>
        <NuxtLink to="/forums" class="text-sm text-brand-400 hover:text-brand-500">{{ $t('home.view_all') }} →</NuxtLink>
      </header>
      <div v-if="forumsPending" class="space-y-2">
        <UiSkeleton v-for="i in 4" :key="i" variant="line" :height="64" />
      </div>
      <div v-else-if="!hotForum">
        <UiEmpty :message="$t('empty.posts')" />
      </div>
      <UiCard v-else>
        <ul class="divide-y divide-border-subtle">
          <li v-for="p in hotPosts || []" :key="p.id" class="px-5 py-3">
            <NuxtLink :to="`/posts/${p.id}`" class="flex flex-col md:flex-row md:items-center md:gap-4">
              <span class="text-text-primary font-medium hover:text-brand-400 flex-1 truncate">{{ p.title }}</span>
              <span class="text-xs text-text-tertiary flex gap-3 mt-1 md:mt-0 shrink-0">
                <span>{{ p.author?.username || '—' }}</span>
                <span class="inline-flex items-center gap-1"><LucideMessageCircle :size="12" />{{ p.comment_count }}</span>
                <span class="inline-flex items-center gap-1"><LucideEye :size="12" />{{ p.view_count }}</span>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </UiCard>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Carousel, ServerSummary } from '~/types/api'
import type { Forum, PostListItem } from '~/types/api'

definePageMeta({ layout: 'default' })

useHead({ title: 'Home' })

const { data: carouselResp } = await useAsyncData('home.carousels', () =>
  useApi<{ items: Carousel[] }>('/api/carousels').catch(() => ({ items: [] as Carousel[] })),
)
const slides = computed<Carousel[]>(() => carouselResp.value?.items ?? [])

const { data: servers, pending: serversPending } = await useAsyncData('home.servers', () =>
  useApi<{ items: ServerSummary[] }>('/api/servers'),
)

const { data: forums, pending: forumsPending } = await useAsyncData('home.forums', () =>
  useApi<{ items: Forum[] }>('/api/forums'),
)

// Pull a few posts from the first available forum as the "hot" sampler — backend
// doesn't yet expose a global hot endpoint; this gives the page something real to show.
const hotForum = computed(() => forums.value?.items?.[0])
const { data: hotPosts } = await useAsyncData(
  'home.hotposts',
  async () => {
    if (!hotForum.value) return [] as PostListItem[]
    const r = await useApi<{ items: PostListItem[] }>(`/api/forums/${hotForum.value.slug}/posts?page=1&size=6&sort=hot`)
    return r.items
  },
  { watch: [hotForum] },
)

const topServers = computed(() => (servers.value?.items || []).slice(0, 6))
</script>
