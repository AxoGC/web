<template>
  <div>
    <div v-if="!forum && !pendingForum">
      <UiEmpty :message="$t('errors.FORUM_NOT_FOUND')" />
    </div>
    <div v-else>
      <UiCard
        v-if="forum?.banner_url"
        class="mb-6 bg-cover bg-center overflow-hidden"
        :style="{ backgroundImage: `url(${forum.banner_url})` }"
      >
        <!-- Uniform darken: same tone across the whole banner, no gradient. -->
        <div
          class="bg-black/40 backdrop-blur-[2px] p-6 text-white [text-shadow:0_1px_2px_rgb(0_0_0/55%)]"
        >
          <ForumDetailHeaderContent :forum="forum" inverted :auth="auth" />
        </div>
      </UiCard>
      <UiCard v-else padded class="mb-6 bg-brand-soft">
        <ForumDetailHeaderContent :forum="forum" :auth="auth" />
      </UiCard>

      <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div class="flex items-center gap-2">
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
        <div v-if="tagOptions.length > 1" class="flex items-center gap-2">
          <span class="text-sm text-text-secondary whitespace-nowrap">{{ $t('forum.filter_by_tag') }}</span>
          <UiSelect
            :model-value="tagId"
            :options="tagOptions"
            :block="false"
            size="sm"
            class="min-w-32"
            @update:model-value="changeTag"
          />
        </div>
      </div>

      <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <UiSkeleton v-for="i in 6" :key="i" variant="card" :height="120" />
      </div>
      <div v-else-if="!posts?.items?.length">
        <UiEmpty :message="$t('empty.posts')" />
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

interface TagOption {
  id: number
  name: string
  color: string
}

definePageMeta({ layout: 'default' })
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

const slug = computed(() => String(route.params.slug || ''))
const page = computed(() => Number(route.query.page) > 0 ? Number(route.query.page) : 1)
const sort = computed(() => (route.query.sort === 'hot' ? 'hot' : 'latest'))
const tagId = computed(() => Number(route.query.tag) > 0 ? Number(route.query.tag) : 0)

const { data: forum, pending: pendingForum } = await useAsyncData(
  () => `forum.${slug.value}`,
  () => useApi<Forum>(`/api/forums/${slug.value}`),
  { watch: [slug] },
)

useHead(() => ({ title: forum.value?.name || 'Forum' }))

const { data: tagsData } = await useAsyncData(
  () => `forum.tags.${slug.value}`,
  () => useApi<{ items: TagOption[] }>(`/api/forums/${slug.value}/tags`),
  { watch: [slug] },
)

const tagOptions = computed(() => {
  const items = tagsData.value?.items ?? []
  return [
    { value: 0, label: t('forum.filter_all') },
    ...items.map((tag) => ({ value: tag.id, label: tag.name })),
  ]
})

const postsUrl = computed(() => {
  const params = new URLSearchParams({
    page: String(page.value),
    size: '20',
    sort: sort.value,
  })
  if (tagId.value > 0) params.set('tag', String(tagId.value))
  return `/api/forums/${slug.value}/posts?${params.toString()}`
})

const { data: posts, pending, refresh } = await useAsyncData(
  () => `forum.posts.${slug.value}.${page.value}.${sort.value}.${tagId.value}`,
  () => useApi<{ items: PostListItem[], total: number }>(postsUrl.value),
  { watch: [slug, page, sort, tagId] },
)

function changeSort(s: 'latest' | 'hot') {
  router.replace({ query: { ...route.query, sort: s, page: undefined } })
}

function changeTag(value: string | number) {
  const id = Number(value)
  const next = { ...route.query, page: undefined } as Record<string, unknown>
  if (id > 0) next.tag = String(id)
  else delete next.tag
  router.replace({ query: next as Record<string, string | undefined> })
}

function onPage(p: number) {
  router.replace({ query: { ...route.query, page: p } })
  void refresh()
}
</script>
