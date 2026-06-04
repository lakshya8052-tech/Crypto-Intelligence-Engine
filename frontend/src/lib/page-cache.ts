type CacheEntry = { data: any; ts: number }

const TTL = 45 * 1000 // 45 seconds
const cache = new Map<string, CacheEntry>()

export function getCached(key: string) {
  const e = cache.get(key)
  if (!e) return null
  if (Date.now() - e.ts > TTL) {
    cache.delete(key)
    return null
  }
  return e.data
}

export function setCached(key: string, data: any) {
  try {
    cache.set(key, { data, ts: Date.now() })
  } catch (err) {
    // no-op
  }
}

export function invalidate(key: string) {
  cache.delete(key)
}
