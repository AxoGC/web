import { onMounted, onBeforeUnmount } from 'vue'

interface PollingOpts {
  /** Interval in ms. Default 25s (plan §5.13.4). */
  interval?: number
  /** Pause when document.hidden. Default true. */
  pauseOnHidden?: boolean
  /** Run immediately on mount before the first interval tick. Default true. */
  immediate?: boolean
}

/**
 * Repeats `fetcher` on an interval, pausing when the tab is hidden
 * and firing immediately when it becomes visible again.
 *
 * Errors are swallowed — polling never crashes the page; surface them inside `fetcher` if needed.
 */
export function usePolling(fetcher: () => unknown | Promise<unknown>, opts: PollingOpts = {}) {
  const interval = opts.interval ?? 25_000
  const pauseOnHidden = opts.pauseOnHidden ?? true
  const immediate = opts.immediate ?? true

  let timer: ReturnType<typeof setTimeout> | null = null
  let running = false

  async function tick() {
    if (running) return
    running = true
    try {
      await fetcher()
    } catch {
      // ignore
    } finally {
      running = false
    }
  }

  function schedule() {
    if (timer) return
    if (pauseOnHidden && typeof document !== 'undefined' && document.hidden) return
    timer = setTimeout(async () => {
      timer = null
      await tick()
      schedule()
    }, interval)
  }

  function clear() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function onVisibility() {
    if (document.hidden) {
      clear()
    } else {
      void tick()
      schedule()
    }
  }

  onMounted(() => {
    if (immediate) void tick()
    schedule()
    if (pauseOnHidden && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility)
    }
  })

  onBeforeUnmount(() => {
    clear()
    if (pauseOnHidden && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility)
    }
  })

  return { tick, clear }
}
