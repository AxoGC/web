import type { ServerType } from '~/types/api'
import { primaryServerType } from '~/composables/useServerTypes'

export interface GameAvatar {
  /** External avatar URL if the game has a stable per-name avatar source. */
  src?: string
  /** Whether the source produces pixel-art (needs image-rendering: pixelated). */
  pixelated?: boolean
}

/**
 * Avatar source strategy per game. Only Java edition has a stable name→skin
 * mirror (mc-heads.net); Bedrock gamertags don't resolve to skins, and other
 * games have no per-name avatar source.
 */
export function useGameAvatar(type: ServerType | undefined | null) {
  const primary = primaryServerType(type)
  function avatarFor(name: string, size = 32): GameAvatar {
    if (primary === 'mc-java') {
      return {
        src: `https://mc-heads.net/avatar/${encodeURIComponent(name)}/${size}`,
        pixelated: true,
      }
    }
    return {}
  }
  return { avatarFor }
}
