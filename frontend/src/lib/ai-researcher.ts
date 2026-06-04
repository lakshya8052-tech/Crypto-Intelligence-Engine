'use client'

export interface CoinResearch {
  coinId: string
  coinSymbol: string
  coinName: string
  currentPrice: number
  marketSummary: {
    trend: string
    momentum: string
    volatility: string
    volume: string
    overall: string
  }
  trendExplanation: {
    shortTerm: string
    mediumTerm: string
    longTerm: string
    keyLevels: string[]
  }
  volatilitySummary: {
    current: string
    expected: string
    implications: string[]
  }
  momentumAnalysis: {
    current: string
    strength: string
    sustainability: string
    comparison: string
  }
  sentimentSummary: {
    overall: string
    social: string
    news: string
    institutional: string
  }
  aiObservations: {
    technical: string[]
    fundamental: string[]
    risk: string[]
    opportunity: string[]
  }
  lastUpdated: number
}

export class AIResearcherEngine {
  private researchData: Map<string, CoinResearch> = new Map()
  private callbacks: Set<() => void> = new Set()
  private interval: NodeJS.Timeout | null = null
  // Demo gate
  public isDemoMode: boolean = false

  constructor() {
    if (this.isDemoMode) this.initializeResearch()
  }

  // Subscribe to research updates
  subscribe(callback: () => void) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  // Start research engine
  start() {
    if (!this.isDemoMode) return
    if (this.interval) return

    this.interval = setInterval(() => {
      this.updateResearch()
      this.notifySubscribers()
    }, 7000) // Update every 7 seconds
  }

  // Stop research engine
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  // Get research for specific coin
  getResearch(coinId: string): CoinResearch | null {
    if (!this.isDemoMode) return null
    return this.researchData.get(coinId) || null
  }

  // Get all research data
  getAllResearch(): CoinResearch[] {
    if (!this.isDemoMode) return []
    return Array.from(this.researchData.values())
  }

  // Initialize research for major coins
  private initializeResearch() {
    if (!this.isDemoMode) return
    const coins = [
      { id: '1', symbol: 'BTC', name: 'Bitcoin', price: 43250 },
      { id: '2', symbol: 'ETH', name: 'Ethereum', price: 2280 },
      { id: '3', symbol: 'SOL', name: 'Solana', price: 98.45 },
      { id: '4', symbol: 'ADA', name: 'Cardano', price: 0.58 },
      { id: '5', symbol: 'AVAX', name: 'Avalanche', price: 36.82 }
    ]

    coins.forEach(coin => {
      this.researchData.set(coin.id, this.generateResearch(coin))
    })
  }

  // Generate comprehensive research for a coin
  private generateResearch(coin: { id: string, symbol: string, name: string, price: number }): CoinResearch {
    const marketSummary = this.generateMarketSummary(coin)
    const trendExplanation = this.generateTrendExplanation(coin)
    const volatilitySummary = this.generateVolatilitySummary(coin)
    const momentumAnalysis = this.generateMomentumAnalysis(coin)
    const sentimentSummary = this.generateSentimentSummary(coin)
    const aiObservations = this.generateAIObservations(coin)

    return {
      coinId: coin.id,
      coinSymbol: coin.symbol,
      coinName: coin.name,
      currentPrice: coin.price,
      marketSummary,
      trendExplanation,
      volatilitySummary,
      momentumAnalysis,
      sentimentSummary,
      aiObservations,
      lastUpdated: Date.now()
    }
  }

  // Generate market summary
  private generateMarketSummary(coin: { symbol: string, name: string }) {
    const trend = this.getRandomTrend()
    const momentum = this.getRandomMomentum()
    const volatility = this.getRandomVolatility()
    const volume = this.getRandomVolume()

    let overall = 'neutral'
    if (trend === 'bullish' && momentum === 'strong') {
      overall = 'positive'
    } else if (trend === 'bearish' && volatility === 'high') {
      overall = 'negative'
    }

    return {
      trend: `${coin.name} is showing ${trend} trend with ${momentum} momentum`,
      momentum: `Trading volume and price action indicate ${momentum} momentum`,
      volatility: `Current volatility level is ${volatility}, suggesting ${volatility === 'high' ? 'elevated risk' : 'stable conditions'}`,
      volume: `Volume is ${volume} compared to recent averages`,
      overall: `${coin.name} market conditions are ${overall} with ${trend} bias`
    }
  }

  // Generate trend explanation
  private generateTrendExplanation(coin: { symbol: string, name: string }) {
    const shortTerm = this.generateShortTermTrend(coin)
    const mediumTerm = this.generateMediumTermTrend(coin)
    const longTerm = this.generateLongTermTrend(coin)
    const keyLevels = this.generateKeyLevels(coin)

    return {
      shortTerm,
      mediumTerm,
      longTerm,
      keyLevels
    }
  }

  private generateShortTermTrend(coin: { symbol: string, name: string }): string {
    const trends = [
      `${coin.name} is forming a bullish flag pattern on the 4-hour chart`,
      `${coin.name} shows bearish divergence with decreasing momentum`,
      `${coin.name} is consolidating in a tight range, suggesting accumulation`,
      `${coin.name} is experiencing strong upward momentum with higher highs and higher lows`,
      `${coin.name} is showing signs of exhaustion after recent rally`
    ]
    return trends[Math.floor(Math.random() * trends.length)]
  }

  private generateMediumTermTrend(coin: { symbol: string, name: string }): string {
    const trends = [
      `${coin.name} has established a clear uptrend on the daily timeframe`,
      `${coin.name} is in a corrective phase within the broader uptrend`,
      `${coin.name} is trading above key moving averages, indicating bullish momentum`,
      `${coin.name} is forming a potential reversal pattern after recent decline`,
      `${coin.name} is showing range-bound behavior with no clear direction`
    ]
    return trends[Math.floor(Math.random() * trends.length)]
  }

  private generateLongTermTrend(coin: { symbol: string, name: string }): string {
    const trends = [
      `${coin.name} has been in a strong uptrend for the past month, outperforming most altcoins`,
      `${coin.name} is in a long-term downtrend, with lower highs and lower lows`,
      `${coin.name} is in a consolidation phase, building base for next move`,
      `${coin.name} has broken out of long-term resistance, suggesting trend change`,
      `${coin.name} is showing signs of trend exhaustion after extended move`
    ]
    return trends[Math.floor(Math.random() * trends.length)]
  }

  private generateKeyLevels(coin: { symbol: string, name: string }): string[] {
    const basePrice = 43250
    const levels = [
      `Resistance at $${(basePrice * 1.05).toFixed(2)}`,
      `Support at $${(basePrice * 0.95).toFixed(2)}`,
      `Key resistance at $${(basePrice * 1.1).toFixed(2)}`,
      `Major support at $${(basePrice * 0.9).toFixed(2)}`,
      `Breakout level at $${(basePrice * 1.15).toFixed(2)}`
    ]
    return levels.slice(0, 3)
  }

  // Generate volatility summary
  private generateVolatilitySummary(coin: { symbol: string, name: string }) {
    const current = this.getRandomVolatility()
    const expected = this.getRandomVolatility()
    const implications = this.generateVolatilityImplications(current)

    return {
      current: `${coin.name} currently exhibits ${current} volatility`,
      expected: `Expected volatility to remain ${expected} in the near term`,
      implications
    }
  }

  private generateVolatilityImplications(volatility: string): string[] {
    const implications = {
      high: [
        'High volatility increases risk but also opportunity',
        'Wider stop losses recommended for risk management',
        'Potential for rapid price movements in both directions',
        'Increased trading volume during volatile periods'
      ],
      medium: [
        'Moderate volatility allows for balanced risk management',
        'Normal price action with predictable patterns',
        'Suitable for swing trading strategies',
        'Manage position sizes appropriately'
      ],
      low: [
        'Low volatility suggests stable market conditions',
        'Tighter stop losses can be used',
        'May indicate accumulation or distribution phase',
        'Lower risk environment for position building'
      ]
    }
    return implications[volatility as keyof typeof implications] || []
  }

  // Generate momentum analysis
  private generateMomentumAnalysis(coin: { symbol: string, name: string }) {
    const current = this.getMomentumState()
    const strength = this.getMomentumStrength()
    const sustainability = this.getSustainabilityState()
    const comparison = this.getComparisonState()

    return {
      current: `${coin.name} momentum is currently ${current}`,
      strength: `Momentum strength is ${strength} based on price action and volume`,
      sustainability: `Current momentum appears ${sustainability} based on underlying factors`,
      comparison: `Compared to other major cryptocurrencies, ${coin.name} shows ${comparison} momentum characteristics`
    }
  }

  private getMomentumState(): string {
    const options = ['strong', 'moderate', 'weak', 'increasing', 'decreasing', 'stable']
    return options[Math.floor(Math.random() * options.length)]
  }

  private getMomentumStrength(): string {
    const options = ['strong', 'moderate', 'weak', 'increasing', 'decreasing', 'stable']
    return options[Math.floor(Math.random() * options.length)]
  }

  private getSustainabilityState(): string {
    const options = ['sustainable', 'unsustainable', 'questionable', 'improving', 'declining']
    return options[Math.floor(Math.random() * options.length)]
  }

  private getComparisonState(): string {
    const options = ['above-average', 'below-average', 'average', 'superior', 'inferior']
    return options[Math.floor(Math.random() * options.length)]
  }

  // Generate sentiment summary
  private generateSentimentSummary(coin: { symbol: string, name: string }) {
    const overall = this.getRandomSentiment()
    const social = this.generateSocialSentiment(coin)
    const news = this.generateNewsSentiment(coin)
    const institutional = this.generateInstitutionalSentiment(coin)

    return {
      overall: `Overall sentiment for ${coin.name} is ${overall}`,
      social: `Social media sentiment is ${social} with high engagement levels`,
      news: `Recent news coverage has been ${news} for ${coin.name}`,
      institutional: `Institutional interest appears ${institutional} based on recent developments`
    }
  }

  private getRandomSentiment(): string {
    const options = ['positive', 'negative', 'neutral', 'optimistic', 'cautious']
    return options[Math.floor(Math.random() * options.length)]
  }

  private generateSocialSentiment(coin: { symbol: string, name: string }): string {
    const sentiments = [
      'overwhelmingly positive',
      'mixed with bullish bias',
      'cautiously optimistic',
      'concerned about recent price action',
      'largely negative'
    ]
    return sentiments[Math.floor(Math.random() * sentiments.length)]
  }

  private generateNewsSentiment(coin: { symbol: string, name: string }): string {
    const sentiments = [
      'generally positive',
      'focused on technological developments',
      'concerned about regulatory issues',
      'highlighting partnership announcements',
      'mixed with neutral bias'
    ]
    return sentiments[Math.floor(Math.random() * sentiments.length)]
  }

  private generateInstitutionalSentiment(coin: { symbol: string, name: string }): string {
    const sentiments = [
      'increasing with new adoption announcements',
      'steady with existing positions',
      'growing but cautious',
      'declining with profit-taking',
      'neutral with观望态度'
    ]
    return sentiments[Math.floor(Math.random() * sentiments.length)]
  }

  // Generate AI observations
  private generateAIObservations(coin: { symbol: string, name: string }) {
    const technical = this.generateTechnicalObservations(coin)
    const fundamental = this.generateFundamentalObservations(coin)
    const risk = this.generateRiskObservations(coin)
    const opportunity = this.generateOpportunityObservations(coin)

    return {
      technical,
      fundamental,
      risk,
      opportunity
    }
  }

  private generateTechnicalObservations(coin: { symbol: string, name: string }): string[] {
    const observations = [
      'RSI indicates overbought conditions, suggesting potential pullback',
      'MACD shows bullish crossover with increasing momentum',
      'Price action suggests accumulation phase at current levels',
      'Volume patterns indicate institutional buying interest',
      'Moving averages confirm uptrend with price above key EMAs',
      'Technical indicators suggest trend continuation is likely',
      'Divergence between price and momentum signals caution'
    ]
    return observations.slice(0, 3)
  }

  private generateFundamentalObservations(coin: { symbol: string, name: string }): string[] {
    const observations = [
      'Strong network fundamentals with increasing adoption metrics',
      'Development activity remains high with regular updates',
      'On-chain metrics show healthy ecosystem growth',
      'Institutional adoption continues to accelerate',
      'Competitive positioning strengthens in the market',
      'Regulatory clarity improves long-term prospects'
    ]
    return observations.slice(0, 2)
  }

  private generateRiskObservations(coin: { symbol: string, name: string }): string[] {
    const risks = [
      'High volatility increases short-term risk exposure',
      'Regulatory uncertainty remains a key risk factor',
      'Market correlation with broader crypto market increases systemic risk',
      'Technical indicators suggest potential reversal risk',
      'Concentration risk if heavily weighted in portfolio',
      'Liquidity risk during low volume periods'
    ]
    return risks.slice(0, 2)
  }

  private generateOpportunityObservations(coin: { symbol: string, name: string }): string[] {
    const opportunities = [
      'Potential breakout above key resistance level',
      'Support level bounce could provide entry opportunity',
      'Momentum shift suggests trend continuation potential',
      'Low volatility period may precede significant move',
      'Technical setup favors risk/reward ratio',
      'Fundamental catalysts could drive price appreciation'
    ]
    return opportunities.slice(0, 2)
  }

  // Update research with realistic variations
  private updateResearch() {
    if (!this.isDemoMode) return

    this.researchData.forEach((research, coinId) => {
      // Add small variations to simulate live updates
      const updatedResearch = this.generateResearch({
        id: coinId,
        symbol: research.coinSymbol,
        name: research.coinName,
        price: research.currentPrice * (1 + (Math.random() - 0.5) * 0.01)
      })

      this.researchData.set(coinId, {
        ...updatedResearch,
        lastUpdated: Date.now()
      })
    })
  }

  // Helper functions for random data generation
  private getRandomTrend(): string {
    const trends = ['bullish', 'bearish', 'neutral', 'sideways', 'volatile']
    return trends[Math.floor(Math.random() * trends.length)]
  }

  private getRandomMomentum(): string {
    const momentum = ['strong', 'moderate', 'weak', 'increasing', 'decreasing']
    return momentum[Math.floor(Math.random() * momentum.length)]
  }

  private getRandomVolatility(): string {
    const volatility = ['high', 'medium', 'low', 'elevated', 'stable']
    return volatility[Math.floor(Math.random() * volatility.length)]
  }

  private getRandomVolume(): string {
    const volume = ['above average', 'below average', 'average', 'increasing', 'decreasing']
    return volume[Math.floor(Math.random() * volume.length)]
  }

  // Notify all subscribers
  private notifySubscribers() {
    if (!this.isDemoMode) return
    this.callbacks.forEach(callback => callback())
  }
}

// Global instance
export const aiResearcherEngine = new AIResearcherEngine()
