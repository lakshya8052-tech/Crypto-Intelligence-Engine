'use client'

import { userProfileManager, type Strategy, type StrategyPerformance } from './user-profile'

export interface HistoricalDataPoint {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  symbol: string
}

export interface BacktestConfig {
  strategy: Strategy
  symbol: string
  startDate: string
  endDate: string
  initialCapital: number
  positionSize: number
  commission: number
  slippage: number
  timeframe: string
}

export interface BacktestResult {
  id: string
  strategyId: string
  symbol: string
  config: BacktestConfig
  performance: BacktestPerformance
  trades: BacktestTrade[]
  equity: EquityPoint[]
  metrics: BacktestMetrics
  createdAt: number
  duration: number
}

export interface BacktestPerformance extends StrategyPerformance {
  totalReturn: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  calmarRatio: number
  sortinoRatio: number
  profitFactor: number
  recoveryFactor: number
  var95: number // Value at Risk 95%
  cvar95: number // Conditional Value at Risk 95%
}

export interface BacktestTrade {
  id: string
  timestamp: number
  type: 'buy' | 'sell'
  entryPrice: number
  exitPrice?: number
  quantity: number
  value: number
  commission: number
  slippage: number
  pnl?: number
  pnlPercent?: number
  exitReason?: string
  holdingPeriod?: number
  confidence: number
  strategy: string
}

export interface EquityPoint {
  timestamp: number
  equity: number
  drawdown: number
  trades: number
  openPositions: number
}

export interface BacktestMetrics {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  averageWin: number
  averageLoss: number
  largestWin: number
  largestLoss: number
  averageHoldingPeriod: number
  profitFactor: number
  expectancy: number
  kellyCriterion: number
  riskRewardRatio: number
  monthlyReturns: number[]
  yearlyReturns: number[]
  bestMonth: number
  worstMonth: number
  standardDeviation: number
  downsideDeviation: number
  beta: number
  alpha: number
}

export class BacktestingEngine {
  private static instance: BacktestingEngine
  private historicalData: Map<string, HistoricalDataPoint[]> = new Map()
  private backtestResults: BacktestResult[] = []

  private constructor() {
    this.initializeHistoricalData()
  }

  static getInstance(): BacktestingEngine {
    if (!BacktestingEngine.instance) {
      BacktestingEngine.instance = new BacktestingEngine()
    }
    return BacktestingEngine.instance
  }

  // Main backtesting method
  async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    const startTime = Date.now()
    
    try {
      // Get historical data
      const data = this.getHistoricalData(config.symbol, config.startDate, config.endDate)
      if (!data || data.length === 0) {
        throw new Error(`No historical data available for ${config.symbol}`)
      }

      // Initialize backtest state
      const state = this.initializeBacktestState(config)
      
      // Run backtest
      const { trades, equity } = this.executeBacktest(config, data, state)
      
      // Calculate performance metrics
      const performance = this.calculatePerformance(trades, config.initialCapital)
      const metrics = this.calculateDetailedMetrics(trades, equity, config)
      
      // Create result
      const result: BacktestResult = {
        id: this.generateId(),
        strategyId: config.strategy.id,
        symbol: config.symbol,
        config,
        performance,
        trades,
        equity,
        metrics,
        createdAt: Date.now(),
        duration: Date.now() - startTime
      }

      // Save result
      this.backtestResults.push(result)
      this.saveBacktestResult(result)
      
      return result
      
    } catch (error) {
      throw new Error(`Backtest failed: ${error}`)
    }
  }

  // Strategy comparison
  async compareStrategies(
    strategies: Strategy[],
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<{
    comparison: Array<{
      strategy: Strategy
      result: BacktestResult
      rank: number
    }>
    summary: {
      bestStrategy: string
      bestReturn: number
      bestSharpe: number
      bestWinRate: number
    }
  }> {
    const results = []
    
    for (const strategy of strategies) {
      const config: BacktestConfig = {
        strategy,
        symbol,
        startDate,
        endDate,
        initialCapital: 10000,
        positionSize: 1,
        commission: 0.001,
        slippage: 0.0005,
        timeframe: '1d'
      }
      
      try {
        const result = await this.runBacktest(config)
        results.push({ strategy, result, rank: 0 })
      } catch (error) {
        console.error(`Strategy ${strategy.name} failed:`, error)
      }
    }

    // Rank strategies by multiple metrics
    const rankedResults = this.rankStrategies(results)
    
    return {
      comparison: rankedResults,
      summary: {
        bestStrategy: rankedResults[0]?.strategy.name || 'None',
        bestReturn: rankedResults[0]?.result.performance.totalReturn || 0,
        bestSharpe: rankedResults[0]?.result.performance.sharpeRatio || 0,
        bestWinRate: rankedResults[0]?.result.performance.winRate || 0
      }
    }
  }

  // Historical data management
  private getHistoricalData(symbol: string, startDate: string, endDate: string): HistoricalDataPoint[] {
    const data = this.historicalData.get(symbol)
    if (!data) {
      throw new Error(`No data available for ${symbol}`)
    }

    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    
    return data.filter(point => 
      point.timestamp >= start && point.timestamp <= end
    ).sort((a, b) => a.timestamp - b.timestamp)
  }

  private initializeBacktestState(config: BacktestConfig) {
    return {
      capital: config.initialCapital,
      position: 0,
      entryPrice: 0,
      trades: [],
      equity: [],
      openPositions: 0,
      totalCommission: 0,
      totalSlippage: 0
    }
  }

  private executeBacktest(
    config: BacktestConfig,
    data: HistoricalDataPoint[],
    state: any
  ): { trades: BacktestTrade[], equity: EquityPoint[] } {
    const trades: BacktestTrade[] = []
    const equity: EquityPoint[] = []

    for (let i = 0; i < data.length; i++) {
      const currentData = data[i]
      const previousData = i > 0 ? data[i - 1] : currentData
      
      // Generate signals based on strategy
      const signal = this.generateSignal(config.strategy, data, i)
      
      // Execute trades based on signals
      if (signal) {
        const trade = this.executeTrade(signal, currentData, config, state)
        if (trade) {
          trades.push(trade)
        }
      }
      
      // Update equity curve
      const currentEquity = this.calculateEquity(state, currentData.close)
      const drawdown = this.calculateDrawdown(equity, currentEquity)
      
      equity.push({
        timestamp: currentData.timestamp,
        equity: currentEquity,
        drawdown,
        trades: trades.length,
        openPositions: state.position
      })
    }

    return { trades, equity }
  }

  private generateSignal(strategy: Strategy, data: HistoricalDataPoint[], index: number): any {
    // Simplified signal generation (would need real implementation)
    const indicators = strategy.indicators || []
    let score = 0
    let confidence = 0

    for (const indicator of indicators) {
      const indicatorValue = this.calculateIndicator(indicator, data, index)
      
      if (indicatorValue > 50) {
        score += indicator.weight || 0.5
      }
    }

    confidence = Math.min(score, 1)
    
    if (score > 0.7) {
      return { type: 'buy', confidence, price: data[index].close }
    } else if (score < 0.3) {
      return { type: 'sell', confidence, price: data[index].close }
    }
    
    return null
  }

  private calculateIndicator(indicator: any, data: HistoricalDataPoint[], index: number): number {
    // Simplified indicator calculations (would need real implementations)
    switch (indicator.type) {
      case 'rsi':
        return this.calculateRSI(data, indicator.parameters?.period || 14)
      case 'macd':
        return this.calculateMACD(data, indicator.parameters)
      case 'ema':
        return this.calculateEMA(data, indicator.parameters?.period || 20)
      case 'sma':
        return this.calculateSMA(data, indicator.parameters?.period || 20)
      case 'bollinger':
        return this.calculateBollinger(data, indicator.parameters)
      case 'volume':
        return this.calculateVolumeSignal(data, index)
      default:
        return 50
    }
  }

  private executeTrade(signal: any, data: HistoricalDataPoint, config: BacktestConfig, state: any): BacktestTrade | null {
    const tradeValue = config.initialCapital * config.positionSize
    const commission = tradeValue * config.commission
    const slippage = tradeValue * config.slippage

    if (signal.type === 'buy' && state.position <= 0) {
      // Open long position
      state.position = 1
      state.entryPrice = data.close * (1 + config.slippage)
      state.totalCommission += commission
      state.totalSlippage += slippage
      
      return {
        id: this.generateId(),
        timestamp: data.timestamp,
        type: 'buy',
        entryPrice: state.entryPrice,
        quantity: config.positionSize,
        value: tradeValue,
        commission,
        slippage,
        confidence: signal.confidence,
        strategy: config.strategy.name
      }
      
    } else if (signal.type === 'sell' && state.position > 0) {
      // Close position
      const exitPrice = data.close * (1 - config.slippage)
      const pnl = (exitPrice - state.entryPrice) * config.positionSize - commission - slippage
      const pnlPercent = (pnl / (state.entryPrice * config.positionSize)) * 100
      
      state.position = 0
      state.capital += pnl
      state.totalCommission += commission
      state.totalSlippage += slippage
      
      return {
        id: this.generateId(),
        timestamp: data.timestamp,
        type: 'sell',
        entryPrice: state.entryPrice,
        exitPrice,
        quantity: config.positionSize,
        value: tradeValue,
        commission,
        slippage,
        pnl,
        pnlPercent,
        exitReason: 'signal',
        holdingPeriod: 1, // Would calculate actual holding period
        confidence: signal.confidence,
        strategy: config.strategy.name
      }
    }
    
    return null
  }

  private calculateEquity(state: any, currentPrice: number): number {
    let equity = state.capital
    
    if (state.position > 0) {
      equity += (currentPrice - state.entryPrice) * state.position * state.initialCapital * 0.1
    }
    
    return equity
  }

  private calculateDrawdown(equityHistory: EquityPoint[], currentEquity: number): number {
    if (equityHistory.length === 0) return 0
    
    const peak = Math.max(...equityHistory.map(point => point.equity))
    return peak > 0 ? ((peak - currentEquity) / peak) * 100 : 0
  }

  private calculatePerformance(trades: BacktestTrade[], initialCapital: number): BacktestPerformance {
    const winningTrades = trades.filter(t => t.pnl && t.pnl > 0)
    const losingTrades = trades.filter(t => t.pnl && t.pnl < 0)
    
    const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const totalReturn = (totalPnl / initialCapital) * 100
    
    const wins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const losses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0))
    
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0
    const averageWin = winningTrades.length > 0 ? wins / winningTrades.length : 0
    const averageLoss = losingTrades.length > 0 ? losses / losingTrades.length : 0
    
    const profitFactor = losses > 0 ? wins / losses : 0
    
    // Calculate drawdown
    const equityCurve = this.calculateEquityCurve(trades, initialCapital)
    const maxDrawdown = this.calculateMaxDrawdown(equityCurve)
    
    // Calculate Sharpe ratio (simplified)
    const returns = trades.map(t => (t.pnlPercent || 0) / 100)
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length)
    const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0

    return {
      totalSignals: trades.length,
      winningSignals: winningTrades.length,
      losingSignals: losingTrades.length,
      winRate,
      averageWin,
      averageLoss,
      profitFactor,
      maxDrawdown,
      sharpeRatio,
      totalReturn,
      annualizedReturn: totalReturn * 365 / 30, // Simplified annualization
      volatility: stdDev * 100,
      calmarRatio: maxDrawdown > 0 ? totalReturn / Math.abs(maxDrawdown) : 0,
      sortinoRatio: 0, // Would need downside deviation calculation
      recoveryFactor: 0, // Would need recovery calculation
      var95: 0, // Would need VaR calculation
      cvar95: 0, // Would need CVaR calculation
      lastUpdated: Date.now()
    }
  }

  private calculateDetailedMetrics(
    trades: BacktestTrade[],
    equity: EquityPoint[],
    config: BacktestConfig
  ): BacktestMetrics {
    const winningTrades = trades.filter(t => t.pnl && t.pnl > 0)
    const losingTrades = trades.filter(t => t.pnl && t.pnl < 0)
    
    const totalTrades = trades.length
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0
    
    const wins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const losses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0))
    
    const averageWin = winningTrades.length > 0 ? wins / winningTrades.length : 0
    const averageLoss = losingTrades.length > 0 ? losses / losingTrades.length : 0
    
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl || 0)) : 0
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl || 0)) : 0
    
    const profitFactor = losses > 0 ? wins / losses : 0
    const expectancy = totalTrades > 0 ? (wins - losses) / totalTrades : 0
    const kellyCriterion = averageLoss > 0 ? (winRate / 100 * averageWin - (1 - winRate / 100) * averageLoss) / averageLoss : 0
    const riskRewardRatio = averageLoss > 0 ? averageWin / averageLoss : 0

    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      averageHoldingPeriod: 0, // Would calculate from trade data
      profitFactor,
      expectancy,
      kellyCriterion,
      riskRewardRatio,
      monthlyReturns: [], // Would calculate from equity data
      yearlyReturns: [], // Would calculate from equity data
      bestMonth: 0,
      worstMonth: 0,
      standardDeviation: 0,
      downsideDeviation: 0,
      beta: 0,
      alpha: 0
    }
  }

  private rankStrategies(results: Array<{ strategy: Strategy; result: BacktestResult; rank: number }>) {
    // Sort by composite score (weighted combination of metrics)
    return results.sort((a, b) => {
      const scoreA = this.calculateCompositeScore(a.result.performance)
      const scoreB = this.calculateCompositeScore(b.result.performance)
      return scoreB - scoreA
    }).map((result, index) => ({ ...result, rank: index + 1 }))
  }

  private calculateCompositeScore(performance: BacktestPerformance): number {
    // Weighted score for ranking
    return (
      performance.totalReturn * 0.3 +
      performance.sharpeRatio * 0.25 +
      performance.winRate * 0.2 +
      performance.profitFactor * 0.15 +
      (100 - Math.abs(performance.maxDrawdown)) * 0.1
    )
  }

  // Simplified indicator calculations (would need real implementations)
  private calculateRSI(data: HistoricalDataPoint[], period: number): number {
    return Math.random() * 100
  }

  private calculateMACD(data: HistoricalDataPoint[], params: any): number {
    return Math.random() * 100
  }

  private calculateEMA(data: HistoricalDataPoint[], period: number): number {
    return Math.random() * 100
  }

  private calculateSMA(data: HistoricalDataPoint[], period: number): number {
    return Math.random() * 100
  }

  private calculateBollinger(data: HistoricalDataPoint[], params: any): number {
    return Math.random() * 100
  }

  private calculateVolumeSignal(data: HistoricalDataPoint[], index: number): number {
    return Math.random() * 100
  }

  private calculateEquityCurve(trades: BacktestTrade[], initialCapital: number): number[] {
    // Simplified equity curve calculation
    return [initialCapital]
  }

  private calculateMaxDrawdown(equityCurve: number[]): number {
    if (equityCurve.length === 0) return 0
    
    let maxDrawdown = 0
    let peak = equityCurve[0]
    
    for (const equity of equityCurve) {
      if (equity > peak) peak = equity
      const drawdown = ((peak - equity) / peak) * 100
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
    }
    
    return maxDrawdown
  }

  // Data persistence
  private saveBacktestResult(result: BacktestResult): void {
    if (typeof window === "undefined") {
      return
    }
    try {
      const existing = localStorage.getItem("crypto-signals-backtests")
      const backtests = existing ? JSON.parse(existing) : []
      backtests.push(result)
      
      // Keep only last 50 backtests
      if (backtests.length > 50) {
        backtests.splice(0, backtests.length - 50)
      }
      
      localStorage.setItem("crypto-signals-backtests", JSON.stringify(backtests))
    } catch (error) {
      console.error("Failed to save backtest result:", error)
    }
  }

  public getBacktestResults(): BacktestResult[] {
    if (typeof window === "undefined") {
      return []
    }
    try {
      const existing = localStorage.getItem("crypto-signals-backtests")
      return existing ? JSON.parse(existing) : []
    } catch (error) {
      console.error("Failed to load backtest results:", error)
      return []
    }
  }

  public deleteBacktestResult(id: string): void {
    if (typeof window === "undefined") {
      return
    }
    try {
      const existing = localStorage.getItem("crypto-signals-backtests")
      const backtests = existing ? JSON.parse(existing) : []
      const filtered = backtests.filter((b: BacktestResult) => b.id !== id)
      localStorage.setItem("crypto-signals-backtests", JSON.stringify(filtered))
    } catch (error) {
      console.error("Failed to delete backtest result:", error)
    }
  }

  private initializeHistoricalData(): void {
    // Generate mock historical data for demonstration
    const symbols = ['BTC', 'ETH', 'SOL', 'AVAX', 'DOT']
    const endDate = Date.now()
    const startDate = endDate - (365 * 24 * 60 * 60 * 1000) // 1 year ago
    
    for (const symbol of symbols) {
      const data: HistoricalDataPoint[] = []
      let currentPrice = 100 + Math.random() * 40000 // Random starting price
      
      for (let timestamp = startDate; timestamp <= endDate; timestamp += 24 * 60 * 60 * 1000) {
        const volatility = 0.02 + Math.random() * 0.08 // 2-10% daily volatility
        const change = (Math.random() - 0.5) * 2 * volatility
        const open = currentPrice
        const close = currentPrice * (1 + change)
        const high = Math.max(open, close) * (1 + Math.random() * 0.02)
        const low = Math.min(open, close) * (1 - Math.random() * 0.02)
        const volume = 1000000 + Math.random() * 9000000
        
        data.push({
          timestamp,
          open,
          high,
          low,
          close,
          volume,
          symbol
        })
        
        currentPrice = close
      }
      
      this.historicalData.set(symbol, data)
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Global instance
export const backtestingEngine = BacktestingEngine.getInstance()
