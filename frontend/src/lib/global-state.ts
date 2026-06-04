'use client'

export interface GlobalAppState {
  // User preferences
  preferences: {
    mode: 'beginner' | 'advanced'
    theme: 'light' | 'dark'
    notifications: boolean
    autoRefresh: boolean
    refreshInterval: number
  }
  
  // Watchlist
  watchlist: string[]
  
  // Portfolio
  portfolio: {
    balance: number
    totalValue: number
    totalPnl: number
    totalPnlPercent: number
    openPositions: any[]
    closedPositions: any[]
    winRate: number
    totalTrades: number
    winningTrades: number
    losingTrades: number
  }
  
  // AI settings
  aiSettings: {
    personality: 'professional' | 'friendly' | 'educational' | 'analytical'
    confidence: number
    riskTolerance: 'low' | 'medium' | 'high'
    analysisDepth: 'basic' | 'detailed' | 'comprehensive'
  }
  
  // Workspace settings
  workspace: {
    activeWorkspace: string
    layout: string
    sidebarCollapsed: boolean
    gridColumns: number
  }
  
  // Last updated timestamp
  lastUpdated: number
}

export class GlobalStateManager {
  private state: GlobalAppState
  private callbacks: Set<(state: GlobalAppState) => void> = new Set()
  private storageKey = 'crypto-signals-global-state'

  constructor() {
    this.state = this.loadState()
  }

  // Subscribe to state changes
  subscribe(callback: (state: GlobalAppState) => void) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  // Get current state
  getState(): GlobalAppState {
    return { ...this.state }
  }

  // Update state
  updateState(updates: Partial<GlobalAppState>) {
    this.state = { ...this.state, ...updates, lastUpdated: Date.now() }
    this.saveState()
    this.notifySubscribers()
  }

  // Update specific section
  updatePreferences(preferences: Partial<GlobalAppState['preferences']>) {
    this.updateState({
      preferences: { ...this.state.preferences, ...preferences }
    })
  }

  updateWatchlist(watchlist: string[]) {
    this.updateState({ watchlist })
  }

  updatePortfolio(portfolio: Partial<GlobalAppState['portfolio']>) {
    this.updateState({
      portfolio: { ...this.state.portfolio, ...portfolio }
    })
  }

  updateAISettings(aiSettings: Partial<GlobalAppState['aiSettings']>) {
    this.updateState({
      aiSettings: { ...this.state.aiSettings, ...aiSettings }
    })
  }

  updateWorkspace(workspace: Partial<GlobalAppState['workspace']>) {
    this.updateState({
      workspace: { ...this.state.workspace, ...workspace }
    })
  }

  // Reset state to defaults
  resetState() {
    this.state = this.getDefaultState()
    this.saveState()
    this.notifySubscribers()
  }

  // Load state from localStorage
  private loadState(): GlobalAppState {
    if (typeof window === 'undefined') {
      return this.getDefaultState()
    }
    const stored = localStorage.getItem(this.storageKey)
    if (stored) {
      try {
        return { ...this.getDefaultState(), ...JSON.parse(stored) }
      } catch (error) {
        console.error("Failed to load global state:", error)
      }
    }
    return this.getDefaultState()
  }

  // Save state to localStorage
  private saveState() {
    if (typeof window === 'undefined') {
      return
    }
    localStorage.setItem(this.storageKey, JSON.stringify(this.state))
  }

  // Get default state
  private getDefaultState(): GlobalAppState {
    return {
      preferences: {
        mode: 'beginner',
        theme: 'light',
        notifications: true,
        autoRefresh: true,
        refreshInterval: 5000
      },
      watchlist: [],
      portfolio: {
        balance: 100000,
        totalValue: 100000,
        totalPnl: 0,
        totalPnlPercent: 0,
        openPositions: [],
        closedPositions: [],
        winRate: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0
      },
      aiSettings: {
        personality: 'professional',
        confidence: 75,
        riskTolerance: 'medium',
        analysisDepth: 'detailed'
      },
      workspace: {
        activeWorkspace: 'default',
        layout: 'grid',
        sidebarCollapsed: false,
        gridColumns: 3
      },
      lastUpdated: Date.now()
    }
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.callbacks.forEach(callback => callback(this.getState()))
  }
}

// Global instance
export const globalStateManager = new GlobalStateManager()
