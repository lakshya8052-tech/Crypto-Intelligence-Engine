'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

// Types
export interface Coin {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  change7d: number
  marketCap: number
  volume24h: number
  circulatingSupply: number
  sparkline: number[]
  lastUpdated: number
}

export interface Signal {
  id: string
  coin: string
  coinId: string
  type: 'BUY' | 'SELL'
  strategy: string
  confidence: number
  targetPrice: number
  currentPrice: number
  timestamp: string
  explanation: string
  status: 'active' | 'completed' | 'failed'
  riskLevel: 'low' | 'medium' | 'high'
}

export interface MarketStats {
  totalMarketCap: number
  totalVolume24h: number
  marketCapChange24h: number
  volumeChange24h: number
  btcDominance: number
  ethDominance: number
  activeCryptocurrencies: number
}

// State interface
interface AppState {
  coins: Coin[]
  signals: Signal[]
  watchlist: string[]
  marketStats: MarketStats
  isLoading: boolean
  mode: 'beginner' | 'advanced'
  lastUpdate: number
}

// Action types
type AppAction =
  | { type: 'SET_COINS'; payload: Coin[] }
  | { type: 'UPDATE_COIN_PRICE'; payload: { id: string; price: number; change24h: number } }
  | { type: 'SET_SIGNALS'; payload: Signal[] }
  | { type: 'UPDATE_SIGNAL_CONFIDENCE'; payload: { id: string; confidence: number } }
  | { type: 'ADD_TO_WATCHLIST'; payload: string }
  | { type: 'REMOVE_FROM_WATCHLIST'; payload: string }
  | { type: 'SET_WATCHLIST'; payload: string[] }
  | { type: 'SET_MARKET_STATS'; payload: MarketStats }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MODE'; payload: 'beginner' | 'advanced' }
  | { type: 'UPDATE_MARKET_STATS'; payload: Partial<MarketStats> }

// Initial state
const initialState: AppState = {
  coins: [],
  signals: [],
  watchlist: [],
  marketStats: {
    totalMarketCap: 2.5e12,
    totalVolume24h: 120e9,
    marketCapChange24h: 2.3,
    volumeChange24h: -1.8,
    btcDominance: 48.5,
    ethDominance: 18.2,
    activeCryptocurrencies: 23456,
  },
  isLoading: true,
  mode: 'beginner',
  lastUpdate: Date.now(),
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_COINS':
      return { ...state, coins: action.payload, lastUpdate: Date.now() }
    case 'UPDATE_COIN_PRICE':
      return {
        ...state,
        coins: state.coins.map(coin =>
          coin.id === action.payload.id
            ? { ...coin, price: action.payload.price, change24h: action.payload.change24h, lastUpdated: Date.now() }
            : coin
        ),
        lastUpdate: Date.now(),
      }
    case 'SET_SIGNALS':
      return { ...state, signals: action.payload, lastUpdate: Date.now() }
    case 'UPDATE_SIGNAL_CONFIDENCE':
      return {
        ...state,
        signals: state.signals.map(signal =>
          signal.id === action.payload.id
            ? { ...signal, confidence: action.payload.confidence }
            : signal
        ),
        lastUpdate: Date.now(),
      }
    case 'ADD_TO_WATCHLIST':
      {
        const payload = String(action.payload)
        const up = payload.toUpperCase()
        const exists = state.watchlist.some(w => w.toUpperCase() === up)
        if (exists) return state
        return { ...state, watchlist: [...state.watchlist, up] }
      }
    case 'REMOVE_FROM_WATCHLIST':
      {
        const payload = String(action.payload)
        const up = payload.toUpperCase()
        return { ...state, watchlist: state.watchlist.filter(id => id.toUpperCase() !== up) }
      }
    case 'SET_WATCHLIST':
      {
        const arr = Array.isArray(action.payload)
          ? action.payload.map(s => String(s))
          : []
        // If any item is lowercase, normalize all to uppercase, otherwise keep as-is
        const needNormalize = arr.some(s => s !== s.toUpperCase())
        const normalized = needNormalize ? Array.from(new Set(arr.map(s => s.toUpperCase()))) : Array.from(new Set(arr))
        return { ...state, watchlist: normalized }
      }
    case 'SET_MARKET_STATS':
      return { ...state, marketStats: action.payload, lastUpdate: Date.now() }
    case 'UPDATE_MARKET_STATS':
      return { ...state, marketStats: { ...state.marketStats, ...action.payload }, lastUpdate: Date.now() }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_MODE':
      return { ...state, mode: action.payload }
    default:
      return state
  }
}

// Context
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | null>(null)

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Demo mode flag (controlled at runtime via window.__CRYPTO_SIGNALS_DEMO === true)
  const isDemoMode = typeof window !== 'undefined' && (window as any).__CRYPTO_SIGNALS_DEMO === true

  // Guarded dispatch enforces single-write paths for sensitive state (market/coindata/signals)
  const guardedDispatch: React.Dispatch<AppAction> = (action: AppAction) => {
    try {
      const sensitiveTypes = [
        'SET_COINS',
        'UPDATE_COIN_PRICE',
        'SET_SIGNALS',
        'UPDATE_SIGNAL_CONFIDENCE',
        'SET_MARKET_STATS',
        'UPDATE_MARKET_STATS',
      ]

      // If action is not sensitive, allow freely (UI/local state)
      if (!sensitiveTypes.includes(action.type)) {
        dispatch(action)
        return
      }

      // For sensitive actions, require explicit source tag
      const src = (action as any).source as string | undefined
      if (src === 'backend') {
        // Backend updates always allowed
        dispatch(action)
        return
      }

      if (src === 'demo') {
        // Demo updates allowed only when demo mode is enabled
        if (isDemoMode) {
          dispatch(action)
        } else {
          console.warn('Ignored demo update in production mode:', action.type)
        }
        return
      }

      // Unknown or missing source -> reject sensitive updates
      console.warn('Rejected sensitive state update without valid source:', action)
    } catch (err) {
      console.error('guardedDispatch error', err)
    }
  }

  // Load watchlist from localStorage on mount
  useEffect(() => {
    // SSR-safety: only run in browser
    if (typeof window === 'undefined') return

    try {
      const storedWatchlist = localStorage.getItem('crypto-watchlist')
      if (storedWatchlist) {
        const parsed = JSON.parse(storedWatchlist)
        if (Array.isArray(parsed)) {
          const normalized = Array.from(new Set(parsed.map((s: any) => String(s))))
          dispatch({ type: 'SET_WATCHLIST', payload: normalized })
        }
      }
    } catch (error) {
      console.error('Failed to load watchlist from localStorage:', error)
    }

    // Load mode from localStorage (keep existing key)
    try {
      const storedMode = localStorage.getItem('crypto-mode')
      if (storedMode === 'beginner' || storedMode === 'advanced') {
        dispatch({ type: 'SET_MODE', payload: storedMode })
      }
    } catch (error) {
      console.error('Failed to load mode from localStorage:', error)
    }
  }, [])

  // Save watchlist to localStorage when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('crypto-watchlist', JSON.stringify(state.watchlist))
    } catch (error) {
      console.error('Failed to save watchlist to localStorage:', error)
    }
  }, [state.watchlist])

  // Save mode to localStorage when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('crypto-mode', state.mode)
    } catch (error) {
      console.error('Failed to save mode to localStorage:', error)
    }
  }, [state.mode])

  return (
    <AppContext.Provider value={{ state, dispatch: guardedDispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// Hook
export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// Helper functions for common operations
export function useWatchlist() {
  const { state, dispatch } = useApp()

  const addToWatchlist = (coinId: string) => {
    if (!coinId) return
    const sym = coinId.toUpperCase()
    // Prevent duplicates (case-insensitive)
    if (state.watchlist.map(s => s.toUpperCase()).includes(sym)) return
    dispatch({ type: 'ADD_TO_WATCHLIST', payload: sym })
  }

  const removeFromWatchlist = (coinId: string) => {
    if (!coinId) return
    const sym = coinId.toUpperCase()
    // Remove case-insensitively
    const exists = state.watchlist.map(s => s.toUpperCase()).includes(sym)
    if (!exists) return
    dispatch({ type: 'REMOVE_FROM_WATCHLIST', payload: sym })
  }

  const isInWatchlist = (coinId: string) => {
    if (!coinId) return false
    return state.watchlist.map(s => s.toUpperCase()).includes(coinId.toUpperCase())
  }

  return {
    watchlist: state.watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
  }
}

export function useMode() {
  const { state, dispatch } = useApp()

  const setMode = (mode: 'beginner' | 'advanced') => {
    dispatch({ type: 'SET_MODE', payload: mode })
  }

  return {
    mode: state.mode,
    setMode,
  }
}
