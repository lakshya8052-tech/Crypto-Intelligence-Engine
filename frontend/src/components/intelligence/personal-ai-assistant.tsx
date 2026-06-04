'use client'

import { useEffect, useState } from 'react'
import { OpportunityData, fetchOpportunities } from '@/components/dashboard/dashboard-data'

export function PersonalAIAssistant() {
  const [topOpportunity, setTopOpportunity] = useState<OpportunityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchOpportunities().then((result) => {
      if (!cancelled) {
        setTopOpportunity(result.data[0] ?? null)
        setError(result.error)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <aside className="fixed bottom-4 right-4 z-30 hidden w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg xl:block">
      <p className="text-sm font-semibold text-gray-900">Live AI Brief</p>
      <div className="mt-2 min-h-[40px] text-sm text-gray-600">
        {loading && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
            <p className="animate-pulse">Analyzing market data...</p>
          </div>
        )}
        {!loading && error && (
          <p className="text-red-500">Briefing unavailable: {error}</p>
        )}
        {!loading && !error && topOpportunity && (
          <p>
            {topOpportunity.symbol}: {topOpportunity.daily_recommendation} with {topOpportunity.confidence.toFixed(0)}% confidence.
          </p>
        )}
        {!loading && !error && !topOpportunity && (
          <p>No high-confidence opportunities detected currently.</p>
        )}
      </div>
    </aside>
  )
}
