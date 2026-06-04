'use client'

export interface PredictionData {
  coinId: string
  coinSymbol: string
  coinName: string
  currentPrice: number
  predictions: {
    shortTerm: {
      direction: 'bullish' | 'bearish' | 'neutral'
      probability: number
      targetPrice: number
      timeframe: '1h' | '4h' | '24h'
      confidence: number
    }
    momentum: {
      strength: 'strong' | 'moderate' | 'weak'
      direction: 'increasing' | 'decreasing' | 'stable'
      probability: number
      timeframe: '24h' | '7d'
    }
    trend: {
      continuation: 'likely' | 'unlikely' | 'neutral'
      probability: number
      pattern: 'uptrend' | 'downtrend' | 'sideways' | 'reversal'
      strength: number
    }
  }
  technicalIndicators: {
    rsi: number
    macd: {
      line: number
      signal: number
      histogram: number
    }
    ema: {
      short: number
      long: number
    }
    momentum: number
    volume: {
      current: number
      average: number
      ratio: number
    }
  }
  lastUpdated: number
}

export interface MarketPrediction {
  overall: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  summary: string
  keySignals: string[]
  timeframe: string
}

export class AIPredictorEngine {
  private predictions: Map<string, PredictionData> = new Map()
  private callbacks: Set<() => void> = new Set()
  private interval: NodeJS.Timeout | null = null
  // Demo gate: when false, engine must be inert and perform no computations or side-effects
  public isDemoMode: boolean = false

  constructor() {
    // Only initialize demo predictions when explicitly in demo mode
    if (this.isDemoMode) {
      this.initializePredictions()
    }
  }

  // Subscribe to prediction updates
  subscribe(callback: () => void) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  // Start prediction engine
  start() {
    // Do not start any background timers in production (must be demo mode)
    if (!this.isDemoMode) return
    if (this.interval) return

    this.interval = setInterval(() => {
      this.updatePredictions()
      this.notifySubscribers()
    }, 6000) // Update every 6 seconds
  }

  // Stop prediction engine
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  // Get prediction for specific coin
  getPrediction(coinId: string): PredictionData | null {
    if (!this.isDemoMode) return null
    return this.predictions.get(coinId) || null
  }

  // Get all predictions
  getAllPredictions(): PredictionData[] {
    if (!this.isDemoMode) return []
    return Array.from(this.predictions.values())
  }

  // Get market-wide prediction
  getMarketPrediction(): MarketPrediction {
    const allPredictions = this.getAllPredictions()
    
    if (allPredictions.length === 0) {
      return {
        overall: 'neutral',
        confidence: 50,
        summary: 'Insufficient data for market prediction',
        keySignals: [],
        timeframe: '24h'
      }
    }

    // Calculate overall market sentiment
    const bullishCount = allPredictions.filter(p => p.predictions.shortTerm.direction === 'bullish').length
    const bearishCount = allPredictions.filter(p => p.predictions.shortTerm.direction === 'bearish').length
    const neutralCount = allPredictions.filter(p => p.predictions.shortTerm.direction === 'neutral').length

    let overall: 'bullish' | 'bearish' | 'neutral'
    let confidence = 50

    if (bullishCount > bearishCount && bullishCount > neutralCount) {
      overall = 'bullish'
      confidence = Math.min(85, 50 + (bullishCount / allPredictions.length) * 35)
    } else if (bearishCount > bullishCount && bearishCount > neutralCount) {
      overall = 'bearish'
      confidence = Math.min(85, 50 + (bearishCount / allPredictions.length) * 35)
    } else {
      overall = 'neutral'
      confidence = Math.max(40, 50 - Math.abs(bullishCount - bearishCount) * 5)
    }

    // Generate key signals
    const keySignals = this.generateKeySignals(allPredictions)

    return {
      overall,
      confidence: Math.round(confidence),
      summary: this.generateMarketSummary(overall, confidence, keySignals),
      keySignals,
      timeframe: '24h'
    }
  }

  // Initialize predictions for major coins
  private initializePredictions() {
    if (!this.isDemoMode) return
    const coins = [
      { id: '1', symbol: 'BTC', name: 'Bitcoin', price: 43250 },
      { id: '2', symbol: 'ETH', name: 'Ethereum', price: 2280 },
      { id: '3', symbol: 'SOL', name: 'Solana', price: 98.45 },
      { id: '4', symbol: 'ADA', name: 'Cardano', price: 0.58 },
      { id: '5', symbol: 'AVAX', name: 'Avalanche', price: 36.82 }
    ]

    coins.forEach(coin => {
      // generatePrediction is safe because initializePredictions is only called in demo mode
      this.predictions.set(coin.id, this.generatePrediction(coin))
    })
  }

  // Generate prediction for a coin
  private generatePrediction(coin: { id: string, symbol: string, name: string, price: number }): PredictionData {
    // Guard heavy computation: should only run in demo mode
    if (!this.isDemoMode) {
      return {
        coinId: coin.id,
        coinSymbol: coin.symbol,
        coinName: coin.name,
        currentPrice: coin.price,
        predictions: {
          shortTerm: { direction: 'neutral', probability: 0, targetPrice: 0, timeframe: '4h', confidence: 0 },
          momentum: { strength: 'weak', direction: 'stable', probability: 0, timeframe: '24h' },
          trend: { continuation: 'neutral', probability: 0, pattern: 'sideways', strength: 0 }
        },
        technicalIndicators: this.generateTechnicalIndicators(coin.price),
        lastUpdated: Date.now()
      }
    }

    const technicalIndicators = this.generateTechnicalIndicators(coin.price)
    const predictions = this.generatePredictions(technicalIndicators)

    return {
      coinId: coin.id,
      coinSymbol: coin.symbol,
      coinName: coin.name,
      currentPrice: coin.price,
      predictions,
      technicalIndicators,
      lastUpdated: Date.now()
    }
  }

  // Generate technical indicators
  private generateTechnicalIndicators(currentPrice: number) {
    if (!this.isDemoMode) {
      // Return neutral/default indicators when not in demo mode
      return {
        rsi: 50,
        macd: { line: 0, signal: 0, histogram: 0 },
        ema: { short: currentPrice, long: currentPrice },
        momentum: 0,
        volume: { current: 0, average: 0, ratio: 0 }
      }
    }
    // Simulate realistic technical indicators
    const rsi = 30 + Math.random() * 40 // RSI between 30-70
    const macdLine = (Math.random() - 0.5) * 2
    const macdSignal = (Math.random() - 0.5) * 1.8
    const macdHistogram = macdLine - macdSignal
    const emaShort = currentPrice * (0.98 + Math.random() * 0.04)
    const emaLong = currentPrice * (0.95 + Math.random() * 0.08)
    const momentum = (Math.random() - 0.5) * 10
    const volumeCurrent = 1000000 + Math.random() * 5000000
    const volumeAverage = 800000 + Math.random() * 2000000
    const volumeRatio = volumeCurrent / volumeAverage

    return {
      rsi: Math.round(rsi * 100) / 100,
      macd: {
        line: Math.round(macdLine * 1000) / 1000,
        signal: Math.round(macdSignal * 1000) / 1000,
        histogram: Math.round(macdHistogram * 1000) / 1000
      },
      ema: {
        short: Math.round(emaShort * 100) / 100,
        long: Math.round(emaLong * 100) / 100
      },
      momentum: Math.round(momentum * 100) / 100,
      volume: {
        current: Math.round(volumeCurrent),
        average: Math.round(volumeAverage),
        ratio: Math.round(volumeRatio * 100) / 100
      }
    }
  }

  // Generate predictions based on technical indicators
  private generatePredictions(indicators: any): PredictionData['predictions'] {
    if (!this.isDemoMode) {
      return {
        shortTerm: this.generateShortTermPrediction(indicators),
        momentum: this.generateMomentumPrediction(indicators),
        trend: this.generateTrendPrediction(indicators)
      }
    }

    const shortTerm = this.generateShortTermPrediction(indicators)
    const momentum = this.generateMomentumPrediction(indicators)
    const trend = this.generateTrendPrediction(indicators)

    return {
      shortTerm,
      momentum,
      trend
    }
  }

  // Generate short-term prediction
  private generateShortTermPrediction(indicators: any): PredictionData['predictions']['shortTerm'] {
    if (!this.isDemoMode) {
      return { direction: 'neutral', probability: 0, targetPrice: 0, timeframe: '4h' as const, confidence: 0 }
    }

    let direction: 'bullish' | 'bearish' | 'neutral'
    let probability = 50
    let confidence = 65

    // RSI-based logic
    if (indicators.rsi < 30) {
      direction = 'bullish'
      probability = 75
      confidence = 80
    } else if (indicators.rsi > 70) {
      direction = 'bearish'
      probability = 70
      confidence = 75
    } else if (indicators.rsi > 45 && indicators.rsi < 55) {
      direction = 'neutral'
      probability = 50
      confidence = 60
    } else if (indicators.rsi > 55) {
      direction = 'bullish'
      probability = 65
      confidence = 70
    } else {
      direction = 'bearish'
      probability = 55
      confidence = 65
    }

    // MACD confirmation
    if (indicators.macd.histogram > 0.1) {
      if (direction === 'bearish') {
        direction = 'neutral'
        probability = 55
        confidence = 60
      }
    } else if (indicators.macd.histogram < -0.1) {
      if (direction === 'bullish') {
        direction = 'neutral'
        probability = 45
        confidence = 55
      }
    }

    // Volume confirmation
    if (indicators.volume.ratio > 1.5) {
      probability = Math.min(85, probability + 10)
      confidence = Math.min(90, confidence + 5)
    }

    const targetPrice = 43250 * (1 + (direction === 'bullish' ? 0.05 : direction === 'bearish' ? -0.05 : 0))

    return {
      direction,
      probability: Math.round(probability),
      targetPrice: Math.round(targetPrice * 100) / 100,
      timeframe: '4h' as const,
      confidence: Math.round(confidence)
    }
  }

  // Generate momentum prediction
  private generateMomentumPrediction(indicators: any): PredictionData['predictions']['momentum'] {
    if (!this.isDemoMode) {
      return { strength: 'weak', direction: 'stable', probability: 0, timeframe: '24h' as const }
    }

    let strength: 'strong' | 'moderate' | 'weak'
    let direction: 'increasing' | 'decreasing' | 'stable'
    let probability = 50

    const momentumValue = Math.abs(indicators.momentum)
    const volumeStrength = indicators.volume.ratio

    if (momentumValue > 5 && volumeStrength > 1.3) {
      strength = 'strong'
      probability = 80
      direction = indicators.momentum > 0 ? 'increasing' : 'decreasing'
    } else if (momentumValue > 2 && volumeStrength > 1.1) {
      strength = 'moderate'
      probability = 65
      direction = indicators.momentum > 0 ? 'increasing' : 'decreasing'
    } else {
      strength = 'weak'
      probability = 55
      direction = 'stable'
    }

    return {
      strength,
      direction,
      probability: Math.round(probability),
      timeframe: '24h' as const
    }
  }

  // Generate trend prediction
  private generateTrendPrediction(indicators: any): PredictionData['predictions']['trend'] {
    if (!this.isDemoMode) {
      return { continuation: 'neutral', probability: 0, pattern: 'sideways', strength: 0 }
    }

    let continuation: 'likely' | 'unlikely' | 'neutral'
    let probability = 50
    let pattern: 'uptrend' | 'downtrend' | 'sideways' | 'reversal'
    let strength = 50

    const emaDifference = indicators.ema.short - indicators.ema.long
    const rsiTrend = indicators.rsi > 50

    if (Math.abs(emaDifference) > 100 && rsiTrend === (emaDifference > 0)) {
      continuation = 'likely'
      probability = 75
      pattern = emaDifference > 0 ? 'uptrend' : 'downtrend'
      strength = Math.min(85, 50 + Math.abs(emaDifference) / 10)
    } else if (Math.abs(emaDifference) < 50) {
      continuation = 'neutral'
      probability = 50
      pattern = 'sideways'
      strength = 45
    } else {
      continuation = 'unlikely'
      probability = 35
      pattern = 'reversal'
      strength = 60
    }

    return {
      continuation,
      probability: Math.round(probability),
      pattern,
      strength: Math.round(strength)
    }
  }

  // Update all predictions with realistic variations
  private updatePredictions() {
    if (!this.isDemoMode) return

    this.predictions.forEach((prediction, coinId) => {
      // Add small variations to simulate live updates
      const priceVariation = (Math.random() - 0.5) * prediction.currentPrice * 0.002
      const newPrice = prediction.currentPrice + priceVariation
      
      // Update technical indicators based on new price
      const newIndicators = this.generateTechnicalIndicators(newPrice)
      const newPredictions = this.generatePredictions(newIndicators)
      
      this.predictions.set(coinId, {
        ...prediction,
        currentPrice: newPrice,
        technicalIndicators: newIndicators,
        predictions: newPredictions,
        lastUpdated: Date.now()
      })
    })
  }

  // Generate key market signals
  private generateKeySignals(predictions: PredictionData[]): string[] {
    if (!this.isDemoMode) return []

    const signals: string[] = []
    
    const strongMomentum = predictions.filter(p => p.predictions.momentum.strength === 'strong')
    const bullishShortTerm = predictions.filter(p => p.predictions.shortTerm.direction === 'bullish')
    const highVolume = predictions.filter(p => p.technicalIndicators.volume.ratio > 1.5)
    const rsiOversold = predictions.filter(p => p.technicalIndicators.rsi < 35)
    const rsiOverbought = predictions.filter(p => p.technicalIndicators.rsi > 65)

    if (strongMomentum.length > predictions.length / 2) {
      signals.push('Strong momentum detected across multiple assets')
    }
    
    if (bullishShortTerm.length > predictions.length * 0.6) {
      signals.push('Short-term bullish sentiment dominating')
    }
    
    if (highVolume.length > predictions.length / 3) {
      signals.push('Above-average volume supporting price movement')
    }
    
    if (rsiOversold.length > 0) {
      signals.push('Oversold conditions may present buying opportunities')
    }
    
    if (rsiOverbought.length > 0) {
      signals.push('Overbought conditions suggest caution')
    }

    return signals
  }

  // Generate market summary
  private generateMarketSummary(overall: string, confidence: number, keySignals: string[]): string {
    if (!this.isDemoMode) return ''

    const confidenceLevel = confidence > 70 ? 'high' : confidence > 55 ? 'moderate' : 'low'
    
    if (overall === 'bullish') {
      return `Market shows ${confidenceLevel} bullish confidence (${confidence}%). Technical indicators suggest upward momentum with ${keySignals.length > 0 ? keySignals[0].toLowerCase() : 'supporting factors'}.`
    } else if (overall === 'bearish') {
      return `Market indicates ${confidenceLevel} bearish sentiment (${confidence}%). Technical analysis points to downward pressure with ${keySignals.length > 0 ? keySignals[0].toLowerCase() : 'risk factors present'}.`
    }
    
    return `Market sentiment is neutral with ${confidenceLevel} confidence (${confidence}%). Mixed signals suggest ${keySignals.length > 0 ? 'cautious approach' : 'range-bound conditions'}.`
  }

  // Notify all subscribers
  private notifySubscribers() {
    if (!this.isDemoMode) return
    this.callbacks.forEach(callback => callback())
  }
}

// Global instance
export const aiPredictorEngine = new AIPredictorEngine()
