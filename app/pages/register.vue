<template>
  <UiCard padded>
    <h1 class="text-2xl mb-6">{{ $t('auth.register_title') }}</h1>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <UiField :label="$t('auth.email')" :error="errors.email">
        <div class="flex gap-2">
          <UiInput v-model="email" type="email" autocomplete="email" :leading-icon="LucideMail" />
          <UiButton variant="secondary" :disabled="cooldown > 0 || sending" :loading="sending" @click="onSendCode">
            <template v-if="cooldown > 0">{{ $t('auth.code_resend_in', { n: cooldown }) }}</template>
            <template v-else>{{ $t('auth.send_code') }}</template>
          </UiButton>
        </div>
      </UiField>

      <UiField :label="$t('auth.code')" :error="errors.code">
        <UiInput v-model="code" :placeholder="$t('auth.code_placeholder')" inputmode="numeric" />
      </UiField>

      <UiField :label="$t('auth.username')" :help="$t('auth.rules_username')" :error="errors.username">
        <UiInput v-model="username" autocomplete="username" :leading-icon="LucideUser" />
      </UiField>

      <UiField :label="$t('auth.password')" :help="$t('auth.rules_password')" :error="errors.password">
        <UiInput v-model="password" type="password" autocomplete="new-password" :leading-icon="LucideLock" />
      </UiField>

      <UiButton type="submit" :loading="submitting" block>{{ $t('auth.register_title') }}</UiButton>
    </form>

    <p class="mt-4 text-sm text-text-secondary text-center">
      <NuxtLink to="/login" class="text-brand-400 hover:underline">{{ $t('auth.switch_to_login') }}</NuxtLink>
    </p>
  </UiCard>
</template>

<script setup lang="ts">
import { ref, reactive, onBeforeUnmount } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'
import { ApiError } from '~/composables/useApi'
import { LucideMail, LucideLock, LucideUser } from '#components'

definePageMeta({ layout: 'auth', ssr: false })

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const email = ref('')
const code = ref('')
const username = ref('')
const password = ref('')
const submitting = ref(false)
const sending = ref(false)
const cooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

const errors = reactive({ email: '', code: '', username: '', password: '' })

async function onSendCode() {
  errors.email = ''
  if (!/^.+@.+\..+$/.test(email.value)) {
    errors.email = t('errors.EMAIL_INVALID_FORMAT')
    return
  }
  sending.value = true
  try {
    await useApi('/api/auth/email/send_code', {
      method: 'POST',
      body: { email: email.value.trim() },
      anonymous: true,
    })
    toast.success(t('auth.code_sent'))
    cooldown.value = 60
    cooldownTimer = setInterval(() => {
      cooldown.value--
      if (cooldown.value <= 0 && cooldownTimer) {
        clearInterval(cooldownTimer)
        cooldownTimer = null
      }
    }, 1000)
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
    else toast.error(t('errors.UNKNOWN'))
  } finally {
    sending.value = false
  }
}

async function onSubmit() {
  errors.email = ''
  errors.code = ''
  errors.username = ''
  errors.password = ''
  if (!/^.+@.+\..+$/.test(email.value)) { errors.email = t('errors.EMAIL_INVALID_FORMAT'); return }
  if (!code.value || code.value.length !== 6) { errors.code = t('errors.EMAIL_CODE_INVALID'); return }
  if (username.value.length < 3 || username.value.length > 32) { errors.username = t('errors.USERNAME_INVALID'); return }
  if (password.value.length < 8 || !/[a-z]/i.test(password.value) || !/\d/.test(password.value)) {
    errors.password = t('errors.PASSWORD_TOO_WEAK')
    return
  }
  submitting.value = true
  try {
    await auth.register(email.value.trim(), code.value, username.value, password.value)
    toast.success(t('auth.registered'))
    router.replace('/')
  } catch (e) {
    if (e instanceof ApiError) {
      const map: Record<string, keyof typeof errors> = {
        EMAIL_CODE_INVALID: 'code',
        EMAIL_CODE_EXPIRED: 'code',
        EMAIL_ALREADY_REGISTERED: 'email',
        USERNAME_TAKEN: 'username',
        USERNAME_INVALID: 'username',
        PASSWORD_TOO_WEAK: 'password',
      }
      const target = map[e.code]
      if (target) errors[target] = t(`errors.${e.code}`)
      else toast.fromError(e)
    } else toast.error(t('errors.UNKNOWN'))
  } finally {
    submitting.value = false
  }
}

onBeforeUnmount(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})
</script>
