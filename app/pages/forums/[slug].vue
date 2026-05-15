<template>
  <div>
    <div v-if="!forum && !pendingForum">
      <UiEmpty :message="$t('errors.FORUM_NOT_FOUND')" />
    </div>
    <div v-else>
      <header class="flex items-start gap-3 mb-6">
        <NuxtLink to="/forums" class="text-text-tertiary hover:text-text-primary mt-1.5">
          <LucideChevronLeft :size="20" />
        </NuxtLink>
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold truncate">{{ forum?.name || '…' }}</h1>
          <p v-if="forum?.description" class="text-text-secondary mt-1 text-sm">{{ forum.description }}</p>
        </div>
        <NuxtLink :to="forum ? `/posts/new?forum_id=${forum.id}` : '#'">
          <UiButton variant="primary" size="sm" :disabled="!auth.isLoggedIn">
            <template #leading><LucidePlus :size="16" /></template>
            {{ $t('forum.new_post') }}
          </UiButton>
        </NuxtLink>
      </header>

      <div class="flex items-center gap-2 mb-4">
        <button
          v-for="s in (['latest','hot'] as const)"
          :key="s"
          :class="[
            'px-3 h-8 rounded-md text-sm font-medium transition-colors',
            sort === s ? 'bg-bg-overlay text-text-primary' : 'text-text-secondary hover:bg-bg-hover',
          ]"
          @click="changeSort(s)"
        >
          {{ s === 'latest' ? $t('forum.sort_latest') : $t('forum.sort_hot') }}
        </button>
      </div>

      <div v-if="pending" class="space-y-3">
        <UiSkeleton v-for="i in 6" :key="i" variant="card" :height="86" />
      </div>
      <div v-else-if="!posts?.items?.length">
        <UiEmpty :message="$t('empty.posts')" />
      </div>
      <div v-else class="space-y-3">
        <PostCard v-for="p in posts.items" :key="p.id" :post="p" />
      </div>

      <div class="mt-6">
        <UiPagination
          v-if="posts"
          :page="page"
          :page-size="20"
          :total="posts.total || 0"
          @update:page="onPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Forum, PostListItem } from '~/types/api'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'default' })
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const slug = computed(() => String(route.params.slug || ''))
const page = computed(() => Number(route.query.page) > 0 ? Number(route.query.page) : 1)
const sort = computed(() => (route.query.sort === 'hot' ? 'hot' : 'latest'))

const { data: forum, pending: pendingForum } = await useAsyncData(
  () => `forum.${slug.value}`,
  () => useApi<Forum>(`/api/forums/${slug.value}`),
  { watch: [slug] },
)

useHead(() => ({ title: forum.value?.name || 'Forum' }))

const { data: posts, pending, refresh } = await useAsyncData(
  () => `forum.posts.${slug.value}.${page.value}.${sort.value}`,
  () => useApi<{ items: PostListItem[], total: number }>(
    `/api/forums/${slug.value}/posts?page=${page.value}&size=20&sort=${sort.value}`,
  ),
  { watch: [slug, page, sort] },
)

function changeSort(s: 'latest' | 'hot') {
  router.replace({ query: { ...route.query, sort: s, page: undefined } })
}

function onPage(p: number) {
  router.replace({ query: { ...route.query, page: p } })
  void refresh()
}
</script>
