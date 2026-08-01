<template>
  <UiCard padded>
    <h1 class="text-2xl mb-6">{{ $t('auth.register_title') }}</h1>

    <form v-if="!sent" class="space-y-4" @submit.prevent="onSubmit">
      <UiField :label="$t('auth.email')" :error="errors.email">
        <UiInput v-model="email" type="email" autocomplete="email" :leading-icon="LucideMail" />
      </UiField>

      <UiField :label="$t('auth.username')" :help="$t('auth.rules_username')" :error="errors.username">
        <UiInput v-model="username" autocomplete="username" :leading-icon="LucideUser" />
      </UiField>

      <UiField :label="$t('auth.password')" :help="$t('auth.rules_password')" :error="errors.password">
        <UiInput v-model="password" type="password" autocomplete="new-password" :leading-icon="LucideLock" />
      </UiField>

      <UiButton type="submit" :loading="submitting" block>{{ $t('auth.register_submit') }}</UiButton>
    </form>

    <template v-else>
      <p class="text-sm text-text-secondary">{{ $t('auth.register_email_sent', { email }) }}</p>
      <UiButton variant="ghost" class="mt-4" :disabled="cooldown > 0" :loading="submitting" @click="onResend">
        <template v-if="cooldown > 0">{{ $t('auth.register_resend_in', { n: cooldown }) }}</template>
        <template v-else>{{ $t('auth.register_resend') }}</template>
      </UiButton>
    </template>

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

const auth = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const email = ref('')
const username = ref('')
const password = ref('')
const submitting = ref(false)
const sent = ref(false)
const cooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

const errors = reactive({ email: '', username: '', password: '' })

function startCooldown() {
  cooldown.value = 60
  cooldownTimer = setInterval(() => {
    cooldown.value--
    if (cooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

async function onSubmit() {
  errors.email = ''
  errors.username = ''
  errors.password = ''
  if (!/^.+@.+\..+$/.test(email.value)) { errors.email = t('errors.EMAIL_INVALID_FORMAT'); return }
  if (username.value.length < 3 || username.value.length > 32) { errors.username = t('errors.USERNAME_INVALID'); return }
  if (password.value.length < 8 || !/[a-z]/i.test(password.value) || !/\d/.test(password.value)) {
    errors.password = t('errors.PASSWORD_TOO_WEAK')
    return
  }
  submitting.value = true
  try {
    await auth.requestRegistration(email.value.trim(), username.value, password.value)
    sent.value = true
    startCooldown()
  } catch (e) {
    if (e instanceof ApiError) {
      const map: Record<string, keyof typeof errors> = {
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

async function onResend() {
  submitting.value = true
  try {
    await auth.requestRegistration(email.value.trim(), username.value, password.value)
    startCooldown()
  } catch (e) {
    if (e instanceof ApiError) toast.fromError(e)
    else toast.error(t('errors.UNKNOWN'))
  } finally {
    submitting.value = false
  }
}

onBeforeUnmount(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})
</script>
