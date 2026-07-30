<template>
  <div class="px-4 lg:px-6 py-6 pb-20 md:pb-12">
    <div v-if="auth.user" class="space-y-6">
      <UiCard padded>
        <div class="flex flex-col md:flex-row items-start gap-6">
          <UiAvatar :src="auth.user.avatar" :name="auth.user.username" size="xl" />
          <div class="flex-1 min-w-0">
            <h1 class="text-2xl font-bold">{{ auth.user.username }}</h1>
            <p class="text-sm text-text-tertiary">{{ auth.user.email }}</p>
            <p v-if="auth.user.bio" class="mt-2 text-text-secondary">{{ auth.user.bio }}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <UiTag v-if="auth.user.role !== 'user'" :variant="auth.user.role === 'admin' ? 'brand' : 'info'">
                {{ auth.user.role }}
              </UiTag>
            </div>
          </div>
        </div>
      </UiCard>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NuxtLink to="/me/checkin">
          <UiCard hoverable padded>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-md bg-brand-soft text-brand-400 grid place-items-center">
                <LucideCalendarCheck :size="20" />
              </div>
              <div>
                <p class="font-semibold">{{ $t('checkin.title') }}</p>
                <p class="text-xs text-text-tertiary">{{ $t('checkin.calendar') }}</p>
              </div>
            </div>
          </UiCard>
        </NuxtLink>
        <NuxtLink to="/me/bindings">
          <UiCard hoverable padded>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-md bg-brand-soft text-brand-400 grid place-items-center">
                <LucideLink :size="20" />
              </div>
              <div>
                <p class="font-semibold">{{ $t('nav.bindings') }}</p>
                <p class="text-xs text-text-tertiary">{{ $t('server.bind_title') }}</p>
              </div>
            </div>
          </UiCard>
        </NuxtLink>
        <NuxtLink to="/me/likes">
          <UiCard hoverable padded>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-md bg-brand-soft text-brand-400 grid place-items-center">
                <LucideHeart :size="20" />
              </div>
              <div>
                <p class="font-semibold">{{ $t('me.likes_title') }}</p>
                <p class="text-xs text-text-tertiary">{{ $t('me.likes_subtitle') }}</p>
              </div>
            </div>
          </UiCard>
        </NuxtLink>
        <NuxtLink to="/me/settings">
          <UiCard hoverable padded>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-md bg-brand-soft text-brand-400 grid place-items-center">
                <LucideSettings :size="20" />
              </div>
              <div>
                <p class="font-semibold">{{ $t('nav.settings') }}</p>
                <p class="text-xs text-text-tertiary">{{ $t('me.edit_profile') }}</p>
              </div>
            </div>
          </UiCard>
        </NuxtLink>
      </div>
    </div>
    <UiSkeleton v-else :height="120" />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
definePageMeta({ layout: 'default', middleware: ['auth'], ssr: false })
const auth = useAuthStore()
useHead({ title: 'Me' })
</script>
