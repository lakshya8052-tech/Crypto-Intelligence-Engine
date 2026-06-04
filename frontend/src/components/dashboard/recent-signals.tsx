'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { SIGNAL_SYMBOLS, SignalData, fetchSignals } from './dashboard-data'
import { EmptyState, SkeletonRows, WidgetHeader } from './dashboard-ui'

export function RecentSignals() {
  const [signals, setSignals] = useState<SignalData[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Use a ref to check the current signals length without triggering useCallback recreation
  // This prevents the double-fetch bug on mount
  const hasDataRef = useRef(false)
  useEffect(() => {
    hasDataRef.current = signals.length > 0
  }, [signals.length])

  const loadSignals = useCallback((refresh = false) => {
    if (loading && !refresh) return
    if (isRefreshing) return

    if (refresh && hasDataRef.current) {
      setIsRefreshing(true)
    } else {
      setLoading(true)
    }

    fetchSignals(SIGNAL_SYMBOLS, { refresh }).then((result) => {
      setSignals(result.data)
      setError(result.error)
      if (result.data.length) setLastUpdated(new Date())
      setLoading(false)
      setIsRefreshing(false)
    })
  }, []) // Stable callback

  useEffect(() => {
    loadSignals()
  }, [loadSignals])

  const getSignalStyles = (signal: string) => {
    switch (signal.toUpperCase()) {
      case 'BUY':
        return 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
      case 'SELL':
        return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
      default:
        return 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
    }
  }

  return (
    <section className={`min-h-80 rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/20 transition-all duration-300 ${isRefreshing ? 'opacity-50 grayscale' : 'opacity-100'}`}>
      <WidgetHeader title="Recent Signals" lastUpdated={lastUpdated} />
      <div className="mt-2 space-y-2">
        {loading && !isRefreshing && <SkeletonRows rows={4} />}
        {!loading && !isRefreshing && signals.length === 0 && (
          <EmptyState message={error ?? 'No signals detected in the last analysis cycle.'} onRetry={() => loadSignals(true)} />
        )}
        {signals.map((signal) => (
          <div key={signal.symbol} className="group flex min-h-[72px] items-center justify-between gap-4 rounded-xl border border-transparent px-4 py-3 transition-all hover:border-gray-100 hover:bg-gray-50/50 hover:shadow-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold tracking-tight text-gray-900">{signal.symbol}/USD</p>
                <div className="h-1 w-1 rounded-full bg-gray-300" />
                <p className="text-xs font-medium text-gray-400">Spot</p>
              </div>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Analysis complete</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold transition-all ${getSignalStyles(signal.signal)}`}>
                {signal.signal}
              </span>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{signal.confidence.toFixed(0)}%</p>
                <p className="text-[10px] font-bold uppercase tracking-tighter text-gray-400">Conf.</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
