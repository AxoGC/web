<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ $t('forum.list_title') }}</h1>

    <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <!-- Main column: forum cards -->
      <div>
        <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UiSkeleton v-for="i in 4" :key="i" variant="card" :height="140" />
        </div>
        <div v-else-if="!data?.items?.length">
          <UiEmpty :message="$t('empty.posts')" />
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NuxtLink
            v-for="f in data.items"
            :key="f.id"
            :to="`/forums/${f.slug}`"
            class="block group"
          >
            <UiCard
              v-if="f.banner_url"
              class="bg-cover bg-center"
              :style="{ backgroundImage: `url(${f.banner_url})` }"
            >
              <div
                class="bg-linear-to-t from-black/70 via-black/40 to-black/25 group-hover:from-black/55 group-hover:via-black/25 group-hover:to-black/10 backdrop-blur-[2px] group-hover:backdrop-blur-none transition duration-300 min-h-36 p-5 text-white [text-shadow:0_1px_2px_rgb(0_0_0/55%)]"
              >
                <ForumCardBody :forum="f" inverted />
              </div>
            </UiCard>
            <UiCard v-else hoverable padded>
              <ForumCardBody :forum="f" />
            </UiCard>
          </NuxtLink>
        </div>
      </div>

      <!-- Right rail -->
      <aside class="space-y-4">
        <ForumRailHotLatest />
        <ForumRailActiveUsers />
        <ForumRailHotTags />
        <ForumRailSiteStats />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Forum } from '~/types/api'

definePageMeta({ layout: 'default' })
useHead({ title: 'Forums' })

const { data, pending } = await useAsyncData('forums.list', () =>
  useApi<{ items: Forum[] }>('/api/forums'),
)
</script>
