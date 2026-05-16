/**
 * Shared TipTap extension list. Used by both RichEditor (editing) and
 * RichContent (renderer via @tiptap/html generateHTML).
 *
 * Keep this list stable: changing it changes how stored docs render.
 */
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

export const tiptapExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    HTMLAttributes: { rel: 'nofollow noopener noreferrer', target: '_blank' },
  }),
]

/** Empty doc factory — returns a fresh mutable object each call so callers can mutate freely. */
export function emptyDoc(): { type: 'doc', content: unknown[] } {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

export function isEmptyDoc(doc: unknown): boolean {
  if (!doc || typeof doc !== 'object') return true
  const d = doc as { type?: string, content?: unknown[] }
  if (d.type !== 'doc') return true
  if (!Array.isArray(d.content) || d.content.length === 0) return true
  // A single empty paragraph is still "empty".
  if (
    d.content.length === 1
    && (d.content[0] as { type?: string })?.type === 'paragraph'
    && !(d.content[0] as { content?: unknown[] })?.content?.length
  ) return true
  return false
}
