import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount)
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`
  if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`
  if (marketCap >= 1e3) return `$${(marketCap / 1e3).toFixed(2)}K`
  return `$${marketCap.toFixed(2)}`
}

export function formatVolume(volume: number): string {
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`
  return volume.toFixed(2)
}

export function getChangeColor(value: number): string {
  if (value > 0) return 'text-success-600'
  if (value < 0) return 'text-danger-600'
  return 'text-gray-600'
}

export function getChangeBgColor(value: number): string {
  if (value > 0) return 'bg-success-100 text-success-800'
  if (value < 0) return 'bg-danger-100 text-danger-800'
  return 'bg-gray-100 text-gray-800'
}
