<template>
  <UiEmpty v-if="!items.length" :message="emptyMessage" />
  <ul v-else class="divide-y divide-border-subtle">
    <li v-for="u in items" :key="u.id">
      <NuxtLink
        :to="`/users/${u.id}`"
        class="flex items-center gap-3 py-3 hover:bg-bg-hover px-2 -mx-2 rounded-md transition-colors"
      >
        <UiAvatar :src="u.avatar" :name="u.username" size="md" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium truncate">{{ u.username }}</span>
            <UiTag
              v-if="u.role && u.role !== 'user'"
              :variant="u.role === 'admin' ? 'brand' : 'info'"
              size="sm"
            >
              {{ u.role }}
            </UiTag>
          </div>
        </div>
      </NuxtLink>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { UserSummary } from '~/types/api'

defineProps<{
  items: UserSummary[]
  emptyMessage: string
}>()
</script>
