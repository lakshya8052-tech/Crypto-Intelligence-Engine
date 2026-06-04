'use client'

export interface Opportunity {
  id: string
  type: 'breakout' | 'momentum' | 'reversal' | 'oversold' | 'volume_spike' | 'trend_continuation'
  coinId: string
  coinSymbol: string
  coinName: string
  currentPrice: number
  targetPrice: number
  confidence: number
  riskLevel: 'low' | 'medium' | 'high' | 'very_high'
  timeframe: '1h' | '4h' | '24h' | '7d'
  description: string
  indicators: string[]
  timestamp: number
  isActive: boolean
  status: 'active' | 'triggered' | 'expired' | 'missed'
  entryZone?: {
    min: number
    max: number
    reasoning: string
  }
  exitZone?: {
    targets: number[]
    stopLoss: number
    reasoning: string
  }
}

export interface MarketOpportunityFeed {
  opportunities: Opportunity[]
  lastUpdated: number
  marketMood: 'bullish' | 'bearish' | 'neutral' | 'volatile'
  volatilityLevel: 'low' | 'medium' | 'high'
  sectorRotation: string[]
  topPerformers: string[]
  weakPerformers: string[]
}

export class RealTimeOpportunityEngine {
  // When true, the engine will run its simulation loops. Default false => production-safe.
  public isDemoMode: boolean = false
  private opportunities: Map<string, Opportunity> = new Map()
  private callbacks: Set<() => void> = new Set()
  private interval: NodeJS.Timeout | null = null
  private marketFeed: MarketOpportunityFeed = {
    opportunities: [],
    lastUpdated: Date.now(),
    marketMood: 'neutral',
    volatilityLevel: 'medium',
    sectorRotation: [],
    topPerformers: [],
    weakPerformers: []
  }

  constructor() {
    // Only load demo opportunities when running in the browser AND demo mode is enabled
    if (typeof window !== "undefined" && this.isDemoMode) {
      this.loadOpportunities()
    }
  }

  // Subscribe to opportunity updates
  subscribe(callback: () => void) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  // Start opportunity engine
  start() {
    // Only start simulation loops when demo mode is explicitly enabled
    if (!this.isDemoMode) return
    if (this.interval) return

    this.interval = setInterval(() => {
      this.updateOpportunities()
      this.updateMarketFeed()
      this.notifySubscribers()
    }, 5000) // Update every 5 seconds
  }

  // Stop opportunity engine
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  // Get current opportunities
  getOpportunities(): Opportunity[] {
    // In production (non-demo) do not expose internal demo opportunities
    if (!this.isDemoMode) return []
    return Array.from(this.opportunities.values()).sort((a, b) => b.confidence - a.confidence)
  }

  // Get market opportunity feed
  getMarketFeed(): MarketOpportunityFeed {
    // In production (non-demo) do not expose internal demo market feed
    if (!this.isDemoMode) {
      return {
        opportunities: [],
        lastUpdated: Date.now(),
        marketMood: 'neutral',
        volatilityLevel: 'medium',
        sectorRotation: [],
        topPerformers: [],
        weakPerformers: []
      }
    }
    return this.marketFeed
  }

  // Generate new opportunity
  generateOpportunity(coinId: string, coinSymbol: string, coinName: string, currentPrice: number): Opportunity {
    const opportunityTypes = ['breakout', 'momentum', 'reversal', 'oversold', 'volume_spike', 'trend_continuation']
    const timeframes = ['1h', '4h', '24h', '7d']
    const riskLevels = ['low', 'medium', 'high', 'very_high']
    
    // Dynamic opportunity generation based on market conditions
    const type = opportunityTypes[Math.floor(Math.random() * opportunityTypes.length)] as Opportunity['type']
    const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)] as Opportunity['timeframe']
    
    // Calculate target price based on type
    let targetPrice = currentPrice
    let confidence = 50
    let riskLevel: Opportunity['riskLevel'] = 'medium'
    let description = ''
    let indicators: string[] = []
    
    switch (type) {
      case 'breakout':
        targetPrice = currentPrice * (1.05 + Math.random() * 0.1)
        confidence = 65 + Math.random() * 25
        riskLevel = Math.random() > 0.5 ? 'high' : 'medium'
        description = `${coinName} is approaching key resistance level with increasing volume`
        indicators = [
          'Price testing resistance zone',
          'Volume above average',
          'RSI showing bullish momentum',
          'MACD histogram turning positive'
        ]
        break
        
      case 'momentum':
        targetPrice = currentPrice * (1.03 + Math.random() * 0.08)
        confidence = 70 + Math.random() * 20
        riskLevel = 'medium'
        description = `${coinName} showing strong upward momentum with consistent buying pressure`
        indicators = [
          'Strong volume support',
          'Price above key moving averages',
          'Momentum indicators aligned',
          'Trend structure intact'
        ]
        break
        
      case 'reversal':
        targetPrice = currentPrice * (0.95 + Math.random() * 0.05)
        confidence = 55 + Math.random() * 25
        riskLevel = 'high'
        description = `${coinName} showing signs of potential trend reversal after extended rally`
        indicators = [
          'Divergence between price and momentum',
          'Volume decreasing on uptrend',
          'RSI showing bearish divergence',
          'Key resistance levels being tested'
        ]
        break
        
      case 'oversold':
        targetPrice = currentPrice * (1.08 + Math.random() * 0.12)
        confidence = 75 + Math.random() * 15
        riskLevel = Math.random() > 0.3 ? 'medium' : 'low'
        description = `${coinName} appears oversold after recent price decline, potential bounce opportunity`
        indicators = [
          'RSI in oversold territory',
          'Price near key support levels',
          'Volume spike detected',
          'Historical support levels holding'
        ]
        break
        
      case 'volume_spike':
        targetPrice = currentPrice * (1.02 + Math.random() * 0.06)
        confidence = 60 + Math.random() * 30
        riskLevel = Math.random() > 0.4 ? 'high' : 'medium'
        description = `${coinName} experiencing unusual volume spike, suggesting significant price movement`
        indicators = [
          'Volume 3x+ above average',
          'Price moving rapidly',
          'Increased market participation',
          'Volatility expansion detected'
        ]
        break
        
      case 'trend_continuation':
        targetPrice = currentPrice * (1.04 + Math.random() * 0.08)
        confidence = 68 + Math.random() * 20
        riskLevel = 'medium'
        description = `${coinName} trend structure suggests continuation of current momentum`
        indicators = [
          'Higher highs and higher lows',
          'Trend line support intact',
          'Moving averages aligned',
          'Consistent volume patterns'
        ]
        break
    }
    
    // Generate entry and exit zones
    const entryZone = {
      min: currentPrice * 0.98,
      max: currentPrice * 1.02,
      reasoning: `Safe entry zone based on current volatility and risk level`
    }
    
    const exitZone = {
      targets: [
        currentPrice * 1.08,
        currentPrice * 1.15,
        currentPrice * 1.25
      ],
      stopLoss: currentPrice * 0.95,
      reasoning: `Profit targets and stop-loss based on ${type} opportunity type`
    }

    return {
      id: `${coinId}-${Date.now()}-${Math.random()}`,
      type,
      coinId,
      coinSymbol,
      coinName,
      currentPrice,
      targetPrice,
      confidence: Math.round(confidence),
      riskLevel,
      timeframe,
      description,
      indicators,
      timestamp: Date.now(),
      isActive: true,
      status: 'active',
      entryZone,
      exitZone
    }
  }

  // Update opportunities with realistic variations
  private updateOpportunities() {
    const coins = [
      { id: '1', symbol: 'BTC', name: 'Bitcoin', price: 43250 },
      { id: '2', symbol: 'ETH', name: 'Ethereum', price: 2280 },
      { id: '3', symbol: 'SOL', name: 'Solana', price: 98.45 },
      { id: '4', symbol: 'XRP', name: 'Ripple', price: 0.62 },
      { id: '5', symbol: 'DOGE', name: 'Dogecoin', price: 0.085 }
    ]

    // Generate new opportunities
    const newOpportunities: Opportunity[] = []
    
    coins.forEach(coin => {
      // 30% chance to generate new opportunity for each coin
      if (Math.random() > 0.7) {
        const opportunity = this.generateOpportunity(coin.id, coin.symbol, coin.name, coin.price)
        newOpportunities.push(opportunity)
      }
    })

    // Update existing opportunities with price changes and status updates
    this.opportunities.forEach((opportunity, id) => {
      const coin = coins.find(c => c.id === opportunity.coinId)
      if (coin) {
        // Update price
        opportunity.currentPrice = coin.price * (1 + (Math.random() - 0.5) * 0.002)
        
        // Update status based on time and conditions
        const age = Date.now() - opportunity.timestamp
        if (age > 3600000) { // 1 hour old
          opportunity.status = Math.random() > 0.5 ? 'expired' : 'active'
          opportunity.isActive = false
        } else if (Math.random() > 0.9) { // 10% chance to trigger
          opportunity.status = 'triggered'
          opportunity.isActive = false
        }
        
        // Update confidence decay
        opportunity.confidence = Math.max(25, opportunity.confidence - (age / 3600000) * 5)
      }
    })

    // Add new opportunities and maintain limit
    const allOpportunities = [...newOpportunities, ...Array.from(this.opportunities.values())]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20) // Keep top 20 opportunities

    this.opportunities.clear()
    allOpportunities.forEach(opp => this.opportunities.set(opp.id, opp))
    
    this.saveOpportunities()
  }

  // Update market feed
  private updateMarketFeed() {
    const opportunities = Array.from(this.opportunities.values())
    
    // Calculate market mood
    const bullishCount = opportunities.filter(opp => opp.type === 'breakout' || opp.type === 'momentum').length
    const bearishCount = opportunities.filter(opp => opp.type === 'reversal').length
    const totalCount = opportunities.length
    
    let marketMood: MarketOpportunityFeed['marketMood'] = 'neutral'
    if (bullishCount > bearishCount + 2) {
      marketMood = 'bullish'
    } else if (bearishCount > bullishCount + 2) {
      marketMood = 'bearish'
    } else if (totalCount > 10) {
      marketMood = 'volatile'
    }

    // Calculate volatility level
    const highRiskCount = opportunities.filter(opp => opp.riskLevel === 'high' || opp.riskLevel === 'very_high').length
    const volatilityLevel = highRiskCount > totalCount * 0.4 ? 'high' : 
                         highRiskCount > totalCount * 0.2 ? 'medium' : 'low'

    // Generate sector rotation
    const sectors = [
      'DeFi tokens showing strength',
      'Layer 1 solutions gaining momentum',
      'Meme coins experiencing volatility',
      'Privacy coins seeing increased interest',
      'Gaming tokens consolidating',
      'Infrastructure tokens maintaining stability'
    ]

    // Calculate top and weak performers
    const coinPerformance = new Map<string, number>()
    opportunities.forEach(opp => {
      const currentPerf = coinPerformance.get(opp.coinId) || 0
      coinPerformance.set(opp.coinId, currentPerf + (Math.random() - 0.5) * 2)
    })

    const sortedCoins = Array.from(coinPerformance.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)

    this.marketFeed = {
      opportunities,
      lastUpdated: Date.now(),
      marketMood,
      volatilityLevel,
      sectorRotation: sectors.slice(0, 3),
      topPerformers: sortedCoins.slice(0, 3).map(([coinId]) => coinId),
      weakPerformers: sortedCoins.slice(-3).map(([coinId]) => coinId)
    }
  }

  // Mark opportunity as viewed
  markOpportunityViewed(opportunityId: string) {
    const opportunity = this.opportunities.get(opportunityId)
    if (opportunity) {
      opportunity.isActive = false
      this.saveOpportunities()
    }
  }

  // Save opportunities to localStorage
  private saveOpportunities() {
    if (typeof window === "undefined") {
      return
    }
    const opportunities = Array.from(this.opportunities.values())
    localStorage.setItem("real-time-opportunities", JSON.stringify(opportunities))
  }

  // Load opportunities from localStorage
  private loadOpportunities() {
    if (typeof window === "undefined") {
      return
    }
    const stored = localStorage.getItem("real-time-opportunities")
    if (stored) {
      try {
        const opportunities = JSON.parse(stored)
        opportunities.forEach((opp: Opportunity) => {
          this.opportunities.set(opp.id, opp)
        })
      } catch (error) {
        console.error("Failed to load opportunities from localStorage:", error)
      }
    }
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.callbacks.forEach(callback => callback())
  }
}

// Global instance
export const realTimeOpportunityEngine = new RealTimeOpportunityEngine()

/**
 * Fetch the current market opportunity feed from the real-time engine.
 * This helper is client-only and will start the engine if it isn't running.
 *
 * @param options.waitMs Optional milliseconds to wait before returning the feed (useful to let the engine run one update tick)
 * @param options.ensureStart Whether to ensure the engine is started (default: true)
 */
export async function getMarketData(options?: { waitMs?: number; ensureStart?: boolean }): Promise<MarketOpportunityFeed> {
  if (typeof window === 'undefined') {
    // Server environment — return an empty/default feed to avoid runtime errors.
    return {
      opportunities: [],
      lastUpdated: Date.now(),
      marketMood: 'neutral',
      volatilityLevel: 'medium',
      sectorRotation: [],
      topPerformers: [],
      weakPerformers: []
    }
  }

  const ensureStart = options?.ensureStart ?? true
  if (ensureStart) {
    realTimeOpportunityEngine.start()
  }

  if (options?.waitMs && options.waitMs > 0) {
    await new Promise(resolve => setTimeout(resolve, options.waitMs))
  }

  return realTimeOpportunityEngine.getMarketFeed()
}
