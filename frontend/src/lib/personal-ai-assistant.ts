'use client'

export interface PersonalizedInsight {
  id: string
  type: 'market_summary' | 'portfolio_observation' | 'contextual_suggestion' | 'daily_briefing'
  title: string
  content: string
  priority: 'high' | 'medium' | 'low'
  confidence: number
  timestamp: number
  isRead: boolean
  relevantCoins: string[]
  actionItems: string[]
}

export interface UserBehavior {
  watchedCoins: string[]
  portfolioCoins: string[]
  preferredTimeframe: '1h' | '4h' | '24h' | '7d'
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  learningMode: 'beginner' | 'advanced'
  interactionHistory: {
    lastVisit: number
    totalSessions: number
    averageSessionDuration: number
    clickedInsights: string[]
    dismissedAlerts: string[]
  }
}

export interface DailyBriefing {
  date: string
  marketSummary: string
  portfolioStatus: string
  keyOpportunities: string[]
  riskAlerts: string[]
  recommendations: string[]
  priorityActions: string[]
}

export class PersonalAIAssistantEngine {
  private insights: PersonalizedInsight[] = []
  private userBehavior: UserBehavior
  private callbacks: Set<() => void> = new Set()
  private interval: NodeJS.Timeout | null = null
  // Demo gate
  public isDemoMode: boolean = false

  constructor() {
    // Only load stored behavior/insights in demo mode
    if (this.isDemoMode) {
      this.userBehavior = this.loadUserBehavior()
      this.insights = this.loadInsights()
    } else {
      this.userBehavior = this.loadUserBehavior()
      this.insights = []
    }
  }

  // Subscribe to insight updates
  subscribe(callback: () => void) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  // Start AI assistant engine
  start() {
    if (!this.isDemoMode) return
    if (this.interval) return

    this.interval = setInterval(() => {
      this.updateInsights()
      this.notifySubscribers()
    }, 10000) // Update every 10 seconds
  }

  // Stop AI assistant engine
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  // Get current insights
  getInsights(): PersonalizedInsight[] {
    if (!this.isDemoMode) return []
    return this.insights
  }

  // Get user behavior
  getUserBehavior(): UserBehavior {
    if (!this.isDemoMode) return {
      watchedCoins: [],
      portfolioCoins: [],
      preferredTimeframe: '4h',
      riskTolerance: 'moderate',
      learningMode: 'beginner',
      interactionHistory: {
        lastVisit: Date.now(),
        totalSessions: 1,
        averageSessionDuration: 300,
        clickedInsights: [],
        dismissedAlerts: []
      }
    }
    return this.userBehavior
  }

  // Generate daily briefing
  getDailyBriefing(): DailyBriefing {
    if (!this.isDemoMode) return {
      date: new Date().toISOString().split('T')[0],
      marketSummary: '',
      portfolioStatus: '',
      keyOpportunities: [],
      riskAlerts: [],
      recommendations: [],
      priorityActions: []
    }

    const today = new Date().toISOString().split('T')[0]
    const marketSummary = this.generateMarketSummary()
    const portfolioStatus = this.generatePortfolioStatus()
    const keyOpportunities = this.generateKeyOpportunities()
    const riskAlerts = this.generateRiskAlerts()
    const recommendations = this.generateRecommendations()
    const priorityActions = this.generatePriorityActions()

    return {
      date: today,
      marketSummary,
      portfolioStatus,
      keyOpportunities,
      riskAlerts,
      recommendations,
      priorityActions
    }
  }

  // Update user behavior based on interactions
  updateUserBehavior(interaction: {
    type: 'insight_view' | 'alert_dismiss' | 'coin_add' | 'portfolio_update'
    coinId?: string
    insightId?: string
  }) {
    const now = Date.now()
    
    // Update interaction history
    this.userBehavior.interactionHistory.lastVisit = now
    this.userBehavior.interactionHistory.totalSessions += 1

    switch (interaction.type) {
      case 'insight_view':
        if (interaction.insightId) {
          this.userBehavior.interactionHistory.clickedInsights.push(interaction.insightId)
        }
        break
      case 'alert_dismiss':
        this.userBehavior.interactionHistory.dismissedAlerts.push(interaction.insightId || 'unknown')
        break
      case 'coin_add':
        if (interaction.coinId && !this.userBehavior.watchedCoins.includes(interaction.coinId)) {
          this.userBehavior.watchedCoins.push(interaction.coinId)
        }
        break
      case 'portfolio_update':
        if (interaction.coinId && !this.userBehavior.portfolioCoins.includes(interaction.coinId)) {
          this.userBehavior.portfolioCoins.push(interaction.coinId)
        }
        break
    }

    if (!this.isDemoMode) return
    this.saveUserBehavior()
  }

  // Generate personalized insights based on user behavior and market data
  private updateInsights() {
    if (!this.isDemoMode) return

    const newInsights: PersonalizedInsight[] = []

    // Market summary insight
    if (Math.random() > 0.7) {
      newInsights.push(this.generateMarketSummaryInsight())
    }

    // Portfolio observation insight
    if (this.userBehavior.portfolioCoins.length > 0 && Math.random() > 0.6) {
      newInsights.push(this.generatePortfolioObservationInsight())
    }

    // Contextual suggestion insight
    if (Math.random() > 0.5) {
      newInsights.push(this.generateContextualSuggestionInsight())
    }

    // Daily briefing insight
    const lastBriefing = this.insights.filter(i => i.type === 'daily_briefing')[0]
    if (!lastBriefing || Date.now() - lastBriefing.timestamp > 86400000) { // 24 hours
      newInsights.push(this.generateDailyBriefingInsight())
    }

    // Add new insights and maintain limit
    this.insights = [...newInsights, ...this.insights].slice(-20)
    this.saveInsights()
  }

  private generateMarketSummaryInsight(): PersonalizedInsight {
    const summaries = [
      `Market momentum is shifting based on your watchlist performance`,
      `Volatility patterns suggest adjusting your risk tolerance`,
      `Your preferred timeframe shows emerging trends`,
      `Market sentiment aligns with your portfolio bias`
    ]

    return {
      id: Date.now().toString(),
      type: 'market_summary',
      title: 'Personalized Market Update',
      content: summaries[Math.floor(Math.random() * summaries.length)],
      priority: 'medium',
      confidence: 75,
      timestamp: Date.now(),
      isRead: false,
      relevantCoins: this.userBehavior.watchedCoins.slice(0, 3),
      actionItems: ['Review your portfolio allocation', 'Consider risk adjustment']
    }
  }

  private generatePortfolioObservationInsight(): PersonalizedInsight {
    const observations = [
      `Your portfolio risk increased today due to ${this.userBehavior.watchedCoins[0] || 'BTC'} volatility`,
      `Diversification score suggests adding large-cap assets`,
      `Portfolio concentration in meme coins may need rebalancing`,
      `Your stablecoin ratio is below recommended 10%`
    ]

    return {
      id: Date.now().toString(),
      type: 'portfolio_observation',
      title: 'Portfolio Intelligence Update',
      content: observations[Math.floor(Math.random() * observations.length)],
      priority: 'high',
      confidence: 80,
      timestamp: Date.now(),
      isRead: false,
      relevantCoins: this.userBehavior.portfolioCoins,
      actionItems: ['Rebalance portfolio', 'Add stablecoins', 'Review risk exposure']
    }
  }

  private generateContextualSuggestionInsight(): PersonalizedInsight {
    const suggestions = [
      `Based on your interest in ${this.userBehavior.watchedCoins[0] || 'BTC'}, consider setting up price alerts`,
      `Your ${this.userBehavior.riskTolerance} risk profile suggests different allocation strategies`,
      `Market conditions favor your current portfolio composition`,
      `Consider dollar-cost averaging for ${this.userBehavior.watchedCoins[1] || 'ETH'} position`
    ]

    return {
      id: Date.now().toString(),
      type: 'contextual_suggestion',
      title: 'Personalized Recommendation',
      content: suggestions[Math.floor(Math.random() * suggestions.length)],
      priority: 'medium',
      confidence: 70,
      timestamp: Date.now(),
      isRead: false,
      relevantCoins: this.userBehavior.watchedCoins,
      actionItems: ['Set up alerts', 'Review strategy', 'Adjust position size']
    }
  }

  private generateDailyBriefingInsight(): PersonalizedInsight {
    const briefing = this.getDailyBriefing()
    
    return {
      id: Date.now().toString(),
      type: 'daily_briefing',
      title: 'Daily Market Briefing',
      content: `${briefing.marketSummary}. Key opportunities: ${briefing.keyOpportunities.slice(0, 2).join(', ')}.`,
      priority: 'high',
      confidence: 85,
      timestamp: Date.now(),
      isRead: false,
      relevantCoins: [...this.userBehavior.watchedCoins, ...this.userBehavior.portfolioCoins],
      actionItems: briefing.priorityActions
    }
  }

  private generateMarketSummary(): string {
    const summaries = [
      'Market shows bullish momentum with strong volume support',
      'Mixed signals suggest cautious approach with selective opportunities',
      'Bearish pressure detected but key support levels holding',
      'Consolidation phase with potential breakout setups forming'
    ]
    return summaries[Math.floor(Math.random() * summaries.length)]
  }

  private generatePortfolioStatus(): string {
    const statuses = [
      'Portfolio performing well with balanced risk exposure',
      'High volatility in portfolio requires attention',
      'Diversification score improving with recent additions',
      'Portfolio concentration risk identified in meme coin positions'
    ]
    return statuses[Math.floor(Math.random() * statuses.length)]
  }

  private generateKeyOpportunities(): string[] {
    const opportunities = [
      'BTC breakout above $45,000 resistance level',
      'ETH showing bullish divergence on 4-hour timeframe',
      'DeFi sector rotation into lending protocols',
      'SOL momentum strengthening with increasing volume',
      'Altcoin season showing strength in mid-cap assets',
      'Stablecoin yields attractive for risk-off allocation'
    ]
    return opportunities.slice(0, 3)
  }

  private generateRiskAlerts(): string[] {
    const alerts = [
      'Increased correlation detected between portfolio holdings',
      'Regulatory news may impact selected assets',
      'Technical indicators suggest potential reversal in key positions',
      'Liquidity concerns in smaller market cap assets'
    ]
    return alerts.slice(0, 2)
  }

  private generateRecommendations(): string[] {
    const recommendations = [
      'Consider taking partial profits on strong performers',
      'Maintain diversification across market sectors',
      'Monitor key support levels for entry opportunities',
      'Set stop-losses based on recent volatility patterns'
    ]
    return recommendations.slice(0, 2)
  }

  private generatePriorityActions(): string[] {
    const actions = [
      'Review BTC position for potential profit-taking',
      'Set up alerts for ETH price movements',
      'Research SOL fundamentals for long-term potential',
      'Rebalance portfolio to reduce concentration risk'
    ]
    return actions.slice(0, 3)
  }

  // Mark insight as read
  markInsightAsRead(insightId: string) {
    const insight = this.insights.find(i => i.id === insightId)
    if (insight) {
      insight.isRead = true
      if (this.isDemoMode) this.saveInsights()
    }
  }

  // Dismiss insight
  dismissInsight(insightId: string) {
    this.insights = this.insights.filter(i => i.id !== insightId)
    if (this.isDemoMode) this.saveInsights()
  }

  // Save insights to localStorage
  private saveInsights() {
    if (!this.isDemoMode) return
    // Prevent localStorage access during server-side rendering
    if (typeof window === 'undefined') return
    localStorage.setItem('personal-ai-insights', JSON.stringify(this.insights))
  }

  // Load insights from localStorage
  private loadInsights(): PersonalizedInsight[] {
    if (!this.isDemoMode) return []
    // Prevent localStorage access during server-side rendering
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem('personal-ai-insights')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        console.error('Failed to load insights from localStorage:', error)
        return []
      }
    }
    return []
  }

  // Save user behavior to localStorage
  private saveUserBehavior() {
    if (!this.isDemoMode) return
    // Prevent localStorage access during server-side rendering
    if (typeof window === 'undefined') return
    localStorage.setItem('user-behavior', JSON.stringify(this.userBehavior))
  }

  // Load user behavior from localStorage
  private loadUserBehavior(): UserBehavior {
    if (!this.isDemoMode) return {
      watchedCoins: [],
      portfolioCoins: [],
      preferredTimeframe: '4h',
      riskTolerance: 'moderate',
      learningMode: 'beginner',
      interactionHistory: {
        lastVisit: Date.now(),
        totalSessions: 1,
        averageSessionDuration: 300, // 5 minutes
        clickedInsights: [],
        dismissedAlerts: []
      }
    }

    // Prevent localStorage access during server-side rendering
    if (typeof window === 'undefined') return {
      watchedCoins: [],
      portfolioCoins: [],
      preferredTimeframe: '4h',
      riskTolerance: 'moderate',
      learningMode: 'beginner',
      interactionHistory: {
        lastVisit: Date.now(),
        totalSessions: 1,
        averageSessionDuration: 300, // 5 minutes
        clickedInsights: [],
        dismissedAlerts: []
      }
    }

    const stored = localStorage.getItem('user-behavior')
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        console.error('Failed to load user behavior from localStorage:', error)
      }
    }

    return {
      watchedCoins: [],
      portfolioCoins: [],
      preferredTimeframe: '4h',
      riskTolerance: 'moderate',
      learningMode: 'beginner',
      interactionHistory: {
        lastVisit: Date.now(),
        totalSessions: 1,
        averageSessionDuration: 300, // 5 minutes
        clickedInsights: [],
        dismissedAlerts: []
      }
    }
  }

  // Notify all subscribers
  private notifySubscribers() {
    if (!this.isDemoMode) return
    this.callbacks.forEach(callback => callback())
  }
}

// Global instance
export const personalAIAssistantEngine = new PersonalAIAssistantEngine()
