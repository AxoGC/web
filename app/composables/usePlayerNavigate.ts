// Clicking a game player name should land on their platform profile when the
// game account is bound to a registered user, and only fall back to the
// game-only player page (servers/[id]/players/[name]) when it isn't. The
// binding lookup is per-name (no bulk field on leaderboard/online-player
// list responses), so this resolves it on click rather than up front.
export function usePlayerNavigate() {
  const router = useRouter()
  return async function goToPlayer(serverId: string | number, name: string) {
    const binding = await useApi<{ user_id: number }>(
      `/api/servers/${serverId}/players/${encodeURIComponent(name)}/binding`,
    ).catch(() => null)
    if (binding?.user_id) {
      router.push(`/users/${binding.user_id}`)
    } else {
      router.push(`/servers/${serverId}/players/${encodeURIComponent(name)}`)
    }
  }
}
