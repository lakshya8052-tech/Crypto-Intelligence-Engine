'use client'

import { apiClient } from '@/lib/api-client'

export const DASHBOARD_SYMBOLS = ['BTC', 'ETH', 'SOL', 'AVAX', 'DOT', 'ADA', 'XRP', 'LINK', 'MATIC', 'UNI', 'BNB']
export const WATCHLIST_SYMBOLS = ['BTC', 'ETH', 'BNB', 'XRP']
export const SIGNAL_SYMBOLS = ['BTC', 'ETH', 'SOL', 'MATIC']

// Cache configuration
const CACHE_TTL_MS = 30000 // 30 seconds

export interface MarketData {
  symbol: string
  price: number
  change_24h: number
  volume: number
  timestamp: string
}

export interface SignalData {
  symbol: string
  signal: string
  confidence: number
  score?: number
  momentum?: number
  analysis?: {
    market_trend?: string
    risk_level?: string
    daily_score?: number
    daily_recommendation?: string
    volatility?: string
  }
}

export interface OpportunityData {
  symbol: string
  daily_score: number
  daily_recommendation: string
  market_trend: string
  volatility: string
  risk_level: string
  confidence: number
}

export interface DashboardFetchResult<T> {
  data: T[]
  error: string | null
}

interface CacheEntry<T> {
  promise: Promise<T | null>
  timestamp: number
}

const marketCache = new Map<string, CacheEntry<MarketData>>()
const signalCache = new Map<string, CacheEntry<SignalData>>()
let opportunityCache: CacheEntry<OpportunityData[]> | null = null

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function asString(value: unknown, fallback = 'Unavailable'): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function normalizeMarketData(value: unknown): MarketData | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (!isFiniteNumber(item.price) || !isFiniteNumber(item.change_24h) || !isFiniteNumber(item.volume)) return null

  return {
    symbol: asString(item.symbol),
    price: item.price,
    change_24h: item.change_24h,
    volume: item.volume,
    timestamp: asString(item.timestamp, ''),
  }
}

function normalizeSignalData(value: unknown): SignalData | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (!isFiniteNumber(item.confidence)) return null

  const analysis = item.analysis && typeof item.analysis === 'object' ? item.analysis as Record<string, unknown> : {}

  return {
    symbol: asString(item.symbol),
    signal: asString(item.signal, 'HOLD'),
    confidence: item.confidence,
    score: isFiniteNumber(item.score) ? item.score : undefined,
    momentum: isFiniteNumber(item.momentum) ? item.momentum : undefined,
    analysis: {
      market_trend: typeof analysis.market_trend === 'string' ? analysis.market_trend : undefined,
      risk_level: typeof analysis.risk_level === 'string' ? analysis.risk_level : undefined,
      daily_score: isFiniteNumber(analysis.daily_score) ? analysis.daily_score : undefined,
      daily_recommendation: typeof analysis.daily_recommendation === 'string' ? analysis.daily_recommendation : undefined,
      volatility: typeof analysis.volatility === 'string' ? analysis.volatility : undefined,
    },
  }
}

function normalizeOpportunityData(value: unknown): OpportunityData | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (!isFiniteNumber(item.daily_score) || !isFiniteNumber(item.confidence)) return null

  return {
    symbol: asString(item.symbol),
    daily_score: item.daily_score,
    daily_recommendation: asString(item.daily_recommendation),
    market_trend: asString(item.market_trend),
    volatility: asString(item.volatility),
    risk_level: asString(item.risk_level),
    confidence: item.confidence,
  }
}

async function fetchMarket(symbol: string): Promise<MarketData | null> {
  const key = symbol.toUpperCase()
  const now = Date.now()
  const cached = marketCache.get(key)

  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.promise
  }

  const promise = apiClient.get<MarketData>(`/market/${key}`).then((response) => {
    // Only delete if this promise is still the one in the cache to avoid race conditions
    const current = marketCache.get(key)
    const shouldInvalidate = response.error || !normalizeMarketData(response.data)
    
    if (shouldInvalidate && current?.promise === promise) {
      marketCache.delete(key)
    }
    
    return normalizeMarketData(response.data)
  })

  marketCache.set(key, { promise, timestamp: now })
  return promise
}

async function fetchSignal(symbol: string): Promise<SignalData | null> {
  const key = symbol.toUpperCase()
  const now = Date.now()
  const cached = signalCache.get(key)

  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.promise
  }

  const promise = apiClient.get<SignalData>(`/signal/${key}`).then((response) => {
    const current = signalCache.get(key)
    const shouldInvalidate = response.error || !normalizeSignalData(response.data)
    
    if (shouldInvalidate && current?.promise === promise) {
      signalCache.delete(key)
    }
    
    return normalizeSignalData(response.data)
  })

  signalCache.set(key, { promise, timestamp: now })
  return promise
}

export async function fetchMarkets(symbols: string[], options?: { refresh?: boolean }): Promise<DashboardFetchResult<MarketData>> {
  if (options?.refresh) {
    symbols.forEach((symbol) => marketCache.delete(symbol.toUpperCase()))
  }

  const responses = await Promise.all(
    symbols.map((symbol) => fetchMarket(symbol))
  )

  const data = responses.filter((item): item is MarketData => Boolean(item))
  let error = null
  if (data.length === 0) {
    error = 'Provider unavailable'
  } else if (data.length < symbols.length) {
    error = `Partial data available (${data.length}/${symbols.length})`
  }

  return { data, error }
}

export async function fetchSignals(symbols: string[], options?: { refresh?: boolean }): Promise<DashboardFetchResult<SignalData>> {
  if (options?.refresh) {
    symbols.forEach((symbol) => signalCache.delete(symbol.toUpperCase()))
  }

  const responses = await Promise.all(
    symbols.map((symbol) => fetchSignal(symbol))
  )

  const data = responses.filter((item): item is SignalData => Boolean(item))
  let error = null
  if (data.length === 0) {
    error = 'Provider unavailable'
  } else if (data.length < symbols.length) {
    error = `Partial signals available (${data.length}/${symbols.length})`
  }

  return { data, error }
}

export async function fetchOpportunities(options?: { refresh?: boolean }): Promise<DashboardFetchResult<OpportunityData>> {
  const now = Date.now()
  if (options?.refresh) opportunityCache = null

  if (opportunityCache && (now - opportunityCache.timestamp < CACHE_TTL_MS)) {
    const cachedData = await opportunityCache.promise
    const data = cachedData ?? []
    return {
      data,
      error: data.length === 0 ? 'No live opportunities available' : null,
    }
  }

  const promise = apiClient.get<OpportunityData[]>('/opportunities').then((response) => {
    const isInvalid = response.error || !Array.isArray(response.data)
    
    if (isInvalid || !response.data) {
      if (opportunityCache?.promise === promise) opportunityCache = null
      return []
    }
    
    const normalized = response.data
      .map((item) => normalizeOpportunityData(item))
      .filter((item): item is OpportunityData => Boolean(item))
    
    if (normalized.length === 0 && opportunityCache?.promise === promise) {
      opportunityCache = null
    }
    
    return normalized
  })

  opportunityCache = { promise, timestamp: now }
  const data = (await promise) ?? []

  return {
    data,
    error: data.length === 0 ? 'No live opportunities available' : null,
  }
}

export function formatUsd(value: number): string {
  if (!isFiniteNumber(value)) return 'No data available'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100 ? 2 : 6,
  }).format(value)
}

export function formatCompactUsd(value: number): string {
  if (!isFiniteNumber(value)) return 'No data available'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  if (!isFiniteNumber(value)) return 'No data available'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function changeClass(value: number): string {
  return value >= 0 ? 'text-sm font-semibold text-green-600' : 'text-sm font-semibold text-red-600'
}
