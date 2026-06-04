'use client'

export interface MarketMood {
  overall: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  summary: string
  keyFactors: string[]
  timestamp: number
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'sideways'
  strength: number
  timeframe: string
  summary: string
}

export interface VolatilityAnalysis {
  level: 'low' | 'medium' | 'high'
  index: number
  description: string
  implications: string[]
}

export interface FearGreedIndicator {
  value: number
  classification: 'extreme fear' | 'fear' | 'neutral' | 'greed' | 'extreme greed'
  description: string
  trend: 'improving' | 'worsening' | 'stable'
}

export interface MarketIntelligence {
  mood: MarketMood
  trend: TrendAnalysis
  volatility: VolatilityAnalysis
  fearGreed: FearGreedIndicator
  aiSummary: string
  recommendations: string[]
  lastUpdated: number
}

export class MarketIntelligenceEngine {
  private intelligence: MarketIntelligence = this.generateInitialIntelligence()
  private callbacks: Set<() => void> = new Set()
  private interval: NodeJS.Timeout | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.intelligence = this.generateInitialIntelligence()
    }
  }

  // Subscribe to intelligence updates
  subscribe(callback: () => void) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  // Start live intelligence updates
  start() {
    if (this.interval) return

    this.interval = setInterval(() => {
      this.updateIntelligence()
      this.notifySubscribers()
    }, 5000) // Update every 5 seconds
  }

  // Stop intelligence updates
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  // Get current intelligence
  getIntelligence() {
    return this.intelligence
  }

  // Generate initial intelligence
  private generateInitialIntelligence(): MarketIntelligence {
    return {
      mood: {
        overall: 'bullish',
        confidence: 72,
        summary: 'Market momentum is improving today, with Bitcoin leading gains and altcoins showing increased buying activity.',
        keyFactors: [
          'Bitcoin dominance increasing',
          'Trading volume above average',
          'More buy signals than sell signals',
          'Positive sentiment in social media'
        ],
        timestamp: Date.now()
      },
      trend: {
        direction: 'up',
        strength: 68,
        timeframe: '24h',
        summary: 'Short-term uptrend confirmed with strong momentum indicators.'
      },
      volatility: {
        level: 'medium',
        index: 65,
        description: 'Moderate volatility with healthy price movements.',
        implications: [
          'Good trading opportunities',
          'Manage risk appropriately',
          'Expect continued price swings'
        ]
      },
      fearGreed: {
        value: 68,
        classification: 'greed',
        description: 'Market sentiment is leaning towards greed, indicating optimism.',
        trend: 'improving'
      },
      aiSummary: 'The cryptocurrency market is showing bullish momentum with Bitcoin leading the charge. Trading volumes are above average, suggesting strong institutional and retail participation. While volatility remains moderate, the overall sentiment is positive, creating favorable conditions for strategic trading opportunities.',
      recommendations: [
        'Consider gradual position building in strong performers',
        'Monitor for potential overbought conditions',
        'Maintain diversified exposure across sectors',
        'Set stop-losses to protect against sudden reversals'
      ],
      lastUpdated: Date.now()
    }
  }

  // Update intelligence with realistic variations
  private updateIntelligence() {
    const current = this.intelligence
    
    // Update mood with small variations
    const moodConfidence = Math.max(50, Math.min(95, current.mood.confidence + (Math.random() - 0.5) * 3))
    const moodOverall = moodConfidence > 60 ? 'bullish' : moodConfidence < 40 ? 'bearish' : 'neutral'
    
    // Update trend
    const trendStrength = Math.max(40, Math.min(90, current.trend.strength + (Math.random() - 0.5) * 5))
    const trendDirection = trendStrength > 55 ? 'up' : trendStrength < 45 ? 'down' : 'sideways'
    
    // Update volatility
    const volatilityIndex = Math.max(20, Math.min(95, current.volatility.index + (Math.random() - 0.5) * 4))
    const volatilityLevel = volatilityIndex < 40 ? 'low' : volatilityIndex < 70 ? 'medium' : 'high'
    
    // Update fear/greed
    const fearGreedValue = Math.max(10, Math.min(95, current.fearGreed.value + (Math.random() - 0.5) * 6))
    const fearGreedClassification = this.classifyFearGreed(fearGreedValue)
    
    // Generate new AI summary
    const newSummary = this.generateAISummary(moodOverall, trendDirection, volatilityLevel, fearGreedClassification)

    this.intelligence = {
      mood: {
        ...current.mood,
        overall: moodOverall,
        confidence: moodConfidence,
        timestamp: Date.now()
      },
      trend: {
        ...current.trend,
        direction: trendDirection,
        strength: trendStrength,
        summary: this.generateTrendSummary(trendDirection, trendStrength)
      },
      volatility: {
        ...current.volatility,
        level: volatilityLevel,
        index: volatilityIndex,
        description: this.generateVolatilityDescription(volatilityLevel, volatilityIndex)
      },
      fearGreed: {
        ...current.fearGreed,
        value: fearGreedValue,
        classification: fearGreedClassification,
        trend: this.getFearGreedTrend(fearGreedValue, current.fearGreed.value)
      },
      aiSummary: newSummary,
      recommendations: this.generateRecommendations(moodOverall, trendDirection, volatilityLevel),
      lastUpdated: Date.now()
    }
  }

  private classifyFearGreed(value: number): FearGreedIndicator['classification'] {
    if (value < 20) return 'extreme fear'
    if (value < 40) return 'fear'
    if (value < 60) return 'neutral'
    if (value < 80) return 'greed'
    return 'extreme greed'
  }

  private generateTrendSummary(direction: string, strength: number): string {
    if (direction === 'up') {
      return strength > 70 ? 'Strong uptrend with robust momentum' : 'Moderate uptrend developing'
    } else if (direction === 'down') {
      return strength > 70 ? 'Strong downtrend with significant selling pressure' : 'Moderate downtrend forming'
    }
    return 'Market moving sideways with mixed signals'
  }

  private generateVolatilityDescription(level: string, index: number): string {
    const descriptions = {
      low: 'Low volatility environment with stable price movements.',
      medium: 'Moderate volatility with healthy price movements.',
      high: 'High volatility with significant price swings.'
    }
    return descriptions[level as keyof typeof descriptions]
  }

  private getFearGreedTrend(current: number, previous: number): FearGreedIndicator['trend'] {
    const diff = current - previous
    if (diff > 5) return 'improving'
    if (diff < -5) return 'worsening'
    return 'stable'
  }

  private generateAISummary(mood: string, trend: string, volatility: string, fearGreed: string): string {
    const summaries = {
      bullish_up: 'The cryptocurrency market is showing strong bullish momentum with Bitcoin leading the charge. Trading volumes are above average, suggesting strong institutional and retail participation.',
      bullish_down: 'Despite overall bullish sentiment, the market is experiencing short-term downward pressure. This could present buying opportunities for long-term investors.',
      neutral_up: 'Market sentiment is neutral but showing upward momentum. Investors are cautiously optimistic as key indicators suggest potential for further gains.',
      neutral_down: 'The market remains in a neutral state with downward pressure. Traders should wait for clearer directional signals before making significant moves.',
      bearish_up: 'While overall sentiment remains bearish, short-term upward momentum is providing relief. This could be a temporary bounce or the start of a trend reversal.',
      bearish_down: 'The cryptocurrency market is experiencing significant bearish pressure with increased selling activity. Risk management is crucial in this environment.'
    }

    const key = `${mood}_${trend}` as keyof typeof summaries
    return summaries[key] || 'Market conditions are evolving with mixed signals across different timeframes.'
  }

  private generateRecommendations(mood: string, trend: string, volatility: string): string[] {
    const baseRecommendations = [
      'Monitor key support and resistance levels',
      'Maintain proper risk management',
      'Stay updated on market news and events'
    ]

    if (mood === 'bullish' && trend === 'up') {
      return [
        ...baseRecommendations,
        'Consider gradual position building in strong performers',
        'Monitor for potential overbought conditions',
        'Take partial profits at key resistance levels'
      ]
    } else if (mood === 'bearish' && trend === 'down') {
      return [
        ...baseRecommendations,
        'Preserve capital and wait for clearer signals',
        'Consider short positions if experienced',
        'Look for oversold conditions for potential reversals'
      ]
    } else {
      return [
        ...baseRecommendations,
        'Maintain diversified exposure across sectors',
        'Use range-bound trading strategies',
        'Be patient and wait for directional confirmation'
      ]
    }
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.callbacks.forEach(callback => callback())
  }
}

// Global instance
export const marketIntelligenceEngine = new MarketIntelligenceEngine()
