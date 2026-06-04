'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { SIGNAL_SYMBOLS, SignalData, fetchSignals } from './dashboard-data'
import { EmptyState, WidgetHeader } from './dashboard-ui'

export function DashboardOverview() {
  const [signals, setSignals] = useState<SignalData[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

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
  }, [])

  useEffect(() => {
    loadSignals()
  }, [loadSignals])

  // Memoize derived stats to prevent unnecessary recalculations
  const actionable = useMemo(() => signals.filter((item) => item.signal !== 'HOLD'), [signals])
  const highConfidence = useMemo(() => signals.filter((item) => item.confidence >= 70), [signals])
  const riskLevel = useMemo(() => {
    const riskLevels = signals.map((item) => item.analysis?.risk_level).filter(Boolean)
    return riskLevels.includes('High') ? 'High' : riskLevels.includes('Medium') ? 'Medium' : signals.length ? 'Low' : 'Unavailable'
  }, [signals])

  const overviewItems = [
    { label: 'Total Signals', value: String(signals.length), detail: `${actionable.length} Actionable` },
    { label: 'High Precision', value: String(highConfidence.length), detail: 'Confidence ≥ 70%' },
    { label: 'Market Risk', value: riskLevel, detail: `${SIGNAL_SYMBOLS.length} Symbols` },
  ]

  return (
    <section className={`rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/20 transition-all duration-300 ${isRefreshing ? 'opacity-50 grayscale' : 'opacity-100'}`}>
      <WidgetHeader title="Intelligence Overview" lastUpdated={lastUpdated} />
      {error && signals.length === 0 && <div className="mt-4"><EmptyState message={error} onRetry={() => loadSignals(true)} /></div>}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {overviewItems.map((item) => (
          <div key={item.label} className="group flex flex-col justify-between min-h-[112px] rounded-xl bg-gray-50/50 p-5 transition-all hover:bg-gray-100/50">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</p>
            <div>
              {loading && !isRefreshing ? (
                <div className="mt-2 h-7 w-12 animate-pulse rounded bg-gray-200" />
              ) : (
                <p className="mt-1 text-2xl font-black tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">{item.value}</p>
              )}
              <p className="mt-1 text-[11px] font-bold text-gray-500">{loading && !isRefreshing ? '---' : item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
