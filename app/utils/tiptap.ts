/**
 * Shared TipTap extension list. Used by both RichEditor (editing) and
 * RichContent (renderer via @tiptap/html generateHTML).
 *
 * Keep this list stable: changing it changes how stored docs render.
 */
import StarterKit from '@tiptap/starter-kit'
// `@tiptap/vue-3` re-exports the core Node helper. Importing through it
// avoids declaring @tiptap/core as a direct dep when we already depend on
// vue-3 — pnpm doesn't hoist transitive packages.
import { Node } from '@tiptap/vue-3'

/**
 * Minimal block-level image node. Mirrors the shape `@tiptap/extension-image`
 * produces, but avoids pulling in a separate package for a ~20-line node.
 *
 * Storage: the RichEditor's upload flow sets `attrs.src` (the public URL the
 * blobstore returned) so the doc renders standalone. The attachment id never
 * goes into the doc — the editor pushes it to a sibling `attachment_ids[]`
 * model the post form submits alongside, and core stamps post_id from that
 * list. Walking the doc to find ids is intentionally not done.
 */
const Image = Node.create({
  name: 'image',
  group: 'block',
  draggable: true,
  atom: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
    }
  },
  parseHTML() { return [{ tag: 'img[src]' }] },
  renderHTML({ HTMLAttributes }) { return ['img', HTMLAttributes] },
})

export const tiptapExtensions = [
  // StarterKit v3 bundles Link itself — configuring it via `link:` here
  // (rather than also adding a separate Link extension instance) is what
  // avoids the "Duplicate extension names found: ['link']" warning.
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    link: {
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: 'nofollow noopener noreferrer', target: '_blank' },
    },
  }),
  Image,
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
