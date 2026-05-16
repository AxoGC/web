import type { ServerType } from '~/types/api'

export interface GameAvatar {
  /** External avatar URL if the game has a stable per-name avatar source. */
  src?: string
  /** Whether the source produces pixel-art (needs image-rendering: pixelated). */
  pixelated?: boolean
}

/**
 * Avatar source strategy per game. MC (both editions) has the Mojang skin head
 * mirror; other games fall back to the generic initial-letter chip.
 */
export function useGameAvatar(type: ServerType | undefined | null) {
  function avatarFor(name: string, size = 32): GameAvatar {
    if (type === 'mc-java' || type === 'mc-bedrock') {
      return {
        src: `https://mc-heads.net/avatar/${encodeURIComponent(name)}/${size}`,
        pixelated: true,
      }
    }
    return {}
  }
  return { avatarFor }
}
