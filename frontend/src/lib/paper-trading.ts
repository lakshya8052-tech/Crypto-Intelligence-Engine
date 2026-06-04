'use client'

export interface PaperTrade {
  id: string
  coinId: string
  coinSymbol: string
  coinName: string
  type: 'buy' | 'sell'
  quantity: number
  price: number
  totalValue: number
  timestamp: number
  status: 'open' | 'closed'
  closePrice?: number
  closeTimestamp?: number
  pnl?: number
  pnlPercent?: number
  fees: number
}

export interface PaperPortfolio {
  balance: number
  totalValue: number
  totalPnl: number
  totalPnlPercent: number
  openPositions: PaperTrade[]
  closedPositions: PaperTrade[]
  winRate: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
}

export interface TradingStats {
  bestTrade: PaperTrade | null
  worstTrade: PaperTrade | null
  averageWin: number
  averageLoss: number
  profitFactor: number
  sharpeRatio: number
  maxDrawdown: number
  currentStreak: number
  bestStreak: number
  worstStreak: number
}

export class PaperTradingEngine {
  private portfolio: PaperPortfolio
  private callbacks: Set<() => void> = new Set()
  private initialBalance: number = 100000

  constructor() {
    this.portfolio = this.loadPortfolioFromStorage()
  }

  // Subscribe to portfolio updates
  subscribe(callback: () => void) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  // Get current portfolio
  getPortfolio() {
    return this.portfolio
  }

  // Execute a trade
  executeTrade(trade: Omit<PaperTrade, 'id' | 'timestamp' | 'status' | 'fees'>) {
    const fees = trade.totalValue * 0.001 // 0.1% trading fee
    const totalCost = trade.totalValue + fees

    // Check if user has enough balance for buy orders
    if (trade.type === 'buy' && this.portfolio.balance < totalCost) {
      throw new Error('Insufficient balance')
    }

    const newTrade: PaperTrade = {
      ...trade,
      id: Date.now().toString(),
      timestamp: Date.now(),
      status: 'open',
      fees
    }

    // Update balance for buy orders
    if (trade.type === 'buy') {
      this.portfolio.balance -= totalCost
    } else {
      // For sell orders, we assume user has the position
      this.portfolio.balance += totalCost - fees
    }

    this.portfolio.openPositions.push(newTrade)
    this.calculatePortfolioStats()
    this.savePortfolioToStorage()
    this.notifySubscribers()

    return newTrade
  }

  // Close a position
  closePosition(tradeId: string, closePrice: number) {
    const tradeIndex = this.portfolio.openPositions.findIndex(t => t.id === tradeId)
    if (tradeIndex === -1) {
      throw new Error('Trade not found')
    }

    const trade = this.portfolio.openPositions[tradeIndex]
    const closeValue = trade.quantity * closePrice
    const fees = closeValue * 0.001
    const netValue = closeValue - fees

    // Calculate PnL
    const pnl = trade.type === 'buy' 
      ? netValue - trade.totalValue 
      : trade.totalValue - netValue
    
    const pnlPercent = (pnl / trade.totalValue) * 100

    // Update trade
    trade.status = 'closed'
    trade.closePrice = closePrice
    trade.closeTimestamp = Date.now()
    trade.pnl = pnl
    trade.pnlPercent = pnlPercent

    // Update balance
    this.portfolio.balance += netValue

    // Move to closed positions
    this.portfolio.closedPositions.push(trade)
    this.portfolio.openPositions.splice(tradeIndex, 1)

    this.calculatePortfolioStats()
    this.savePortfolioToStorage()
    this.notifySubscribers()

    return trade
  }

  // Get trading statistics
  getTradingStats(): TradingStats {
    const closedTrades = this.portfolio.closedPositions
    
    if (closedTrades.length === 0) {
      return {
        bestTrade: null,
        worstTrade: null,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        currentStreak: 0,
        bestStreak: 0,
        worstStreak: 0
      }
    }

    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0)
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0)

    const bestTrade = winningTrades.reduce((best, trade) => 
      (trade.pnl || 0) > (best?.pnl || 0) ? trade : best, null as PaperTrade | null
    )

    const worstTrade = losingTrades.reduce((worst, trade) => 
      (trade.pnl || 0) < (worst?.pnl || 0) ? trade : worst, null as PaperTrade | null
    )

    const averageWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length 
      : 0

    const averageLoss = losingTrades.length > 0 
      ? losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length 
      : 0

    const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0))
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0

    // Calculate streaks
    let currentStreak = 0
    let bestStreak = 0
    let worstStreak = 0
    let tempStreak = 0

    for (const trade of closedTrades.reverse()) {
      if ((trade.pnl || 0) > 0) {
        tempStreak = tempStreak >= 0 ? tempStreak + 1 : 1
        bestStreak = Math.max(bestStreak, tempStreak)
      } else {
        tempStreak = tempStreak <= 0 ? tempStreak - 1 : -1
        worstStreak = Math.min(worstStreak, tempStreak)
      }
    }
    currentStreak = tempStreak

    return {
      bestTrade,
      worstTrade,
      averageWin,
      averageLoss,
      profitFactor,
      sharpeRatio: 0, // Simplified calculation
      maxDrawdown: 0, // Simplified calculation
      currentStreak,
      bestStreak,
      worstStreak
    }
  }

  // Reset portfolio
  resetPortfolio() {
    this.portfolio = {
      balance: this.initialBalance,
      totalValue: this.initialBalance,
      totalPnl: 0,
      totalPnlPercent: 0,
      openPositions: [],
      closedPositions: [],
      winRate: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0
    }
    this.savePortfolioToStorage()
    this.notifySubscribers()
  }

  // Calculate portfolio statistics
  private calculatePortfolioStats() {
    const closedTrades = this.portfolio.closedPositions
    const totalTrades = closedTrades.length
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0).length
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0).length

    const totalPnl = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
    const totalPnlPercent = (totalPnl / this.initialBalance) * 100

    // Calculate open positions value (simplified)
    const openPositionsValue = this.portfolio.openPositions.reduce((sum, trade) => {
      // Simulate current price (in real app, this would come from market data)
      const currentPrice = trade.price * (1 + (Math.random() - 0.5) * 0.1)
      return sum + (trade.quantity * currentPrice)
    }, 0)

    this.portfolio.totalValue = this.portfolio.balance + openPositionsValue
    this.portfolio.totalPnl = totalPnl
    this.portfolio.totalPnlPercent = totalPnlPercent
    this.portfolio.winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
    this.portfolio.totalTrades = totalTrades
    this.portfolio.winningTrades = winningTrades
    this.portfolio.losingTrades = losingTrades
  }

  // Save portfolio to localStorage
  private savePortfolioToStorage() {
    if (typeof window === 'undefined') return
    localStorage.setItem('paper-trading-portfolio', JSON.stringify(this.portfolio))
  }

  // Load portfolio from localStorage
  private loadPortfolioFromStorage(): PaperPortfolio {
    if (typeof window === 'undefined') {
      return {
        balance: this.initialBalance,
        totalValue: this.initialBalance,
        totalPnl: 0,
        totalPnlPercent: 0,
        openPositions: [],
        closedPositions: [],
        winRate: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0
      }
    }
    const stored = localStorage.getItem('paper-trading-portfolio')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        console.error('Failed to load portfolio from localStorage:', error)
      }
    }

    // Return default portfolio
    return {
      balance: this.initialBalance,
      totalValue: this.initialBalance,
      totalPnl: 0,
      totalPnlPercent: 0,
      openPositions: [],
      closedPositions: [],
      winRate: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0
    }
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.callbacks.forEach(callback => callback())
  }
}

// Global instance
export const paperTradingEngine = new PaperTradingEngine()
