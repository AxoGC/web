import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useAuthStore } from '~/stores/auth'

export interface ChatMessage {
  id: string
  ts: number
  /** "chat" for player messages, "system" for join/leave-style notices. */
  kind: 'chat' | 'system'
  channel: string
  source: 'web' | 'game'
  server_id: number | null
  /** Player name (both for chat and system). */
  sender: string
  /** Chat: the typed message. System: an event key like "player.join"/"player.leave". */
  content: string
  /** Optional structured detail for system events (e.g. player.died killer/cause). */
  meta?: Record<string, unknown>
}

interface ChatStreamOpts {
  /** Maximum messages to retain in memory. Default 200. */
  bufferLimit?: number
}

/**
 * Subscribes to /api/chat/stream?channel=<channel> using fetch + ReadableStream
 * so we can attach the Authorization bearer header. Auto-reconnects with
 * Last-Event-ID; pauses on tab hidden.
 */
export function useChatStream(channel: Ref<string>, opts: ChatStreamOpts = {}) {
  const limit = opts.bufferLimit ?? 200

  const messages = ref<ChatMessage[]>([])
  const connected = ref(false)
  const error = ref<string | null>(null)
  const lastEventId = ref<string>('')

  let controller: AbortController | null = null
  let backoff = 1000
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let stopped = false

  function push(m: ChatMessage) {
    const last = messages.value[messages.value.length - 1]
    if (last && last.id === m.id) return
    messages.value.push(m)
    if (messages.value.length > limit) {
      messages.value.splice(0, messages.value.length - limit)
    }
    lastEventId.value = m.id
  }

  function setSnapshot(arr: ChatMessage[]) {
    messages.value = arr.slice(-limit)
    const last = messages.value[messages.value.length - 1]
    if (last) lastEventId.value = last.id
  }

  async function connect() {
    if (stopped) return
    if (!channel.value) return
    if (typeof document !== 'undefined' && document.hidden) return
    if (controller) {
      try { controller.abort() } catch {}
    }
    controller = new AbortController()

    const cfg = useRuntimeConfig()
    const base = cfg.public.apiBase || ''
    const url = `${base}/api/chat/stream?channel=${encodeURIComponent(channel.value)}`

    const auth = useAuthStore()
    const headers: Record<string, string> = { Accept: 'text/event-stream' }
    if (auth.accessToken) headers['Authorization'] = `Bearer ${auth.accessToken}`
    if (lastEventId.value) headers['Last-Event-ID'] = lastEventId.value

    error.value = null
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
        signal: controller.signal,
      })
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`)
      }
      connected.value = true
      backoff = 1000
      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buf = ''
      // SSE frame parser — frames terminated by blank line.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        let idx: number
        // Process complete frames (separated by \n\n).
        while ((idx = buf.indexOf('\n\n')) >= 0) {
          const frame = buf.slice(0, idx)
          buf = buf.slice(idx + 2)
          handleFrame(frame)
        }
      }
      throw new Error('stream closed')
    } catch (e) {
      if (stopped) return
      connected.value = false
      error.value = (e as Error)?.message || 'stream error'
      scheduleReconnect()
    }
  }

  function handleFrame(frame: string) {
    let event = 'message'
    let id = ''
    const dataParts: string[] = []
    for (const line of frame.split('\n')) {
      if (line.startsWith(':')) continue // comment
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('id:')) id = line.slice(3).trim()
      else if (line.startsWith('data:')) dataParts.push(line.slice(5).replace(/^ /, ''))
    }
    const dataStr = dataParts.join('\n')
    if (event === 'ping') return
    if (event === 'snapshot') {
      try {
        const arr = JSON.parse(dataStr) as ChatMessage[] | null
        if (Array.isArray(arr)) setSnapshot(arr)
      } catch {}
      return
    }
    if (event === 'message') {
      try {
        const m = JSON.parse(dataStr) as ChatMessage
        push(m)
        if (id) lastEventId.value = id
      } catch {}
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer || stopped) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      backoff = Math.min(backoff * 2, 10_000)
      void connect()
    }, backoff)
  }

  function stop() {
    stopped = true
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (controller) {
      try { controller.abort() } catch {}
      controller = null
    }
    connected.value = false
  }

  function start() {
    stopped = false
    void connect()
  }

  function onVisibility() {
    if (typeof document === 'undefined') return
    if (document.hidden) {
      if (controller) try { controller.abort() } catch {}
      connected.value = false
    } else {
      backoff = 1000
      void connect()
    }
  }

  onMounted(() => {
    start()
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility)
    }
  })

  watch(channel, () => {
    messages.value = []
    lastEventId.value = ''
    backoff = 1000
    void connect()
  })

  onBeforeUnmount(() => {
    stop()
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility)
    }
  })

  async function send(content: string) {
    if (!content.trim()) return
    await $fetch('/api/chat/send', {
      method: 'POST',
      baseURL: (useRuntimeConfig().public.apiBase as string) || undefined,
      body: { channel: channel.value, content },
      credentials: 'include',
      headers: {
        ...(useAuthStore().accessToken
          ? { Authorization: `Bearer ${useAuthStore().accessToken}` }
          : {}),
      },
    })
  }

  return { messages, connected, error, send }
}
