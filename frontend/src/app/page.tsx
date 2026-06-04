'use client'

import { useState, useEffect } from 'react'
import { MarketSummary } from '@/components/intelligence/market-summary'
import { TopOpportunities } from '@/components/dashboard/top-opportunities'
import { RecentSignals } from '@/components/dashboard/recent-signals'
import { PersonalAIAssistant } from '@/components/intelligence/personal-ai-assistant'
import { useLayout } from '@/hooks/use-layout'
import { DashboardOverview } from '@/components/dashboard/overview'
import { MarketMovers } from '@/components/dashboard/market-movers'
import { WatchlistPreview } from '@/components/dashboard/watchlist-preview'

export default function Dashboard() {
  const { marginLeft, isMobile, sidebarCollapsed } = useLayout()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // On mobile, the sidebar is a drawer/overlay, so we don't push the content
  const dynamicMargin = !isMobile ? marginLeft : '0px'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Personal AI Assistant Sidebar */}
      <PersonalAIAssistant />

      {/* Main Content */}
      <div 
        className="min-h-screen transition-all duration-300" 
        style={{ marginLeft: mounted ? dynamicMargin : '0px' }}
      >

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">Terminal</h1>
              <p className="text-sm font-medium text-gray-500">Institutional grade crypto intelligence & signals</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full ring-1 ring-inset ring-green-600/10">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-green-700">Live Network Feed</span>
            </div>
          </div>

          {/* Top Intelligence Bar */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
            <div className="xl:col-span-3">
              <MarketSummary />
            </div>
            <div>
              <DashboardOverview />
            </div>
          </div>

          {/* Main Action Center */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TopOpportunities />
                <RecentSignals />
              </div>
              <WatchlistPreview />
            </div>
            <div className="space-y-6">
              <MarketMovers />
              {/* Future-proofing for secondary tools */}
              <div className="hidden lg:block rounded-2xl border-2 border-dashed border-gray-100 p-8 text-center bg-gray-50/30">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Terminal Context</p>
                <p className="mt-2 text-[11px] text-gray-400 font-medium">Additional analytics modules will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
