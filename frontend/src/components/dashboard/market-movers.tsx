'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { DASHBOARD_SYMBOLS, MarketData, changeClass, fetchMarkets, formatPercent, formatUsd } from './dashboard-data'
import { EmptyState, SkeletonRows, WidgetHeader } from './dashboard-ui'

export function MarketMovers() {
  const [movers, setMovers] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const hasDataRef = useRef(false)
  useEffect(() => {
    hasDataRef.current = movers.length > 0
  }, [movers.length])

  const loadMovers = useCallback((refresh = false) => {
    if (loading && !refresh) return
    if (isRefreshing) return

    if (refresh && hasDataRef.current) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }

    fetchMarkets(DASHBOARD_SYMBOLS, { refresh }).then((result) => {
      // Sort by absolute change value and take top 3
      const sorted = [...result.data]
        .sort((a, b) => Math.abs(b.change_24h) - Math.abs(a.change_24h))
        .slice(0, 3)
      
      setMovers(sorted)
      setError(result.error)
      if (result.data.length) setLastUpdated(new Date())
      setLoading(false)
      setIsRefreshing(false)
    })
  }, [])

  useEffect(() => {
    loadMovers()
  }, [loadMovers])

  return (
    <section className={`min-h-80 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 transition-opacity ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
      <WidgetHeader title="Market Movers" lastUpdated={lastUpdated} />
      <div className="mt-4 space-y-3">
        {loading && !isRefreshing && <SkeletonRows rows={3} />}
        {!loading && !isRefreshing && movers.length === 0 && (
          <EmptyState message={error ?? 'No data available'} onRetry={() => loadMovers(true)} />
        )}
        {movers.map((mover) => (
          <div key={mover.symbol} className="flex min-h-16 items-center justify-between gap-3 rounded-md bg-gray-50 px-4 py-3">
            <div className="min-w-0">
              <span className="font-semibold text-gray-900">{mover.symbol}</span>
              <p className="truncate text-sm text-gray-500">{formatUsd(mover.price)}</p>
            </div>
            <span className={`${changeClass(mover.change_24h)} shrink-0`}>
              {formatPercent(mover.change_24h)}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
