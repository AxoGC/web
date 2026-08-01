<template>
  <UiCard padded>
    <h1 class="text-2xl mb-6">{{ $t('auth.register_verify_title') }}</h1>

    <UiEmpty v-if="!token" :message="$t('auth.register_verify_token_missing')" />

    <p v-else-if="pending" class="text-sm text-text-secondary">{{ $t('auth.register_verify_pending') }}</p>

    <p v-else-if="failed" class="text-sm text-text-secondary">{{ failed }}</p>

    <p class="mt-4 text-sm text-text-secondary text-center">
      <NuxtLink to="/register" class="text-brand-400 hover:underline">{{ $t('auth.switch_to_register') }}</NuxtLink>
    </p>
  </UiCard>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'
import { ApiError } from '~/composables/useApi'

definePageMeta({ layout: 'auth', ssr: false })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const token = computed(() => String(route.query.token || ''))
const pending = ref(true)
const failed = ref('')

onMounted(async () => {
  if (!token.value) {
    pending.value = false
    return
  }
  try {
    await auth.verifyRegistration(token.value)
    toast.success(t('auth.registered'))
    router.replace('/')
  } catch (e) {
    failed.value = e instanceof ApiError ? t(`errors.${e.code}`) : t('errors.UNKNOWN')
  } finally {
    pending.value = false
  }
})
</script>
