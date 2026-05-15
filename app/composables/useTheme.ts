import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'
const STORAGE_KEY = 'theme-preference'

const mode = ref<ThemeMode>('system')
const resolved = ref<'light' | 'dark'>('dark')
let mql: MediaQueryList | null = null
let initialized = false

function apply(next: 'light' | 'dark') {
  resolved.value = next
  if (import.meta.client) {
    document.documentElement.setAttribute('data-theme', next)
  }
}

function resolve(pref: ThemeMode): 'light' | 'dark' {
  if (pref === 'system') {
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return pref
}

export function useTheme() {
  function init() {
    if (initialized || !import.meta.client) return
    initialized = true
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    if (stored === 'light' || stored === 'dark' || stored === 'system') mode.value = stored
    apply(resolve(mode.value))
    // Listen for system pref changes if mode = system.
    mql = window.matchMedia('(prefers-color-scheme: dark)')
    mql.addEventListener('change', () => {
      if (mode.value === 'system') apply(resolve('system'))
    })
    watch(mode, (v) => {
      localStorage.setItem(STORAGE_KEY, v)
      apply(resolve(v))
    })
  }

  function set(next: ThemeMode) {
    mode.value = next
  }

  return { mode, resolved, init, set }
}
