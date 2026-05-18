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
        <template v-for="m in messages" :key="m.id">
          <div
            v-if="m.kind === 'system'"
            class="flex items-baseline gap-2 leading-snug text-text-tertiary italic"
          >
            <span class="text-xs shrink-0">{{ fmtTime(m.ts) }}</span>
            <span class="break-words min-w-0">{{ systemLine(m) }}</span>
          </div>
          <div
            v-else
            class="flex items-baseline gap-2 leading-snug"
          >
            <span class="text-text-tertiary text-xs shrink-0">{{ fmtTime(m.ts) }}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] uppercase shrink-0 font-semibold"
              :class="m.source === 'web' ? 'bg-brand-soft text-brand-400' : 'bg-bg-overlay text-text-secondary'">
              {{ m.source }}
            </span>
            <span class="font-semibold shrink-0">{{ m.sender }}</span>
            <span class="text-text-tertiary shrink-0">:</span>
            <span class="break-words min-w-0">{{ m.content }}</span>
          </div>
        </template>
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
import { useChatStream, type ChatMessage } from '~/composables/useChatStream'
import { useAuthStore } from '~/stores/auth'

const { t } = useI18n()

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

// systemLine renders a localized one-liner for system-kind messages.
// `content` is the event key set by the backend (chat.EventPlayerJoin etc.).
function systemLine(m: ChatMessage): string {
  switch (m.content) {
    case 'player.join':  return t('chat.system_join',  { name: m.sender })
    case 'player.leave': return t('chat.system_leave', { name: m.sender })
    case 'player.died':  return diedLine(m)
    default:             return `${m.sender} · ${m.content}`
  }
}

// diedLine picks an i18n key by killer_kind/cause; falls back to generic.
function diedLine(m: ChatMessage): string {
  const meta = (m.meta ?? {}) as { killer_kind?: string; killer?: string; cause?: string }
  if (meta.killer_kind === 'player' && meta.killer) {
    return t('chat.system_died_pvp', { name: m.sender, killer: meta.killer })
  }
  if (meta.killer_kind === 'mob' && meta.killer) {
    return t('chat.system_died_mob', { name: m.sender, mob: meta.killer })
  }
  switch (meta.cause) {
    case 'fall':         return t('chat.system_died_fall',     { name: m.sender })
    case 'lava':         return t('chat.system_died_lava',     { name: m.sender })
    case 'fire':
    case 'fireTick':     return t('chat.system_died_fire',     { name: m.sender })
    case 'drowning':     return t('chat.system_died_drown',    { name: m.sender })
    case 'void':         return t('chat.system_died_void',     { name: m.sender })
    case 'suicide':      return t('chat.system_died_suicide',  { name: m.sender })
    case 'anvil':
    case 'fallingBlock': return t('chat.system_died_crushed',  { name: m.sender })
    case 'blockExplosion':
    case 'entityExplosion': return t('chat.system_died_blown', { name: m.sender })
    case 'starve':       return t('chat.system_died_starve',   { name: m.sender })
    case 'projectile':   return t('chat.system_died_arrow',    { name: m.sender })
    default:             return t('chat.system_died_generic',  { name: m.sender })
  }
}
</script>
