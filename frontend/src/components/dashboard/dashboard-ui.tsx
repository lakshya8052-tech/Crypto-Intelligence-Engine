'use client'

export function WidgetHeader({ title, lastUpdated }: { title: string; lastUpdated?: Date | null }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-gray-50 pb-4 mb-4">
      <h2 className="text-base font-bold tracking-tight text-gray-900 sm:text-lg">{title}</h2>
      {lastUpdated && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <span>Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}
    </div>
  )
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-xl border border-gray-50 bg-white p-4 shadow-sm">
          <div className="h-4 w-24 animate-pulse rounded-full bg-gray-100" />
          <div className="mt-3 h-3 w-48 animate-pulse rounded-full bg-gray-50" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50 p-8 text-center">
      <p className="text-sm font-medium text-gray-500 max-w-[200px]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
      >
        Refresh Data
      </button>
    </div>
  )
}
