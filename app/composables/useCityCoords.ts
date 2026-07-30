/**
 * Loads /public/data/city-coords.json — the frontend-only mapping from
 * GB/T 2260 prefecture city_code to display name + coordinates. Trimmed
 * from china-city-coordinate.json; kept static so it never needs a backend
 * round trip. Module-scope cache: the data is identical for every user and
 * never changes at runtime, so a plain shared promise is enough (no need
 * for useState/useAsyncData's per-request dedup machinery).
 */
export interface CityCoord {
  name: string
  name_en: string
  province: string
  lng: number
  lat: number
}

let cache: Record<string, CityCoord> | null = null
let inflight: Promise<Record<string, CityCoord>> | null = null

export function useCityCoords() {
  function load(): Promise<Record<string, CityCoord>> {
    if (cache) return Promise.resolve(cache)
    if (!inflight) {
      inflight = $fetch<Record<string, CityCoord>>('/data/city-coords.json').then((data) => {
        cache = data
        return data
      })
    }
    return inflight
  }
  return { load }
}
