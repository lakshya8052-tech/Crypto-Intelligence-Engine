'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  DASHBOARD_SYMBOLS,
  MarketData,
  changeClass,
  fetchMarkets,
  formatCompactUsd,
  formatPercent,
} from '@/components/dashboard/dashboard-data'
import { EmptyState } from '@/components/dashboard/dashboard-ui'

export function MarketSummary() {
  const [markets, setMarkets] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const hasDataRef = useRef(false)
  useEffect(() => {
    hasDataRef.current = markets.length > 0
  }, [markets.length])

  const loadMarkets = useCallback((refresh = false) => {
    if (loading && !refresh) return
    if (isRefreshing) return

    if (refresh && markets.length > 0) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }


    fetchMarkets(DASHBOARD_SYMBOLS, { refresh }).then((result) => {
      setMarkets(result.data)
      setError(result.error)
      if (result.data.length) setLastUpdated(new Date())
      setLoading(false)
      setIsRefreshing(false)
    })
  }, [])

  useEffect(() => {
    loadMarkets()
  }, [loadMarkets])

  const totalVolume = markets.reduce((sum, market) => sum + market.volume, 0)
  const averageChange = markets.length
    ? markets.reduce((sum, market) => sum + market.change_24h, 0) / markets.length
    : 0
  const btc = markets.find((market) => market.symbol === 'BTC')

  const metrics = [
    { label: 'Market Depth', value: String(markets.length), change: `${DASHBOARD_SYMBOLS.length} assets`, tone: 0 },
    { label: '24h Total Volume', value: markets.length ? formatCompactUsd(totalVolume) : '---', change: markets.length ? formatPercent(averageChange) : '', tone: averageChange },
    { label: 'BTC Benchmark', value: btc ? formatCompactUsd(btc.price) : '---', change: btc ? formatPercent(btc.change_24h) : '', tone: btc?.change_24h ?? 0 },
  ]

  return (
    <section className={`grid grid-cols-1 gap-5 sm:grid-cols-3 transition-all duration-300 ${isRefreshing ? 'opacity-50 blur-[1px]' : 'opacity-100'}`}>
      {error && markets.length === 0 && (
        <div className="sm:col-span-3">
          <EmptyState message={error} onRetry={() => loadMarkets(true)} />
        </div>
      )}
      {metrics.map((metric) => (
        <div key={metric.label} className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/20 transition-all hover:shadow-2xl hover:shadow-gray-300/30">
          <div className="absolute top-0 right-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-gray-50/50 transition-transform group-hover:scale-150" />
          
          <div className="relative flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400">{metric.label}</p>
            {lastUpdated && metric.label === 'Market Depth' && (
              <div className="flex items-center gap-1">
                <div className="h-1 w-1 rounded-full bg-green-500" />
                <p className="text-[10px] font-bold text-gray-300">LIVE</p>
              </div>
            )}
          </div>
          
          <div className="relative mt-4 flex items-end justify-between">
            {loading && !isRefreshing ? (
              <div className="h-9 w-28 animate-pulse rounded-lg bg-gray-100" />
            ) : (
              <p className="text-3xl font-black tracking-tighter text-gray-900">{metric.value}</p>
            )}
            
            <div className="flex flex-col items-end">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider transition-all ${metric.label === 'Market Depth' ? 'bg-gray-100 text-gray-600' : (metric.tone >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}`}>
                {loading && !isRefreshing ? '---' : metric.change}
              </span>
              <p className="mt-1 text-[9px] font-bold text-gray-300">24H CHG</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
