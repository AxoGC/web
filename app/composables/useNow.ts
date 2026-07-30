/**
 * Shared "now" (unix seconds), hydrated once from the SSR payload.
 *
 * Calling `Math.floor(Date.now() / 1000)` independently during SSR and
 * during the client's first render is a classic hydration-mismatch source:
 * real time elapses between the two renders, so a relative-time label like
 * "5分钟前" computed from the server's timestamp can differ from the same
 * label computed from the client's later timestamp — Vue then reports
 * "Hydration completed but contains mismatches." `useState` avoids this by
 * running its initializer once on the server and serializing the result
 * into the payload; the client reads that same value back on hydration
 * instead of calling the initializer again.
 */
export function useNow() {
  return useState('now-seconds', () => Math.floor(Date.now() / 1000))
}
