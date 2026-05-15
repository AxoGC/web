import { ref } from 'vue'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: number
  variant: ToastVariant
  message: string
  ttl: number
}

const items = ref<ToastItem[]>([])
let nextId = 1

function push(message: string, variant: ToastVariant, ttl?: number) {
  const t: ToastItem = {
    id: nextId++,
    variant,
    message,
    ttl: ttl ?? (variant === 'error' ? 4000 : 2000),
  }
  items.value.push(t)
  if (import.meta.client) {
    setTimeout(() => dismiss(t.id), t.ttl)
  }
  return t.id
}

function dismiss(id: number) {
  items.value = items.value.filter((t) => t.id !== id)
}

export function useToast() {
  const { t, te } = useI18n()

  /** Look up an error code in the `errors` namespace; fall back to UNKNOWN if missing. */
  function tErr(code: string) {
    const key = `errors.${code}`
    if (te(key)) return t(key)
    if (te('errors.UNKNOWN')) return t('errors.UNKNOWN')
    return code
  }

  return {
    items,
    success: (msg: string, ttl?: number) => push(msg, 'success', ttl),
    error: (msg: string, ttl?: number) => push(msg, 'error', ttl),
    info: (msg: string, ttl?: number) => push(msg, 'info', ttl),
    warning: (msg: string, ttl?: number) => push(msg, 'warning', ttl),
    /** Convenience: pass an ApiError or raw error code; resolves through i18n. */
    fromError(e: unknown) {
      let code = 'UNKNOWN'
      if (e && typeof e === 'object' && 'code' in e && typeof (e as { code: unknown }).code === 'string') {
        code = (e as { code: string }).code
      }
      return push(tErr(code), 'error')
    },
    dismiss,
  }
}
