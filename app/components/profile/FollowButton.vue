<template>
  <UiButton
    :variant="isFollowing ? 'secondary' : 'primary'"
    :loading="busy"
    size="sm"
    @click="toggle"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <template #leading>
      <LucideUserCheck v-if="isFollowing" :size="14" />
      <LucideUserPlus v-else :size="14" />
    </template>
    {{ label }}
  </UiButton>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ApiError } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{
  userId: number
  isFollowing: boolean
  followerCount: number
  followingCount: number
}>()

const emit = defineEmits<{
  change: [v: { is_following: boolean; follower_count: number; following_count: number }]
}>()

const { t } = useI18n()
const toast = useToast()
const auth = useAuthStore()
const busy = ref(false)
const hover = ref(false)

const label = computed(() => {
  if (props.isFollowing) return hover.value ? t('profile.unfollow_action') : t('profile.unfollow')
  return t('profile.follow')
})

async function toggle() {
  if (!auth.isLoggedIn) {
    toast.error(t('profile.follow_required_login'))
    return
  }
  busy.value = true
  try {
    const method = props.isFollowing ? 'DELETE' : 'POST'
    const r = await useApi<{
      is_following: boolean
      follower_count: number
      following_count: number
    }>(`/api/users/${props.userId}/follow`, { method })
    emit('change', {
      is_following: r.is_following,
      follower_count: r.follower_count,
      following_count: r.following_count,
    })
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
    else toast.error(t('errors.UNKNOWN'))
  } finally {
    busy.value = false
  }
}
</script>
