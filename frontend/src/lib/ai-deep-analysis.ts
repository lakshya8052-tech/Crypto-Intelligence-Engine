'use client'

export interface AnalysisTool {
  id: string
  name: string
  category: 'technical' | 'market_intelligence' | 'ai_analysis'
  description: string
  icon: string
}

export interface AnalysisResult {
  id: string
  coinId: string
  coinSymbol: string
  coinName: string
  currentPrice: number
  analysisType: string
  overallRecommendation: string
  confidenceScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'very_high'
  entrySuggestions: {
    zone: string
    priceRange: string
    reasoning: string
  }
  exitSuggestions: {
    profitZones: string[]
    stopLoss: string
    reasoning: string
  }
  technicalBreakdown: {
    indicators: string[]
    bullishSignals: string[]
    bearishSignals: string[]
    neutralSignals: string[]
  }
  riskAssessment: {
    volatility: string
    trendStability: string
    overboughtOversold: string
    liquidityRisk: string
  }
  aiExplanation: {
    beginner: string
    advanced: string
  }
  strategyComparison: {
    shortTerm: string
    longTerm: string
    conservative: string
    aggressive: string
  }
  timestamp: number
  isSaved: boolean
}

export interface AnalysisSnapshot {
  id: string
  coinId: string
  coinSymbol: string
  analysisType: string
  result: AnalysisResult
  timestamp: number
}

export class AIDeepAnalysisEngine {
  private analysisResults: Map<string, AnalysisResult> = new Map()
  private analysisSnapshots: AnalysisSnapshot[] = []
  private callbacks: Set<() => void> = new Set()
  private interval: NodeJS.Timeout | null = null
  // Demo gate: when false, engine must be inert
  public isDemoMode: boolean = false

  constructor() {
    // Only load saved analyses in demo mode
    if (this.isDemoMode) this.loadSavedAnalyses()
  }

  // Subscribe to analysis updates
  subscribe(callback: () => void) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  // Start analysis engine
  start() {
    if (!this.isDemoMode) return
    if (this.interval) return

    this.interval = setInterval(() => {
      this.updateAnalysisData()
      this.notifySubscribers()
    }, 8000) // Update every 8 seconds
  }

  // Stop analysis engine
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  // Get available analysis tools
  getAnalysisTools(): AnalysisTool[] {
    if (!this.isDemoMode) return []

    return [
      // Technical Indicators
      {
        id: 'rsi',
        name: 'RSI Analysis',
        category: 'technical',
        description: 'Relative Strength Index for overbought/oversold conditions',
        icon: 'activity'
      },
      {
        id: 'macd',
        name: 'MACD Analysis',
        category: 'technical',
        description: 'Moving Average Convergence Divergence for trend changes',
        icon: 'trending-up'
      },
      {
        id: 'ema',
        name: 'EMA Analysis',
        category: 'technical',
        description: 'Exponential Moving Averages for trend direction',
        icon: 'line-chart'
      },
      {
        id: 'bollinger',
        name: 'Bollinger Bands',
        category: 'technical',
        description: 'Volatility bands for price range analysis',
        icon: 'bar-chart-3'
      },
      {
        id: 'volume',
        name: 'Volume Analysis',
        category: 'technical',
        description: 'Trading volume and accumulation patterns',
        icon: 'bar-chart'
      },
      {
        id: 'support_resistance',
        name: 'Support/Resistance',
        category: 'technical',
        description: 'Key price levels for entry/exit decisions',
        icon: 'target'
      },
      // Market Intelligence
      {
        id: 'sentiment',
        name: 'Market Sentiment',
        category: 'market_intelligence',
        description: 'Overall market mood and social sentiment analysis',
        icon: 'heart'
      },
      {
        id: 'fear_greed',
        name: 'Fear & Greed Index',
        category: 'market_intelligence',
        description: 'Market psychology and emotional indicators',
        icon: 'zap'
      },
      {
        id: 'volume_spikes',
        name: 'Volume Spikes',
        category: 'market_intelligence',
        description: 'Unusual volume activity and whale movements',
        icon: 'alert-triangle'
      },
      {
        id: 'sector_momentum',
        name: 'Sector Momentum',
        category: 'market_intelligence',
        description: 'Cross-asset sector rotation and momentum analysis',
        icon: 'compass'
      },
      // AI Analysis Modes
      {
        id: 'beginner_ai',
        name: 'Beginner AI Summary',
        category: 'ai_analysis',
        description: 'Simple, beginner-friendly market analysis',
        icon: 'graduation-cap'
      },
      {
        id: 'advanced_technical',
        name: 'Advanced Technical',
        category: 'ai_analysis',
        description: 'Detailed technical breakdown for experienced traders',
        icon: 'settings'
      },
      {
        id: 'swing_trading',
        name: 'Swing Trading Analysis',
        category: 'ai_analysis',
        description: 'Medium-term swing trading opportunities',
        icon: 'repeat'
      },
      {
        id: 'scalping',
        name: 'Scalping Analysis',
        category: 'ai_analysis',
        description: 'Short-term scalping opportunities and risks',
        icon: 'zap'
      },
      {
        id: 'long_term',
        name: 'Long-term Investment',
        category: 'ai_analysis',
        description: 'Long-term investment potential and fundamentals',
        icon: 'trending-up'
      },
      {
        id: 'risk_analysis',
        name: 'Risk Analysis',
        category: 'ai_analysis',
        description: 'Comprehensive risk assessment and management',
        icon: 'shield'
      }
    ]
  }

  // Run deep analysis
  runAnalysis(coinId: string, coinSymbol: string, coinName: string, currentPrice: number, selectedTools: string[]): AnalysisResult {
    // In production (non-demo mode) do not execute AI analysis logic
    if (!this.isDemoMode) {
      const neutral: AnalysisResult = {
        id: `${coinId}-${Date.now()}`,
        coinId,
        coinSymbol,
        coinName,
        currentPrice,
        analysisType: '',
        overallRecommendation: 'Hold',
        confidenceScore: 0,
        riskLevel: 'low',
        entrySuggestions: { zone: '', priceRange: '', reasoning: '' },
        exitSuggestions: { profitZones: [], stopLoss: '', reasoning: '' },
        technicalBreakdown: { indicators: [], bullishSignals: [], bearishSignals: [], neutralSignals: [] },
        riskAssessment: { volatility: 'unknown', trendStability: 'unknown', overboughtOversold: 'unknown', liquidityRisk: 'unknown' },
        aiExplanation: { beginner: '', advanced: '' },
        strategyComparison: { shortTerm: '', longTerm: '', conservative: '', aggressive: '' },
        timestamp: Date.now(),
        isSaved: false
      }

      return neutral
    }

    const analysisId = `${coinId}-${Date.now()}`

    // Generate analysis based on selected tools with coin-specific conditions
    const technicalBreakdown = this.generateTechnicalBreakdown(selectedTools, coinId)
    const riskAssessment = this.generateRiskAssessment(selectedTools, coinId)
    const aiExplanation = this.generateAIExplanation(selectedTools, coinId)
    const strategyComparison = this.generateStrategyComparison(selectedTools, coinId)

    // Generate weighted scores
    const scores = this.calculateWeightedScores(technicalBreakdown, riskAssessment, coinId)

    // Generate overall recommendation based on scores
    const overallRecommendation = this.generateOverallRecommendation(scores)
    const confidenceScore = this.generateConfidenceScore(scores)
    const riskLevel = this.generateRiskLevel(scores)

    // Generate entry/exit suggestions based on market conditions
    const entrySuggestions = this.generateEntrySuggestions(currentPrice, scores, coinId)
    const exitSuggestions = this.generateExitSuggestions(currentPrice, scores, coinId)

    const result: AnalysisResult = {
      id: analysisId,
      coinId,
      coinSymbol,
      coinName,
      currentPrice,
      analysisType: selectedTools.join(', '),
      overallRecommendation,
      confidenceScore,
      riskLevel,
      entrySuggestions,
      exitSuggestions,
      technicalBreakdown,
      riskAssessment,
      aiExplanation,
      strategyComparison,
      timestamp: Date.now(),
      isSaved: false
    }

    // Store result
    this.analysisResults.set(analysisId, result)
    this.saveAnalyses()

    return result
  }

  // Get analysis result
  getAnalysisResult(analysisId: string): AnalysisResult | null {
    if (!this.isDemoMode) return null
    return this.analysisResults.get(analysisId) || null
  }

  // Get all analysis results
  getAllAnalysisResults(): AnalysisResult[] {
    if (!this.isDemoMode) return []
    return Array.from(this.analysisResults.values())
  }

  // Save analysis
  saveAnalysis(analysisId: string) {
    if (!this.isDemoMode) return
    const analysis = this.analysisResults.get(analysisId)
    if (analysis) {
      analysis.isSaved = true

      // Create snapshot
      const snapshot: AnalysisSnapshot = {
        id: Date.now().toString(),
        coinId: analysis.coinId,
        coinSymbol: analysis.coinSymbol,
        analysisType: analysis.analysisType,
        result: analysis,
        timestamp: Date.now()
      }

      this.analysisSnapshots.push(snapshot)
      this.saveAnalyses()
    }
  }

  // Get saved snapshots
  getSavedSnapshots(): AnalysisSnapshot[] {
    if (!this.isDemoMode) return []
    return this.analysisSnapshots.sort((a, b) => b.timestamp - a.timestamp)
  }

  // Generate technical breakdown with dynamic scoring
  private generateTechnicalBreakdown(selectedTools: string[], coinId: string) {
    const indicators: string[] = []
    const bullishSignals: string[] = []
    const bearishSignals: string[] = []
    const neutralSignals: string[] = []

    // Generate dynamic market conditions for each coin
    const marketConditions = this.generateMarketConditions(coinId)
    
    selectedTools.forEach(tool => {
      switch (tool) {
        case 'rsi':
          const rsiValue = marketConditions.rsi
          indicators.push(`RSI at ${rsiValue.toFixed(1)} (${this.getRSIState(rsiValue)})`)
          
          if (rsiValue > 70) {
            bearishSignals.push('RSI overbought - potential pullback risk')
          } else if (rsiValue < 30) {
            bullishSignals.push('RSI oversold - potential bounce opportunity')
          } else if (rsiValue > 55) {
            bullishSignals.push('RSI showing bullish momentum')
          } else if (rsiValue < 45) {
            bearishSignals.push('RSI showing bearish momentum')
          } else {
            neutralSignals.push('RSI in neutral consolidation zone')
          }
          break
          
        case 'macd':
          const macdState = marketConditions.macd
          indicators.push(`MACD ${macdState.crossover} with ${macdState.histogram}`)
          
          if (macdState.crossover === 'bullish crossover' && macdState.histogram === 'positive') {
            bullishSignals.push('MACD bullish crossover confirmed with positive histogram')
          } else if (macdState.crossover === 'bearish crossover' && macdState.histogram === 'negative') {
            bearishSignals.push('MACD bearish crossover with negative histogram')
          } else if (macdState.histogram === 'positive') {
            bullishSignals.push('MACD histogram turning positive')
          } else if (macdState.histogram === 'negative') {
            bearishSignals.push('MACD histogram turning negative')
          } else {
            neutralSignals.push('MACD showing mixed signals')
          }
          break
          
        case 'ema':
          const emaState = marketConditions.ema
          indicators.push(`Price ${emaState.position} 20-day EMA`)
          
          if (emaState.position === 'above' && emaState.trend === 'uptrend') {
            bullishSignals.push('Price above EMA with uptrend support')
          } else if (emaState.position === 'below' && emaState.trend === 'downtrend') {
            bearishSignals.push('Price below EMA with downtrend resistance')
          } else if (emaState.position === 'above' && emaState.trend === 'downtrend') {
            neutralSignals.push('Price above EMA but trend weakening')
          } else {
            neutralSignals.push('Price testing EMA level')
          }
          break
          
        case 'bollinger':
          const bbState = marketConditions.bollinger
          indicators.push(`Price testing ${bbState.position} Bollinger Band`)
          
          if (bbState.position === 'upper' && bbState.expansion === 'expanding') {
            bullishSignals.push('Bollinger Bands expansion with price at upper band')
          } else if (bbState.position === 'lower' && bbState.expansion === 'expanding') {
            bearishSignals.push('Bollinger Bands expansion with price at lower band')
          } else if (bbState.position === 'middle') {
            neutralSignals.push('Price consolidating in Bollinger Bands middle')
          } else {
            neutralSignals.push('Bollinger Bands showing volatility')
          }
          break
          
        case 'volume':
          const volumeState = marketConditions.volume
          indicators.push(`Volume ${volumeState.ratio}x above average`)
          
          if (volumeState.ratio > 2.5 && volumeState.trend === 'increasing') {
            bullishSignals.push('Strong increasing volume supports upward momentum')
          } else if (volumeState.ratio > 2.5 && volumeState.trend === 'decreasing') {
            bearishSignals.push('High volume with decreasing price suggests distribution')
          } else if (volumeState.ratio < 0.5) {
            neutralSignals.push('Low volume suggests lack of conviction')
          } else {
            neutralSignals.push('Volume at normal levels')
          }
          break
          
        case 'support_resistance':
          const srState = marketConditions.supportResistance
          indicators.push(`Price ${srState.position} key ${srState.level}`)
          
          if (srState.position === 'above' && srState.level === 'resistance') {
            neutralSignals.push('Price testing resistance level - watch for breakout or rejection')
          } else if (srState.position === 'above' && srState.level === 'support') {
            bullishSignals.push('Price holding above key support level')
          } else if (srState.position === 'below' && srState.level === 'support') {
            bearishSignals.push('Price broken below key support level')
          } else {
            neutralSignals.push('Price consolidating near key level')
          }
          break
      }
    })

    return {
      indicators,
      bullishSignals,
      bearishSignals,
      neutralSignals
    }
  }

  // Generate risk assessment with coin-specific logic
  private generateRiskAssessment(selectedTools: string[], coinId: string) {
    const marketConditions = this.generateMarketConditions(coinId)
    
    // Dynamic risk assessment based on coin characteristics
    const baseRisk = {
      volatility: marketConditions.volume.ratio > 2.5 ? 'High volatility detected' : 
                  marketConditions.volume.ratio > 1.5 ? 'Moderate volatility' : 'Low volatility',
      trendStability: marketConditions.ema.trend === 'uptrend' ? 'Trend stability improving' : 
                     marketConditions.ema.trend === 'downtrend' ? 'Trend stability declining' : 'Trend stability neutral',
      overboughtOversold: marketConditions.rsi > 70 ? 'Overbought conditions present' : 
                          marketConditions.rsi < 30 ? 'Oversold conditions present' : 'Balanced overbought/oversold',
      liquidityRisk: coinId === '1' ? 'High liquidity with tight spreads' : // BTC
                     coinId === '2' ? 'Good liquidity with moderate spreads' : // ETH
                     coinId === '3' ? 'Moderate liquidity with wider spreads' : 'Low liquidity with wide spreads' // SOL
    }
    
    return baseRisk
  }

  // Generate AI explanation with coin-specific context
  private generateAIExplanation(selectedTools: string[], coinId: string) {
    const marketConditions = this.generateMarketConditions(coinId)
    
    // Beginner-friendly explanations based on current conditions
    const beginnerExplanations = {
      '1': `Bitcoin is showing ${marketConditions.rsi > 60 ? 'bullish' : marketConditions.rsi < 40 ? 'bearish' : 'neutral'} momentum with ${marketConditions.volume.ratio > 1.5 ? 'strong' : 'normal'} volume support.`,
      '2': `Ethereum is in a ${marketConditions.ema.trend} phase with ${marketConditions.volume.ratio > 1.5 ? 'increasing' : 'stable'} trading volume.`,
      '3': `Solana is experiencing ${marketConditions.bollinger.expansion === 'expanding' ? 'high' : 'normal'} volatility with ${marketConditions.volume.ratio > 2.0 ? 'very strong' : 'moderate'} volume.`
    }
    
    // Advanced technical explanations
    const advancedExplanations = {
      '1': `BTC RSI at ${marketConditions.rsi.toFixed(1)} with ${marketConditions.macd.crossover} suggests ${marketConditions.rsi > 60 ? 'upward momentum' : 'downward pressure'}. Volume profile indicates ${marketConditions.volume.ratio > 1.5 ? 'accumulation' : 'distribution'} phase.`,
      '2': `ETH MACD ${marketConditions.macd.histogram} histogram with ${marketConditions.ema.position} EMA indicates ${marketConditions.ema.trend === 'uptrend' ? 'bullish continuation' : 'bearish pressure'}. Risk/reward ratio currently ${marketConditions.volume.ratio > 1.5 ? 'favorable' : 'unfavorable'}.`,
      '3': `SOL testing ${marketConditions.bollinger.position} Bollinger Band with ${marketConditions.bollinger.expansion} bands suggests ${marketConditions.bollinger.expansion === 'expanding' ? 'breakout potential' : 'consolidation phase'}. High volatility requires careful position sizing.`
    }
    
    return {
      beginner: beginnerExplanations[coinId as keyof typeof beginnerExplanations] || 'Technical analysis in progress...',
      advanced: advancedExplanations[coinId as keyof typeof advancedExplanations] || 'Detailed technical analysis available...'
    }
  }

  // Generate strategy comparison with multi-timeframe analysis
  private generateStrategyComparison(selectedTools: string[], coinId: string) {
    const marketConditions = this.generateMarketConditions(coinId)
    
    // Different outlooks based on coin characteristics
    const strategies = {
      '1': { // BTC - more stable
        shortTerm: marketConditions.rsi > 60 ? 'Bullish continuation likely' : 'Consolidation expected',
        longTerm: 'Long-term uptrend intact with targets above $50,000',
        conservative: 'Wait for pullback to support levels around $41,000',
        aggressive: 'Buy now if momentum confirms above $43,000'
      },
      '2': { // ETH - moderate volatility
        shortTerm: marketConditions.macd.histogram === 'positive' ? 'Short-term bullish momentum' : 'Short-term bearish pressure',
        longTerm: 'Long-term structure remains bullish above $2,000',
        conservative: 'Wait for confirmation above $2,300 resistance',
        aggressive: 'Consider entry if ETH holds above $2,200'
      },
      '3': { // SOL - high volatility
        shortTerm: marketConditions.bollinger.expansion === 'expanding' ? 'High volatility - expect sharp moves' : 'Consolidation phase likely',
        longTerm: 'Long-term trend depends on breaking key resistance at $120',
        conservative: 'Wait for volatility to normalize before entry',
        aggressive: 'High-risk setup - only for experienced traders'
      }
    }
    
    return strategies[coinId as keyof typeof strategies] || strategies['1']
  }

  // Generate entry suggestions based on dynamic conditions
  private generateEntrySuggestions(currentPrice: number, scores: any, coinId: string) {
    const marketConditions = this.generateMarketConditions(coinId)
    const riskLevel = scores.risk
    
    // Dynamic entry zones based on volatility and support levels
    let entryZone: string
    let reasoning: string
    
    if (riskLevel > 70) {
      entryZone = `$${(currentPrice * 0.95).toFixed(2)}-$${(currentPrice * 1.00).toFixed(2)}`
      reasoning = 'High volatility detected - wait for pullback to safer entry levels'
    } else if (marketConditions.rsi < 30) {
      entryZone = `$${(currentPrice * 0.98).toFixed(2)}-$${(currentPrice * 1.05).toFixed(2)}`
      reasoning = 'Oversold conditions present - consider gradual accumulation'
    } else if (marketConditions.volume.ratio > 2.5) {
      entryZone = `$${(currentPrice * 1.00).toFixed(2)}-$${(currentPrice * 1.08).toFixed(2)}`
      reasoning = 'Strong volume supports current momentum - avoid chasing extended moves'
    } else {
      entryZone = `$${(currentPrice * 0.97).toFixed(2)}-$${(currentPrice * 1.03).toFixed(2)}`
      reasoning = 'Normal market conditions - enter within reasonable range'
    }
    
    return {
      zone: entryZone,
      priceRange: entryZone,
      reasoning
    }
  }

  // Generate exit suggestions based on dynamic conditions
  private generateExitSuggestions(currentPrice: number, scores: any, coinId: string) {
    const marketConditions = this.generateMarketConditions(coinId)
    const riskLevel = scores.risk
    
    // Dynamic profit zones based on volatility and resistance
    const profitZones = []
    const multiplier = riskLevel > 60 ? 1.15 : riskLevel > 40 ? 1.20 : 1.25
    
    profitZones.push(`$${(currentPrice * 1.08).toFixed(2)} - First profit target`)
    profitZones.push(`$${(currentPrice * multiplier).toFixed(2)} - Second profit target`)
    
    if (riskLevel < 50) {
      profitZones.push(`$${(currentPrice * 1.35).toFixed(2)} - Extended profit target`)
    }
    
    // Dynamic stop-loss based on volatility
    const stopLossMultiplier = riskLevel > 70 ? 0.92 : riskLevel > 50 ? 0.95 : 0.97
    const stopLoss = `$${(currentPrice * stopLossMultiplier).toFixed(2)}`
    
    const reasoning = marketConditions.rsi > 70 ? 
      'Consider partial profit-taking as overbought conditions may trigger pullback' :
      marketConditions.rsi < 30 ? 
      'Set wider stops as oversold bounce could be volatile' :
      'Normal profit-taking strategy with volume confirmation'
    
    return {
      profitZones,
      stopLoss,
      reasoning
    }
  }

  // Update analysis data with realistic variations
  private updateAnalysisData() {
    if (!this.isDemoMode) return

    // Simulate live price updates affecting analysis
    this.analysisResults.forEach((result, id) => {
      const priceVariation = (Math.random() - 0.5) * result.currentPrice * 0.002
      const newPrice = result.currentPrice + priceVariation

      // Update confidence based on time elapsed
      const timeElapsed = Date.now() - result.timestamp
      const confidenceDecay = Math.max(0, 100 - (timeElapsed / 3600000)) // 1 hour decay

      result.confidenceScore = Math.max(50, result.confidenceScore - confidenceDecay * 0.1)
      result.currentPrice = newPrice
    })

    this.saveAnalyses()
  }

  // Save analyses to localStorage
  private saveAnalyses() {
    if (!this.isDemoMode) return
    // Prevent localStorage access during server-side rendering
    if (typeof window === 'undefined') return
    const analyses = Array.from(this.analysisResults.values())
    localStorage.setItem('deep-analysis-results', JSON.stringify(analyses))
    localStorage.setItem('analysis-snapshots', JSON.stringify(this.analysisSnapshots))
  }

  // Load analyses from localStorage
  private loadSavedAnalyses() {
    if (!this.isDemoMode) return
    // Prevent localStorage access during server-side rendering
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('deep-analysis-results')
    if (stored) {
      try {
        const analyses = JSON.parse(stored)
        analyses.forEach((analysis: AnalysisResult) => {
          this.analysisResults.set(analysis.id, analysis)
        })
      } catch (error) {
        console.error('Failed to load analyses from localStorage:', error)
      }
    }

    const snapshots = localStorage.getItem('analysis-snapshots')
    if (snapshots) {
      try {
        this.analysisSnapshots = JSON.parse(snapshots)
      } catch (error) {
        console.error('Failed to load snapshots from localStorage:', error)
      }
    }
  }

  // Generate dynamic market conditions for each coin
  private generateMarketConditions(coinId: string) {
    // Different market conditions for different coins
    const coinProfiles = {
      '1': { // BTC
        rsi: 35 + Math.random() * 50,
        macd: {
          crossover: Math.random() > 0.5 ? 'bullish crossover' : 'bearish crossover',
          histogram: Math.random() > 0.5 ? 'positive' : 'negative'
        },
        ema: {
          position: Math.random() > 0.4 ? 'above' : 'below',
          trend: Math.random() > 0.3 ? 'uptrend' : 'downtrend'
        },
        bollinger: {
          position: Math.random() > 0.5 ? 'upper' : Math.random() > 0.25 ? 'middle' : 'lower',
          expansion: Math.random() > 0.5 ? 'expanding' : 'contracting'
        },
        volume: {
          ratio: 0.3 + Math.random() * 3.5,
          trend: Math.random() > 0.5 ? 'increasing' : 'decreasing'
        },
        supportResistance: {
          position: Math.random() > 0.5 ? 'above' : 'below',
          level: Math.random() > 0.5 ? 'resistance' : 'support'
        }
      },
      '2': { // ETH
        rsi: 25 + Math.random() * 60,
        macd: {
          crossover: Math.random() > 0.6 ? 'bullish crossover' : 'neutral',
          histogram: Math.random() > 0.4 ? 'positive' : 'negative'
        },
        ema: {
          position: Math.random() > 0.3 ? 'above' : 'below',
          trend: Math.random() > 0.4 ? 'uptrend' : 'downtrend'
        },
        bollinger: {
          position: Math.random() > 0.6 ? 'upper' : Math.random() > 0.3 ? 'middle' : 'lower',
          expansion: Math.random() > 0.6 ? 'expanding' : 'contracting'
        },
        volume: {
          ratio: 0.5 + Math.random() * 2.5,
          trend: Math.random() > 0.6 ? 'increasing' : 'decreasing'
        },
        supportResistance: {
          position: Math.random() > 0.4 ? 'above' : 'below',
          level: Math.random() > 0.4 ? 'resistance' : 'support'
        }
      },
      '3': { // SOL - more volatile
        rsi: 20 + Math.random() * 70,
        macd: {
          crossover: Math.random() > 0.3 ? 'bullish crossover' : Math.random() > 0.5 ? 'bearish crossover' : 'neutral',
          histogram: Math.random() > 0.3 ? 'positive' : 'negative'
        },
        ema: {
          position: Math.random() > 0.4 ? 'above' : 'below',
          trend: Math.random() > 0.2 ? 'uptrend' : 'downtrend'
        },
        bollinger: {
          position: Math.random() > 0.3 ? 'upper' : Math.random() > 0.2 ? 'middle' : 'lower',
          expansion: Math.random() > 0.7 ? 'expanding' : 'contracting'
        },
        volume: {
          ratio: 0.8 + Math.random() * 4.0,
          trend: Math.random() > 0.3 ? 'increasing' : 'decreasing'
        },
        supportResistance: {
          position: Math.random() > 0.3 ? 'above' : 'below',
          level: Math.random() > 0.3 ? 'resistance' : 'support'
        }
      }
    }

    return coinProfiles[coinId as keyof typeof coinProfiles] || coinProfiles['1']
  }

  // Get RSI state description
  private getRSIState(rsi: number): string {
    if (rsi > 80) return 'extremely overbought'
    if (rsi > 70) return 'overbought'
    if (rsi > 60) return 'bullish zone'
    if (rsi > 50) return 'neutral-bullish'
    if (rsi > 40) return 'neutral-bearish'
    if (rsi > 30) return 'bearish zone'
    if (rsi > 20) return 'oversold'
    return 'extremely oversold'
  }

  // Calculate weighted scores for dynamic analysis
  private calculateWeightedScores(technicalBreakdown: any, riskAssessment: any, coinId: string) {
    const bullishScore = technicalBreakdown.bullishSignals.length * 15
    const bearishScore = technicalBreakdown.bearishSignals.length * 15
    const neutralScore = technicalBreakdown.neutralSignals.length * 5
    
    // Coin-specific volatility multipliers
    const volatilityMultipliers = {
      '1': 1.0, // BTC - stable
      '2': 1.2, // ETH - moderate
      '3': 1.5  // SOL - high volatility
    }
    
    const multiplier = volatilityMultipliers[coinId as keyof typeof volatilityMultipliers] || 1.0
    
    return {
      bullish: bullishScore * multiplier,
      bearish: bearishScore * multiplier,
      neutral: neutralScore,
      risk: this.calculateRiskScore(riskAssessment, coinId),
      confidence: this.calculateSignalAlignment(technicalBreakdown)
    }
  }

  // Calculate risk score based on conditions
  private calculateRiskScore(riskAssessment: any, coinId: string): number {
    let riskScore = 50 // Base risk
    
    // Volatility impact
    if (riskAssessment.volatility.includes('High')) riskScore += 25
    if (riskAssessment.volatility.includes('Moderate')) riskScore += 10
    
    // Trend stability impact
    if (riskAssessment.trendStability.includes('Unstable')) riskScore += 20
    if (riskAssessment.trendStability.includes('Stable')) riskScore -= 10
    
    // Overbought/oversold impact
    if (riskAssessment.overboughtOversold.includes('overbought')) riskScore += 15
    if (riskAssessment.overboughtOversold.includes('oversold')) riskScore += 10
    
    // Coin-specific adjustments
    if (coinId === '3') riskScore += 10 // SOL is more volatile
    
    return Math.min(100, Math.max(0, riskScore))
  }

  // Calculate signal alignment for confidence
  private calculateSignalAlignment(technicalBreakdown: any): number {
    const totalSignals = technicalBreakdown.bullishSignals.length + 
                       technicalBreakdown.bearishSignals.length + 
                       technicalBreakdown.neutralSignals.length
    
    if (totalSignals === 0) return 50
    
    const dominantSignals = Math.max(technicalBreakdown.bullishSignals.length, 
                                  technicalBreakdown.bearishSignals.length)
    
    // Higher confidence when signals are aligned
    const alignmentRatio = dominantSignals / totalSignals
    
    return Math.round(alignmentRatio * 100)
  }

  // Generate overall recommendation based on scores
  private generateOverallRecommendation(scores: any): string {
    const bullishScore = scores.bullish
    const bearishScore = scores.bearish
    const riskScore = scores.risk
    
    // Dynamic recommendation logic
    if (bullishScore > bearishScore + 20 && riskScore < 60) {
      return 'Strong Buy'
    } else if (bullishScore > bearishScore + 10 && riskScore < 70) {
      return 'Buy'
    } else if (bullishScore > bearishScore && riskScore < 80) {
      return 'Buy Gradually'
    } else if (bearishScore > bullishScore + 20 && riskScore > 70) {
      return 'Strong Sell'
    } else if (bearishScore > bullishScore + 10 && riskScore > 60) {
      return 'Sell'
    } else if (bearishScore > bullishScore && riskScore > 50) {
      return 'Reduce Risk'
    } else if (riskScore > 80) {
      return 'High Risk - Wait'
    } else if (scores.neutral > scores.bullish && scores.neutral > scores.bearish) {
      return 'Wait for Clear Signal'
    } else if (bullishScore > bearishScore && riskScore > 60) {
      return 'Possible Breakout Setup'
    } else if (bearishScore > bullishScore && riskScore < 40) {
      return 'Consider Partial Profit Taking'
    } else {
      return 'Hold'
    }
  }

  // Generate confidence score based on signal alignment
  private generateConfidenceScore(scores: any): number {
    const baseConfidence = scores.confidence
    const riskAdjustment = scores.risk > 70 ? -15 : scores.risk < 30 ? 10 : 0
    
    return Math.min(95, Math.max(25, baseConfidence + riskAdjustment))
  }

  // Generate risk level based on scores
  private generateRiskLevel(scores: any): 'low' | 'medium' | 'high' | 'very_high' {
    const riskScore = scores.risk
    
    if (riskScore > 80) return 'very_high'
    if (riskScore > 60) return 'high'
    if (riskScore > 40) return 'medium'
    return 'low'
  }

  // Notify all subscribers
  private notifySubscribers() {
    if (!this.isDemoMode) return
    this.callbacks.forEach(callback => callback())
  }
}

// Global instance
export const aiDeepAnalysisEngine = new AIDeepAnalysisEngine()
