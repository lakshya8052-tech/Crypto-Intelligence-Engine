'use client'

import { useLayout } from '@/hooks/use-layout'
import { 
  LayoutDashboard, 
  TrendingUp, 
  Zap, 
  Briefcase, 
  Eye, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Markets', icon: TrendingUp },
  { name: 'Signals', icon: Zap },
  { name: 'Portfolio', icon: Briefcase },
  { name: 'Watchlist', icon: Eye },
  { name: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { sidebarWidth, sidebarCollapsed, toggleSidebar } = useLayout()

  return (
    <nav 
      className="fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-gray-100 bg-white shadow-xl shadow-gray-200/20 transition-all duration-300"
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="flex h-20 items-center justify-between px-2 sm:px-4">
        {!sidebarCollapsed && (
          <div className="overflow-hidden pl-2">
            <p className="text-lg font-black tracking-tight text-gray-900">Terminal</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">AI Intelligence</p>
          </div>
        )}
        <button 
          onClick={toggleSidebar}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors ${sidebarCollapsed ? 'mx-auto' : ''}`}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => (
          <button
            key={item.name}
            title={sidebarCollapsed ? item.name : ''}
            className={`group flex w-full items-center gap-3 rounded-xl py-2.5 transition-all hover:bg-gray-50 ${
              sidebarCollapsed ? 'justify-center px-0' : 'px-3'
            }`}
          >
            <item.icon 
              size={20} 
              className={`shrink-0 transition-colors ${
                item.name === 'Dashboard' ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-900'
              }`} 
            />
            {!sidebarCollapsed && (
              <span className={`text-sm font-bold tracking-tight ${
                item.name === 'Dashboard' ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'
              }`}>
                {item.name}
              </span>
            )}
          </button>
        ))}
      </div>

      {!sidebarCollapsed && (
        <div className="border-t border-gray-50 p-4">
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-blue-700">Pro Feature</p>
            <p className="mt-1 text-[11px] font-bold text-blue-600">Upgrade for real-time deep scans</p>
          </div>
        </div>
      )}
    </nav>
  )
}
