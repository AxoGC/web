<template>
  <div class="px-4 lg:px-6 py-6 pb-20 md:pb-12">
    <h1 class="text-2xl mb-6">{{ $t('me.likes_title') }}</h1>

    <div v-if="pending && !items.length" class="space-y-3">
      <UiSkeleton v-for="i in 5" :key="i" :height="72" />
    </div>
    <UiEmpty v-else-if="!items.length" :message="$t('empty.likes')" />
    <ul v-else class="space-y-3">
      <li v-for="p in items" :key="p.id"
        class="bg-bg-elevated border border-border-subtle rounded-lg p-4 hover:bg-bg-overlay transition">
        <NuxtLink :to="`/posts/${p.id}`" class="block">
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 text-xs text-text-tertiary mb-1">
                <LucideHash :size="12" />{{ p.forum.name }}
                <span>·</span>
                <span>{{ formatDate(p.liked_at) }}</span>
              </div>
              <h3 class="truncate">{{ p.title }}</h3>
              <div class="mt-2 flex items-center gap-3 text-xs text-text-tertiary">
                <span class="flex items-center gap-1"><UiAvatar :src="p.author.avatar" :name="p.author.username" size="xs" /> {{ p.author.username }}</span>
                <span class="flex items-center gap-1"><LucideEye :size="12" />{{ p.view_count }}</span>
                <span class="flex items-center gap-1"><LucideMessageCircle :size="12" />{{ p.comment_count }}</span>
                <span class="flex items-center gap-1"><LucideHeart :size="12" />{{ p.like_count }}</span>
              </div>
            </div>
          </div>
        </NuxtLink>
      </li>
    </ul>

    <UiPagination
      v-if="total > size"
      :page="page"
      :page-size="size"
      :total="total"
      class="mt-6"
      @update:page="page = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatDate } from '~/utils/format'
import type { LikedPostItem } from '~/types/api'

definePageMeta({ layout: 'default', middleware: ['auth'], ssr: false })
useHead({ title: 'Likes' })

const page = ref(1)
const size = 20
const items = ref<LikedPostItem[]>([])
const total = ref(0)
const pending = ref(false)

async function load() {
  pending.value = true
  try {
    const r = await useApi<{ items: LikedPostItem[], total: number }>(
      `/api/me/likes?page=${page.value}&size=${size}`,
    )
    items.value = r.items
    total.value = r.total
  } finally {
    pending.value = false
  }
}

watch(page, load, { immediate: true })
</script>
