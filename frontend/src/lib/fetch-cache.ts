import { apiClient } from './api-client'
import { getCached, setCached } from './page-cache'

type Inflight = Map<string, Promise<any>>

const inflight: Inflight = new Map()

/**
 * Fetch with cache-first behavior and dedupe of in-flight requests.
 * - cacheKey: key used in page-cache
 * - endpoint: API endpoint to call (passed to apiClient.get)
 * If cached data exists, returns it immediately and triggers a background refresh.
 * If not, dedupes concurrent requests and returns the fetched data.
 */
export async function fetchAndCache(endpoint: string, cacheKey: string) {
  const cached = getCached(cacheKey)
  if (cached) {
    // kick off background refresh but don't await it
    refresh(endpoint, cacheKey).catch(() => {})
    return cached
  }

  // no cached value — use dedupe to avoid parallel identical requests
  return await dedupeFetch(endpoint, cacheKey)
}

async function dedupeFetch(endpoint: string, cacheKey: string) {
  const key = endpoint
  let p = inflight.get(key)
  if (p) return p

  p = (async () => {
    try {
      const resp = await apiClient.get<any>(endpoint)
      if (!resp.error && resp.data) {
        setCached(cacheKey, resp.data)
        return resp.data
      }
      return null
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, p)
  return p
}

async function refresh(endpoint: string, cacheKey: string) {
  // Always dedupe refreshes as well
  await dedupeFetch(endpoint, cacheKey)
}

export function clearInflight() {
  inflight.clear()
}
