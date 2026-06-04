'use client'

// Mock data generator for live simulation
export interface LiveCoinData {
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
}

export interface LiveSignalData {
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

export interface LiveMarketStats {
  totalMarketCap: number
  totalVolume24h: number
  marketCapChange24h: number
  volumeChange24h: number
  btcDominance: number
  ethDominance: number
  activeCryptocurrencies: number
}

// Base mock data
const baseCoins: LiveCoinData[] = [
  {
    id: '1',
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 43250.00,
    change24h: 5.2,
    change7d: 12.3,
    marketCap: 845e9,
    volume24h: 28.5e9,
    circulatingSupply: 19.5e6,
    sparkline: [42000, 42500, 43000, 42800, 43250],
  },
  {
    id: '2',
    name: 'Ethereum',
    symbol: 'ETH',
    price: 2280.50,
    change24h: 3.8,
    change7d: 8.7,
    marketCap: 274e9,
    volume24h: 15.2e9,
    circulatingSupply: 120.2e6,
    sparkline: [2200, 2250, 2260, 2270, 2280],
  },
  {
    id: '3',
    name: 'Solana',
    symbol: 'SOL',
    price: 98.45,
    change24h: 8.1,
    change7d: 15.2,
    marketCap: 42e9,
    volume24h: 2.8e9,
    circulatingSupply: 426.7e6,
    sparkline: [90, 92, 95, 97, 98],
  },
  {
    id: '4',
    name: 'Cardano',
    symbol: 'ADA',
    price: 0.58,
    change24h: -2.3,
    change7d: 5.1,
    marketCap: 20e9,
    volume24h: 0.4e9,
    circulatingSupply: 34.5e9,
    sparkline: [0.60, 0.59, 0.585, 0.58, 0.58],
  },
  {
    id: '5',
    name: 'Avalanche',
    symbol: 'AVAX',
    price: 38.90,
    change24h: 6.4,
    change7d: 18.9,
    marketCap: 14e9,
    volume24h: 0.8e9,
    circulatingSupply: 360.0e6,
    sparkline: [36, 37, 38, 38.5, 38.9],
  },
  {
    id: '6',
    name: 'Polkadot',
    symbol: 'DOT',
    price: 7.85,
    change24h: 4.2,
    change7d: 9.8,
    marketCap: 9.8e9,
    volume24h: 0.3e9,
    circulatingSupply: 1.25e9,
    sparkline: [7.2, 7.4, 7.6, 7.8, 7.85],
  },
  {
    id: '7',
    name: 'Chainlink',
    symbol: 'LINK',
    price: 14.20,
    change24h: -1.5,
    change7d: 6.3,
    marketCap: 8.2e9,
    volume24h: 0.25e9,
    circulatingSupply: 577e6,
    sparkline: [14.5, 14.3, 14.1, 14.0, 14.2],
  },
  {
    id: '8',
    name: 'Polygon',
    symbol: 'MATIC',
    price: 0.92,
    change24h: 7.8,
    change7d: 22.1,
    marketCap: 8.5e9,
    volume24h: 0.35e9,
    circulatingSupply: 9.25e9,
    sparkline: [0.75, 0.80, 0.85, 0.88, 0.92],
  },
]

const baseSignals: LiveSignalData[] = [
  {
    id: '1',
    coin: 'Bitcoin',
    coinId: '1',
    type: 'BUY',
    strategy: 'RSI Oversold',
    confidence: 85,
    targetPrice: 45000,
    currentPrice: 43250,
    timestamp: '2 hours ago',
    explanation: 'RSI indicates oversold conditions, suggesting potential bounce',
    status: 'active',
    riskLevel: 'medium',
  },
  {
    id: '2',
    coin: 'Ethereum',
    coinId: '2',
    type: 'BUY',
    strategy: 'MACD Bullish',
    confidence: 78,
    targetPrice: 2400,
    currentPrice: 2280,
    timestamp: '3 hours ago',
    explanation: 'MACD shows bullish crossover with increasing momentum',
    status: 'active',
    riskLevel: 'low',
  },
  {
    id: '3',
    coin: 'Solana',
    coinId: '3',
    type: 'SELL',
    strategy: 'EMA Resistance',
    confidence: 72,
    targetPrice: 85,
    currentPrice: 98,
    timestamp: '5 hours ago',
    explanation: 'Price facing strong resistance at 200-day EMA',
    status: 'active',
    riskLevel: 'high',
  },
  {
    id: '4',
    coin: 'Cardano',
    coinId: '4',
    type: 'BUY',
    strategy: 'Bollinger Bands',
    confidence: 68,
    targetPrice: 0.65,
    currentPrice: 0.58,
    timestamp: '6 hours ago',
    explanation: 'Price touched lower Bollinger Band, suggesting oversold',
    status: 'active',
    riskLevel: 'medium',
  },
]

const baseMarketStats: LiveMarketStats = {
  totalMarketCap: 2.5e12,
  totalVolume24h: 120e9,
  marketCapChange24h: 2.3,
  volumeChange24h: -1.8,
  btcDominance: 48.5,
  ethDominance: 18.2,
  activeCryptocurrencies: 23456,
}

// Live data simulation
export class LiveDataSimulator {
  // Global demo flag - when false, simulator will not start intervals
  public isDemoMode: boolean = false
  private coins: LiveCoinData[]
  private signals: LiveSignalData[]
  private marketStats: LiveMarketStats
  private callbacks: Set<() => void> = new Set()
  private interval: NodeJS.Timeout | null = null

  constructor() {
    this.coins = JSON.parse(JSON.stringify(baseCoins))
    this.signals = JSON.parse(JSON.stringify(baseSignals))
    this.marketStats = JSON.parse(JSON.stringify(baseMarketStats))
  }

  // Subscribe to data updates
  subscribe(callback: () => void) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  // Start live simulation
  start() {
    // Only start simulation loops when demo mode is explicitly enabled
    if (!this.isDemoMode) return
    if (this.interval) return

    this.interval = setInterval(() => {
      this.updateData()
      this.notifySubscribers()
    }, 2000) // Update every 2 seconds
  }

  // Stop live simulation
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  // Get current data
  getCoins() {
    // Do not expose demo coin data in production
    if (!this.isDemoMode) return []
    return this.coins
  }

  getSignals() {
    // Do not expose demo signals in production
    if (!this.isDemoMode) return []
    return this.signals
  }

  getMarketStats() {
    // Do not expose demo market stats in production
    if (!this.isDemoMode) return {
      totalMarketCap: 0,
      totalVolume24h: 0,
      marketCapChange24h: 0,
      volumeChange24h: 0,
      btcDominance: 0,
      ethDominance: 0,
      activeCryptocurrencies: 0,
    }
    return this.marketStats
  }

  // Update data with realistic variations
  private updateData() {
    // Only update demo data when demo mode is enabled
    if (!this.isDemoMode) return

    // Update coin prices
    this.coins = this.coins.map(coin => {
      const priceChange = (Math.random() - 0.5) * coin.price * 0.002 // ±0.2% change
      const newPrice = coin.price + priceChange
      const priceChangePercent = (priceChange / coin.price) * 100
      
      // Update 24h change gradually
      const newChange24h = coin.change24h + (Math.random() - 0.5) * 0.1
      
      // Update sparkline (keep last 5 points, add new price)
      const newSparkline = [...coin.sparkline.slice(1), newPrice]

      return {
        ...coin,
        price: newPrice,
        change24h: newChange24h,
        sparkline: newSparkline,
      }
    })

    // Update signal confidence
    this.signals = this.signals.map(signal => {
      const confidenceChange = (Math.random() - 0.5) * 2 // ±1% change
      const newConfidence = Math.max(50, Math.min(95, signal.confidence + confidenceChange))
      
      return {
        ...signal,
        confidence: newConfidence,
      }
    })

    // Update market stats
    this.marketStats = {
      ...this.marketStats,
      totalMarketCap: this.marketStats.totalMarketCap * (1 + (Math.random() - 0.5) * 0.001),
      totalVolume24h: this.marketStats.totalVolume24h * (1 + (Math.random() - 0.5) * 0.002),
      marketCapChange24h: this.marketStats.marketCapChange24h + (Math.random() - 0.5) * 0.05,
      volumeChange24h: this.marketStats.volumeChange24h + (Math.random() - 0.5) * 0.05,
      btcDominance: this.marketStats.btcDominance + (Math.random() - 0.5) * 0.1,
      ethDominance: this.marketStats.ethDominance + (Math.random() - 0.5) * 0.1,
    }
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.callbacks.forEach(callback => callback())
  }
}

// Global instance
export const liveDataSimulator = new LiveDataSimulator()
