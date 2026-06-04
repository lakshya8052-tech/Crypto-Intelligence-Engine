'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { OpportunityData, fetchOpportunities } from './dashboard-data'
import { EmptyState, SkeletonRows, WidgetHeader } from './dashboard-ui'

export function TopOpportunities() {
  const [opportunities, setOpportunities] = useState<OpportunityData[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const hasDataRef = useRef(false)
  useEffect(() => {
    hasDataRef.current = opportunities.length > 0
  }, [opportunities.length])

  const loadOpportunities = useCallback((refresh = false) => {
    // Guard against multiple concurrent requests
    if (loading && !refresh) return
    if (isRefreshing) return

    if (refresh && hasDataRef.current) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }
    
    fetchOpportunities({ refresh }).then((result) => {
      setOpportunities(result.data.slice(0, 3))
      setError(result.error)
      if (result.data.length) setLastUpdated(new Date())
      setLoading(false)
      setIsRefreshing(false)
    })
  }, [])

  useEffect(() => {
    loadOpportunities()
  }, [loadOpportunities])

  return (
    <section className={`min-h-80 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/20 transition-all duration-300 ${isRefreshing ? 'opacity-50 grayscale' : 'opacity-100'}`}>
      <WidgetHeader title="Top Opportunities" lastUpdated={lastUpdated} />
      <div className="mt-2 space-y-2">
        {loading && !isRefreshing && <SkeletonRows rows={3} />}
        {!loading && !isRefreshing && opportunities.length === 0 && (
          <EmptyState message={error ?? 'Scanning markets for high-probability setups...'} onRetry={() => loadOpportunities(true)} />
        )}
        {opportunities.map((item) => (
          <div key={item.symbol} className="group flex min-h-[80px] items-center justify-between gap-4 rounded-xl border border-gray-50 bg-gray-50/30 px-4 py-3 transition-all hover:border-blue-100 hover:bg-blue-50/30 hover:shadow-sm">
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-gray-900">{item.symbol}</p>
              <p className="mt-1 line-clamp-1 text-xs font-medium text-gray-500">
                <span className="font-bold text-blue-600">{item.daily_recommendation}</span>
                <span className="mx-1 text-gray-300">•</span>
                {item.market_trend}
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-end">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-black text-blue-700 shadow-sm ring-1 ring-blue-100 transition-transform group-hover:scale-110">
                {item.daily_score}
              </span>
              <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-gray-400">Score</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
