'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { MarketData, WATCHLIST_SYMBOLS, changeClass, fetchMarkets, formatPercent, formatUsd } from './dashboard-data'
import { EmptyState, WidgetHeader } from './dashboard-ui'

export function WatchlistPreview() {
  const [watchlist, setWatchlist] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const hasDataRef = useRef(false)
  useEffect(() => {
    hasDataRef.current = watchlist.length > 0
  }, [watchlist.length])

  const loadWatchlist = useCallback((refresh = false) => {
    if (loading && !refresh) return
    if (isRefreshing) return

    if (refresh && hasDataRef.current) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }

    fetchMarkets(WATCHLIST_SYMBOLS, { refresh }).then((result) => {
      setWatchlist(result.data)
      setError(result.error)
      if (result.data.length) setLastUpdated(new Date())
      setLoading(false)
      setIsRefreshing(false)
    })
  }, [])

  useEffect(() => {
    loadWatchlist()
  }, [loadWatchlist])

  return (
    <section className={`rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:p-6 transition-opacity ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
      <WidgetHeader title="Watchlist" lastUpdated={lastUpdated} />
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loading && !isRefreshing && Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="min-h-28 rounded-md bg-gray-50 p-4">
            <div className="h-4 w-14 animate-pulse rounded bg-gray-200" />
            <div className="mt-4 h-6 w-28 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
        {!loading && !isRefreshing && watchlist.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-4">
            <EmptyState message={error ?? 'No data available'} onRetry={() => loadWatchlist(true)} />
          </div>
        )}
        {watchlist.map((asset) => (
          <div key={asset.symbol} className="min-h-28 rounded-md bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-gray-900">{asset.symbol}</span>
              <span className={`${changeClass(asset.change_24h)} shrink-0`}>
                {formatPercent(asset.change_24h)}
              </span>
            </div>
            <p className="mt-3 break-words text-lg font-bold text-gray-900">{formatUsd(asset.price)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
