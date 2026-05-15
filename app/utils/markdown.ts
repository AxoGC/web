/**
 * Markdown renderer with code highlight + XSS sanitization.
 *
 * Lazy-loads heavy deps (markdown-it, highlight.js, DOMPurify) only when called.
 * Backend also sanitizes via bluemonday (plan §12.1) — this is the second line of defence.
 */

type Renderer = (input: string) => string

let cached: Renderer | null = null

export async function renderMarkdown(input: string): Promise<string> {
  if (!input) return ''
  if (!cached) cached = await build()
  return cached(input)
}

async function build(): Promise<Renderer> {
  try {
    const [MdMod, HljsMod, PurifyMod] = await Promise.all([
      import('markdown-it'),
      // @ts-expect-error highlight.js ships no first-party types we declared
      import('highlight.js'),
      // @ts-expect-error dompurify types not installed
      import('dompurify'),
    ])
    type HljsT = { getLanguage(lang: string): unknown; highlight(code: string, opts: { language: string }): { value: string } }
    const hljs = (HljsMod as { default: HljsT }).default
    const MdCtor = (MdMod as { default: new (opts: Record<string, unknown>) => { render(s: string): string } }).default
    const DOMPurify = (PurifyMod as { default: { sanitize(s: string, opts?: Record<string, unknown>): string } }).default
    const md = new MdCtor({
      html: false,
      breaks: true,
      linkify: true,
      highlight(code: string, lang: string) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return `<pre class="hljs"><code>${hljs.highlight(code, { language: lang }).value}</code></pre>`
          } catch {
            // fallthrough to escaped
          }
        }
        const esc = code
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
        return `<pre class="hljs"><code>${esc}</code></pre>`
      },
    })
    return (input: string) => {
      const html = md.render(input)
      return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
    }
  } catch {
    // Markdown deps missing — fall back to escaped plaintext with line breaks.
    return (input: string) => {
      const escaped = input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      return `<p>${escaped.replace(/\n/g, '<br>')}</p>`
    }
  }
}
