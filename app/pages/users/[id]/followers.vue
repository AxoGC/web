<template>
  <div class="max-w-2xl mx-auto flex flex-col gap-4">
    <header class="flex items-center gap-3">
      <NuxtLink :to="`/users/${id}`" class="text-text-tertiary hover:text-text-primary">
        <LucideChevronLeft :size="18" />
      </NuxtLink>
      <h1 class="text-xl font-semibold">
        {{ user ? $t('profile.followers_title', { name: user.username }) : '…' }}
      </h1>
    </header>

    <UiCard padded>
      <UiSkeleton v-if="pending" :height="160" />
      <UserList
        v-else
        :items="page?.items ?? []"
        :empty-message="$t('profile.followers_empty')"
      />
    </UiCard>

    <UiPagination
      v-if="page && page.total > 0"
      :page="currentPage"
      :page-size="pageSize"
      :total="page.total"
      @update:page="goPage"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PublicUser, UserListPage } from '~/types/api'

definePageMeta({ layout: 'detail' })

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id))
const pageSize = 20
const currentPage = computed(() => Math.max(1, parseInt(String(route.query.page ?? '1'), 10) || 1))

const { data: user } = await useAsyncData(
  () => `user.${id.value}`,
  () => useApi<PublicUser>(`/api/users/${id.value}`).catch(() => null),
)

const { data: page, pending } = await useAsyncData(
  () => `user.${id.value}.followers.${currentPage.value}`,
  () => useApi<UserListPage>(
    `/api/users/${id.value}/followers?page=${currentPage.value}&size=${pageSize}`,
  ).catch(() => ({ items: [], total: 0, page: currentPage.value, size: pageSize } as UserListPage)),
  { watch: [currentPage] },
)

function goPage(n: number) {
  router.push({ query: { ...route.query, page: String(n) } })
}

useHead(() => ({ title: user.value ? `Followers · ${user.value.username}` : 'Followers' }))
</script>
