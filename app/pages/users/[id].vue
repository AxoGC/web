<template>
  <div>
    <div v-if="error">
      <UiEmpty :message="$t('errors.USER_NOT_FOUND')" />
    </div>
    <template v-else-if="user">
      <div class="flex flex-col md:flex-row items-start gap-6 mb-6">
        <UiAvatar :src="user.avatar" :name="user.username" size="xl" />
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold">{{ user.username }}</h1>
          <p v-if="user.bio" class="text-text-secondary mt-1">{{ user.bio }}</p>
          <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
            <UiTag v-if="user.role && user.role !== 'user'" :variant="user.role === 'admin' ? 'brand' : 'info'">
              {{ user.role }}
            </UiTag>
            <span>· {{ $t('common.today') }} {{ formatDate(user.created_at) }}</span>
          </div>
        </div>
      </div>
    </template>
    <UiSkeleton v-else :height="180" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDate } from '~/utils/format'
import type { PublicUser } from '~/types/api'

definePageMeta({ layout: 'detail' })
const route = useRoute()
const id = computed(() => String(route.params.id))

const { data: user, error } = await useAsyncData(
  () => `user.${id.value}`,
  () => useApi<PublicUser>(`/api/users/${id.value}`),
)

useHead(() => ({ title: user.value?.username || 'User' }))
</script>
