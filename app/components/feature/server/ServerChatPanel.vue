<template>
  <UiCard padded>
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-semibold">{{ $t('chat.title') }}</h2>
      <span class="text-xs" :class="connected ? 'text-success-500' : 'text-text-tertiary'">
        <span class="inline-block w-2 h-2 rounded-full align-middle mr-1"
          :class="connected ? 'bg-success-500' : 'bg-text-tertiary'" />
        {{ connected ? $t('chat.connected') : $t('chat.disconnected') }}
      </span>
    </div>

    <div v-if="!isLoggedIn" class="text-sm text-text-tertiary text-center py-6">
      {{ $t('chat.login_required') }}
    </div>
    <template v-else>
      <div ref="scroller"
        class="h-72 overflow-y-auto pr-2 space-y-1.5 text-sm font-mono">
        <div v-if="!messages.length" class="text-text-tertiary text-center py-6">
          {{ $t('chat.empty') }}
        </div>
        <div v-for="m in messages" :key="m.id"
          class="flex items-baseline gap-2 leading-snug">
          <span class="text-text-tertiary text-xs shrink-0">{{ fmtTime(m.ts) }}</span>
          <span class="px-1.5 py-0.5 rounded text-[10px] uppercase shrink-0 font-semibold"
            :class="m.source === 'web' ? 'bg-brand-soft text-brand-400' : 'bg-bg-overlay text-text-secondary'">
            {{ m.source }}
          </span>
          <span class="font-semibold shrink-0">{{ m.sender }}</span>
          <span class="text-text-tertiary shrink-0">:</span>
          <span class="break-words min-w-0">{{ m.content }}</span>
        </div>
      </div>

      <form class="mt-3 flex gap-2" @submit.prevent="onSend">
        <UiInput
          v-model="draft"
          :placeholder="$t('chat.placeholder')"
          :disabled="sending"
          class="flex-1"
        />
        <UiButton type="submit" :loading="sending" :disabled="!draft.trim()">
          {{ $t('actions.send') }}
        </UiButton>
      </form>
      <p v-if="errorCode" class="text-xs text-danger-400 mt-1">
        {{ errorCode }}
      </p>
    </template>
  </UiCard>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useChatStream } from '~/composables/useChatStream'
import { useAuthStore } from '~/stores/auth'

const props = defineProps<{ serverId: number | string }>()

const channel = computed(() => String(props.serverId))
const auth = useAuthStore()
const isLoggedIn = computed(() => auth.isLoggedIn)

const { messages, connected, send } = useChatStream(channel)

const scroller = ref<HTMLElement | null>(null)
const draft = ref('')
const sending = ref(false)
const errorCode = ref<string | null>(null)

watch(messages, async () => {
  await nextTick()
  const el = scroller.value
  if (el) el.scrollTop = el.scrollHeight
}, { deep: false, flush: 'post' })

async function onSend() {
  const text = draft.value.trim()
  if (!text || sending.value) return
  sending.value = true
  errorCode.value = null
  try {
    await send(text)
    draft.value = ''
  } catch (e: any) {
    errorCode.value = e?.data?.code || e?.code || 'CHAT_SEND_FAILED'
  } finally {
    sending.value = false
  }
}

function fmtTime(ts: number) {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}
</script>
