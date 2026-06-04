'use client'

export interface UserProfile {
  id: string
  username: string
  email?: string
  avatar?: string
  preferences: UserPreferences
  workspaces: Workspace[]
  strategies: Strategy[]
  createdAt: number
  lastActive: number
  lastModified?: number
  subscription?: 'free' | 'premium' | 'pro'
}

export interface UserPreferences {
  riskLevel: 'conservative' | 'moderate' | 'aggressive'
  analysisStyle: 'beginner' | 'advanced' | 'expert'
  dashboardLayout: 'compact' | 'standard' | 'detailed'
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  notifications: NotificationPreferences
  trading: TradingPreferences
  privacy: PrivacyPreferences
}

export interface NotificationPreferences {
  priceAlerts: boolean
  signalAlerts: boolean
  analysisAlerts: boolean
  portfolioAlerts: boolean
  emailNotifications: boolean
  pushNotifications: boolean
  frequency: 'real-time' | 'hourly' | 'daily' | 'weekly'
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

export interface TradingPreferences {
  defaultTimeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w'
  defaultChartType: 'line' | 'candlestick' | 'area'
  showVolume: boolean
  showIndicators: boolean
  autoRefresh: boolean
  refreshInterval: number
  defaultOrderType: 'market' | 'limit' | 'stop'
  slippageTolerance: number
}

export interface PrivacyPreferences {
  shareAnalytics: boolean
  shareStrategies: boolean
  publicProfile: boolean
  dataRetention: '30days' | '90days' | '1year' | 'forever'
  analyticsTracking: boolean
}

export interface Workspace {
  id: string
  name: string
  description: string
  type: 'swing' | 'scalping' | 'position' | 'day' | 'custom'
  layout: WorkspaceLayout
  indicators: string[]
  timeframes: string[]
  coins: string[]
  strategies: string[]
  createdAt: number
  lastModified: number
  isActive: boolean
}

export interface WorkspaceLayout {
  id: string
  name: string
  components: LayoutComponent[]
  gridColumns: number
  gridRows: number
  theme: string
}

export interface LayoutComponent {
  id: string
  type: 'chart' | 'signals' | 'portfolio' | 'watchlist' | 'analysis' | 'news' | 'opportunities'
  position: { x: number; y: number }
  size: { width: number; height: number }
  config: Record<string, any>
}

export interface Strategy {
  id: string
  name: string
  description: string
  type: 'technical' | 'sentiment' | 'momentum' | 'mean-reversion' | 'breakout' | 'custom'
  indicators: StrategyIndicator[]
  logic: StrategyLogic[]
  parameters: StrategyParameters
  performance: StrategyPerformance
  createdAt: number
  lastModified: number
  isPublic: boolean
  tags: string[]
}

export interface StrategyIndicator {
  id: string
  name: string
  type: 'rsi' | 'macd' | 'ema' | 'sma' | 'bollinger' | 'volume' | 'custom'
  parameters: Record<string, number>
  weight: number
}

export interface StrategyLogic {
  id: string
  type: 'condition' | 'action' | 'filter'
  operator: 'and' | 'or' | 'not'
  conditions: LogicCondition[]
  actions: LogicAction[]
}

export interface LogicCondition {
  indicator: string
  operator: 'greater_than' | 'less_than' | 'crosses_above' | 'crosses_below' | 'equals' | 'not_equals'
  value: number | string
  timeframe?: string
}

export interface LogicAction {
  type: 'buy_signal' | 'sell_signal' | 'alert' | 'calculate_risk'
  parameters: Record<string, any>
}

export interface StrategyParameters {
  riskLevel: number
  positionSize: number
  stopLoss: number
  takeProfit: number
  timeframe: string
  maxPositions: number
  rebalanceFrequency: string
}

export interface StrategyPerformance {
  totalSignals: number
  winningSignals: number
  losingSignals: number
  winRate: number
  averageWin: number
  averageLoss: number
  profitFactor: number
  maxDrawdown: number
  sharpeRatio: number
  totalReturn: number
  annualizedReturn: number
  volatility: number
  lastUpdated: number
}

export class UserProfileManager {
  private static instance: UserProfileManager
  private profile: UserProfile | null = null
  private listeners: Set<() => void> = new Set()

  private constructor() {
    this.loadProfile()
  }

  static getInstance(): UserProfileManager {
    if (!UserProfileManager.instance) {
      UserProfileManager.instance = new UserProfileManager()
    }
    return UserProfileManager.instance
  }

  // Profile Management
  getProfile(): UserProfile | null {
    return this.profile
  }

  createProfile(data: Partial<UserProfile>): UserProfile {
    const defaultProfile: UserProfile = {
      id: this.generateId(),
      username: data.username || 'Anonymous Trader',
      email: data.email,
      avatar: data.avatar,
      preferences: this.getDefaultPreferences(),
      workspaces: data.workspaces || [this.getDefaultWorkspace()],
      strategies: data.strategies || [],
      createdAt: Date.now(),
      lastActive: Date.now(),
      subscription: data.subscription || 'free'
    }

    this.profile = defaultProfile
    this.saveProfile()
    this.notifyListeners()
    return defaultProfile
  }

  updateProfile(updates: Partial<UserProfile>): UserProfile {
    if (!this.profile) {
      throw new Error('No profile exists. Create profile first.')
    }

    this.profile = { ...this.profile, ...updates, lastModified: Date.now() }
    this.saveProfile()
    this.notifyListeners()
    return this.profile
  }

  updatePreferences(updates: Partial<UserPreferences>): UserPreferences {
    if (!this.profile) {
      throw new Error('No profile exists. Create profile first.')
    }

    this.profile.preferences = { ...this.profile.preferences, ...updates }
    this.saveProfile()
    this.notifyListeners()
    return this.profile.preferences
  }

  // Workspace Management
  createWorkspace(workspace: Omit<Workspace, 'id' | 'createdAt' | 'lastModified'>): Workspace {
    if (!this.profile) {
      throw new Error('No profile exists. Create profile first.')
    }

    const newWorkspace: Workspace = {
      ...workspace,
      id: this.generateId(),
      createdAt: Date.now(),
      lastModified: Date.now(),
      isActive: true
    }

    this.profile.workspaces.push(newWorkspace)
    this.saveProfile()
    this.notifyListeners()
    return newWorkspace
  }

  updateWorkspace(id: string, updates: Partial<Workspace>): Workspace {
    if (!this.profile) {
      throw new Error('No profile exists. Create profile first.')
    }

    const workspaceIndex = this.profile.workspaces.findIndex(w => w.id === id)
    if (workspaceIndex === -1) {
      throw new Error('Workspace not found.')
    }

    this.profile.workspaces[workspaceIndex] = {
      ...this.profile.workspaces[workspaceIndex],
      ...updates,
      lastModified: Date.now()
    }

    this.saveProfile()
    this.notifyListeners()
    return this.profile.workspaces[workspaceIndex]
  }

  deleteWorkspace(id: string): void {
    if (!this.profile) {
      throw new Error('No profile exists. Create profile first.')
    }

    this.profile.workspaces = this.profile.workspaces.filter(w => w.id !== id)
    this.saveProfile()
    this.notifyListeners()
  }

  // Strategy Management
  createStrategy(strategy: Omit<Strategy, 'id' | 'createdAt' | 'lastModified' | 'performance'>): Strategy {
    if (!this.profile) {
      throw new Error('No profile exists. Create profile first.')
    }

    const newStrategy: Strategy = {
      ...strategy,
      id: this.generateId(),
      createdAt: Date.now(),
      lastModified: Date.now(),
      performance: this.getDefaultPerformance()
    }

    this.profile.strategies.push(newStrategy)
    this.saveProfile()
    this.notifyListeners()
    return newStrategy
  }

  updateStrategy(id: string, updates: Partial<Strategy>): Strategy {
    if (!this.profile) {
      throw new Error('No profile exists. Create profile first.')
    }

    const strategyIndex = this.profile.strategies.findIndex(s => s.id === id)
    if (strategyIndex === -1) {
      throw new Error('Strategy not found.')
    }

    this.profile.strategies[strategyIndex] = {
      ...this.profile.strategies[strategyIndex],
      ...updates,
      lastModified: Date.now()
    }

    this.saveProfile()
    this.notifyListeners()
    return this.profile.strategies[strategyIndex]
  }

  deleteStrategy(id: string): void {
    if (!this.profile) {
      throw new Error('No profile exists. Create profile first.')
    }

    this.profile.strategies = this.profile.strategies.filter(s => s.id !== id)
    this.saveProfile()
    this.notifyListeners()
  }

  // Subscription Management
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // Data Persistence
  private saveProfile(): void {
    if (!this.profile) return

    try {
      if (typeof window === 'undefined') return
      localStorage.setItem('crypto-signals-profile', JSON.stringify(this.profile))
    } catch (error) {
      console.error('Failed to save profile:', error)
    }
  }

  private loadProfile(): void {
    try {
      if (typeof window === 'undefined') {
        this.profile = null
        return
      }
      const stored = localStorage.getItem('crypto-signals-profile')
      if (stored) {
        this.profile = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      this.profile = null
    }
  }

  // Utility Methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      riskLevel: 'moderate',
      analysisStyle: 'beginner',
      dashboardLayout: 'standard',
      theme: 'auto',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notifications: {
        priceAlerts: true,
        signalAlerts: true,
        analysisAlerts: true,
        portfolioAlerts: true,
        emailNotifications: false,
        pushNotifications: true,
        frequency: 'real-time',
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        }
      },
      trading: {
        defaultTimeframe: '1h',
        defaultChartType: 'candlestick',
        showVolume: true,
        showIndicators: true,
        autoRefresh: true,
        refreshInterval: 30,
        defaultOrderType: 'market',
        slippageTolerance: 0.5
      },
      privacy: {
        shareAnalytics: false,
        shareStrategies: false,
        publicProfile: false,
        dataRetention: '90days',
        analyticsTracking: true
      }
    }
  }

  private getDefaultWorkspace(): Workspace {
    return {
      id: this.generateId(),
      name: 'Default Workspace',
      description: 'Your default trading workspace',
      type: 'custom',
      layout: {
        id: 'default-layout',
        name: 'Default Layout',
        components: [
          {
            id: 'chart',
            type: 'chart',
            position: { x: 0, y: 0 },
            size: { width: 8, height: 6 },
            config: { coin: 'BTC', timeframe: '1h' }
          },
          {
            id: 'signals',
            type: 'signals',
            position: { x: 8, y: 0 },
            size: { width: 4, height: 3 },
            config: {}
          },
          {
            id: 'portfolio',
            type: 'portfolio',
            position: { x: 8, y: 3 },
            size: { width: 4, height: 3 },
            config: {}
          }
        ],
        gridColumns: 12,
        gridRows: 6,
        theme: 'light'
      },
      indicators: ['RSI', 'MACD', 'Volume'],
      timeframes: ['1h', '4h', '1d'],
      coins: ['BTC', 'ETH', 'SOL'],
      strategies: [],
      createdAt: Date.now(),
      lastModified: Date.now(),
      isActive: true
    }
  }

  private getDefaultPerformance(): StrategyPerformance {
    return {
      totalSignals: 0,
      winningSignals: 0,
      losingSignals: 0,
      winRate: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      totalReturn: 0,
      annualizedReturn: 0,
      volatility: 0,
      lastUpdated: Date.now()
    }
  }

  // Analytics
  getProfileStats(): {
    totalWorkspaces: number
    totalStrategies: number
    accountAge: number
    lastActive: number
    subscriptionTier: string
  } {
    if (!this.profile) {
      return {
        totalWorkspaces: 0,
        totalStrategies: 0,
        accountAge: 0,
        lastActive: 0,
        subscriptionTier: 'none'
      }
    }

    return {
      totalWorkspaces: this.profile.workspaces.length,
      totalStrategies: this.profile.strategies.length,
      accountAge: Date.now() - this.profile.createdAt,
      lastActive: this.profile.lastActive,
      subscriptionTier: this.profile.subscription || 'free'
    }
  }

  // Export/Import
  exportProfile(): string {
    if (!this.profile) {
      throw new Error('No profile exists.')
    }

    return JSON.stringify(this.profile, null, 2)
  }

  importProfile(profileData: string): UserProfile {
    try {
      const imported = JSON.parse(profileData)
      
      // Validate imported profile
      if (!imported.username || !imported.preferences) {
        throw new Error('Invalid profile format.')
      }

      this.profile = {
        ...imported,
        id: this.generateId(), // Generate new ID to avoid conflicts
        lastActive: Date.now()
      }

      this.saveProfile()
      this.notifyListeners()
      return this.profile as UserProfile
    } catch (error) {
      throw new Error('Failed to import profile: ' + error)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback())
  }
}

// Global instance
export const userProfileManager = UserProfileManager.getInstance()
