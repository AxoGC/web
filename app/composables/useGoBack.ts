// Shared "back to wherever the user came from" logic for detail pages that
// implement their own mobile back button (the `detail` layout no longer
// provides one on mobile — see app/layouts/detail.vue).
export function useGoBack() {
  const router = useRouter()
  return () => {
    if (history.length > 1) router.back()
    else router.push('/')
  }
}
