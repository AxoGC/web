import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Reactive viewport flag aligned with Tailwind's `md:` breakpoint (768px).
 * SSR-safe: defaults to desktop (`isMobile = false`) before hydration.
 */
export function useViewport() {
  const isMobile = ref(false)
  let mql: MediaQueryList | null = null

  function update() {
    if (mql) isMobile.value = mql.matches
  }

  onMounted(() => {
    mql = window.matchMedia('(max-width: 767.98px)')
    update()
    mql.addEventListener('change', update)
  })

  onBeforeUnmount(() => {
    if (mql) mql.removeEventListener('change', update)
  })

  return { isMobile }
}
