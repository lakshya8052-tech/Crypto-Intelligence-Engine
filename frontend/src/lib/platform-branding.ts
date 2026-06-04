'use client'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  type: 'welcome' | 'tutorial' | 'preference' | 'feature' | 'completion'
  component: 'video' | 'interactive' | 'form' | 'carousel' | 'modal'
  content: any
  order: number
  isRequired: boolean
  isCompleted: boolean
  estimatedTime?: number // in minutes
}

export interface OnboardingProgress {
  currentStep: number
  totalSteps: number
  completedSteps: string[]
  isCompleted: boolean
  startedAt: number
  estimatedCompletionTime?: number
}

export interface BrandingConfig {
  platform: {
    name: string
    tagline: string
    description: string
    version: string
    logo: string
    colors: {
      primary: string
      secondary: string
      accent: string
      success: string
      warning: string
      error: string
      background: {
        light: string
        dark: string
      }
    }
    typography: {
      fontFamily: string
      headingFont: string
      bodyFont: string
      codeFont: string
    }
  }
  ai: {
    name: string
    personality: 'professional' | 'friendly' | 'educational' | 'analytical'
    avatar: string
    communication: {
      style: 'clear' | 'detailed' | 'concise' | 'educational'
      uncertainty: boolean // Whether to admit uncertainty
      limitations: boolean // Whether to mention limitations
      confidence: boolean // Whether to show confidence levels
    }
  }
  messaging: {
    welcome: string
    emptyState: string
    loading: string
    error: string
    success: string
    disclaimer: string
  }
  features: {
    premium: string[]
    comingSoon: string[]
    beta: string[]
  }
}

export interface EmptyStateConfig {
  type: 'no-data' | 'no-watchlist' | 'no-signals' | 'no-analysis' | 'no-strategies' | 'no-workspaces' | 'no-portfolio' | 'network-error' | 'loading'
  title: string
  description: string
  icon?: string
  action?: {
    label: string
    action: () => void
    variant?: 'primary' | 'secondary'
  }
  illustration?: {
    type: 'icon' | 'image' | 'animation'
    content: string
  }
  tips?: string[]
}

export class PlatformBrandingManager {
  private static instance: PlatformBrandingManager
  private brandingConfig: BrandingConfig = this.getDefaultBrandingConfig()
  private onboardingProgress: OnboardingProgress = {
    currentStep: 0,
    totalSteps: 0,
    completedSteps: [],
    isCompleted: false,
    startedAt: Date.now()
  }
  private hasSeenOnboarding: boolean = false

  private constructor() {
    this.initializeBranding()
    this.loadOnboardingProgress()
  }

  static getInstance(): PlatformBrandingManager {
    if (!PlatformBrandingManager.instance) {
      PlatformBrandingManager.instance = new PlatformBrandingManager()
    }
    return PlatformBrandingManager.instance
  }

  // Branding Configuration
  getBrandingConfig(): BrandingConfig {
    return this.brandingConfig
  }

  updateBrandingConfig(updates: Partial<BrandingConfig>): void {
    this.brandingConfig = { ...this.brandingConfig, ...updates }
    this.saveBrandingConfig()
  }

  // Onboarding Management
  startOnboarding(): OnboardingProgress {
    this.onboardingProgress = {
      currentStep: 0,
      totalSteps: this.getOnboardingSteps().length,
      completedSteps: [],
      isCompleted: false,
      startedAt: Date.now(),
      estimatedCompletionTime: 5 // 5 minutes
    }

    this.saveOnboardingProgress()
    return this.onboardingProgress
  }

  completeOnboardingStep(stepId: string): void {
    if (!this.onboardingProgress.completedSteps.includes(stepId)) {
      this.onboardingProgress.completedSteps.push(stepId)
      
      // Move to next step
      const steps = this.getOnboardingSteps()
      const currentIndex = steps.findIndex(step => step.id === stepId)
      if (currentIndex < steps.length - 1) {
        this.onboardingProgress.currentStep = currentIndex + 1
      } else {
        this.onboardingProgress.isCompleted = true
      }

      this.saveOnboardingProgress()
    }
  }

  skipOnboarding(): void {
    this.onboardingProgress.isCompleted = true
    this.hasSeenOnboarding = true
    this.saveOnboardingProgress()
  }

  getOnboardingProgress(): OnboardingProgress {
    return this.onboardingProgress
  }

  getCurrentOnboardingStep(): OnboardingStep | null {
    const steps = this.getOnboardingSteps()
    return this.onboardingProgress.currentStep < steps.length 
      ? steps[this.onboardingProgress.currentStep] 
      : null
  }

  // Empty State Management
  getEmptyStateConfig(type: EmptyStateConfig['type']): EmptyStateConfig {
    const configs: Record<EmptyStateConfig['type'], EmptyStateConfig> = {
      'no-data': {
        type: 'no-data',
        title: 'No Market Data Available',
        description: 'We couldn\'t load market data at the moment. Please check your internet connection and try again.',
        icon: 'refresh-cw',
        action: {
          label: 'Refresh',
          action: () => window.location.reload(),
          variant: 'primary'
        },
        illustration: {
          type: 'icon',
          content: 'data-unavailable'
        },
        tips: [
          'Check your internet connection',
          'Try refreshing the page',
          'Market data might be temporarily unavailable'
        ]
      },
      'no-watchlist': {
        type: 'no-watchlist',
        title: 'Your Watchlist is Empty',
        description: 'Start building your watchlist by adding cryptocurrencies you want to track.',
        icon: 'star',
        action: {
          label: 'Add Coins',
          action: () => this.navigateToWatchlist(),
          variant: 'primary'
        },
        illustration: {
          type: 'icon',
          content: 'watchlist-empty'
        },
        tips: [
          'Add popular coins like BTC, ETH, SOL',
          'Use the search bar to find specific coins',
          'Create multiple watchlists for different strategies'
        ]
      },
      'no-signals': {
        type: 'no-signals',
        title: 'No Trading Signals',
        description: 'Our AI is analyzing market conditions. Signals will appear here when opportunities are detected.',
        icon: 'activity',
        action: {
          label: 'Refresh Signals',
          action: () => this.navigateToSignals(),
          variant: 'secondary'
        },
        illustration: {
          type: 'animation',
          content: 'signals-loading'
        },
        tips: [
          'Signals are generated based on market conditions',
          'Enable notifications to get real-time alerts',
          'Check your analysis settings for signal frequency'
        ]
      },
      'no-analysis': {
        type: 'no-analysis',
        title: 'Analysis in Progress',
        description: 'Our AI is currently analyzing the selected cryptocurrency. This usually takes a few seconds.',
        icon: 'brain',
        action: {
          label: 'Wait for Analysis',
          action: () => {}, // No action needed
          variant: 'secondary'
        },
        illustration: {
          type: 'animation',
          content: 'analysis-loading'
        },
        tips: [
          'Analysis considers multiple timeframes',
          'Results include confidence scores',
          'Higher confidence means more reliable signals'
        ]
      },
      'no-strategies': {
        type: 'no-strategies',
        title: 'No Trading Strategies',
        description: 'Create your first trading strategy using our visual strategy builder.',
        icon: 'settings',
        action: {
          label: 'Create Strategy',
          action: () => this.navigateToStrategyBuilder(),
          variant: 'primary'
        },
        illustration: {
          type: 'icon',
          content: 'strategy-empty'
        },
        tips: [
          'Start with our pre-built strategy templates',
          'Combine multiple indicators for better signals',
          'Test your strategies with our backtesting tool'
        ]
      },
      'no-workspaces': {
        type: 'no-workspaces',
        title: 'No Workspaces Yet',
        description: 'Create your first workspace to organize your trading setup and analysis tools.',
        icon: 'layout',
        action: {
          label: 'Create Workspace',
          action: () => this.navigateToWorkspaces(),
          variant: 'primary'
        },
        illustration: {
          type: 'icon',
          content: 'workspace-empty'
        },
        tips: [
          'Workspaces help organize your trading tools',
          'Create different workspaces for different trading styles',
          'Save your favorite indicator combinations'
        ]
      },
      'no-portfolio': {
        type: 'no-portfolio',
        title: 'Portfolio Not Started',
        description: 'Begin your paper trading journey by adding your first virtual position.',
        icon: 'briefcase',
        action: {
          label: 'Start Paper Trading',
          action: () => this.navigateToPortfolio(),
          variant: 'primary'
        },
        illustration: {
          type: 'icon',
          content: 'portfolio-empty'
        },
        tips: [
          'Paper trading helps you test strategies risk-free',
          'Start with a small virtual balance',
          'Track your performance over time'
        ]
      },
      'network-error': {
        type: 'network-error',
        title: 'Connection Error',
        description: 'Unable to connect to our services. Please check your internet connection and try again.',
        icon: 'wifi-off',
        action: {
          label: 'Retry Connection',
          action: () => window.location.reload(),
          variant: 'primary'
        },
        illustration: {
          type: 'icon',
          content: 'network-error'
        },
        tips: [
          'Check your internet connection',
          'Try refreshing the page',
          'Contact support if the problem persists'
        ]
      },
      'loading': {
        type: 'loading',
        title: 'Loading...',
        description: 'Please wait while we process your request.',
        icon: 'loader',
        illustration: {
          type: 'animation',
          content: 'loading-spinner'
        },
        tips: [
          'This should only take a moment',
          'Large datasets may take longer to load',
          'Thank you for your patience'
        ]
      }
    }

    return configs[type] || configs['no-data']
  }

  // AI Personality Management
  getAIPersonality(): BrandingConfig['ai'] {
    return this.brandingConfig.ai
  }

  updateAIPersonality(updates: Partial<BrandingConfig['ai']>): void {
    this.brandingConfig.ai = { ...this.brandingConfig.ai, ...updates }
    this.saveBrandingConfig()
  }

  generateAIResponse(
    type: 'analysis' | 'recommendation' | 'explanation' | 'warning',
    content: string,
    options?: {
      confidence?: number
      uncertainty?: boolean
      educational?: boolean
      limitations?: boolean
    }
  ): string {
    const { personality, communication } = this.brandingConfig.ai
    
    let response = content

    // Apply personality-based styling
    switch (personality) {
      case 'professional':
        response = this.applyProfessionalTone(content, options)
        break
      case 'friendly':
        response = this.applyFriendlyTone(content, options)
        break
      case 'educational':
        response = this.applyEducationalTone(content, options)
        break
      case 'analytical':
        response = this.applyAnalyticalTone(content, options)
        break
      default:
        response = this.applyProfessionalTone(content, options)
    }

    // Add uncertainty and limitations if enabled
    if (options?.uncertainty && communication.uncertainty) {
      response += '\n\n*Note: This analysis is based on historical data and current market conditions. Actual results may vary.*'
    }

    if (options?.limitations && communication.limitations) {
      response += '\n\n*Disclaimer: This is not financial advice. Always do your own research before making trading decisions.*'
    }

    return response
  }

  // Private Methods
  private initializeBranding(): void {
    this.brandingConfig = this.loadBrandingConfig()
  }

  private getOnboardingSteps(): OnboardingStep[] {
    return [
      {
        id: 'welcome',
        title: 'Welcome to CryptoSignals AI',
        description: 'Let\'s get you set up with a quick tour of our intelligent crypto trading platform.',
        type: 'welcome',
        component: 'carousel',
        content: {
          features: [
            'AI-Powered Market Analysis',
            'Custom Trading Strategies',
            'Real-time Signals',
            'Paper Trading Simulator',
            'Advanced Analytics'
          ]
        },
        order: 1,
        isRequired: false,
        isCompleted: false,
        estimatedTime: 1
      },
      {
        id: 'preferences',
        title: 'Set Your Preferences',
        description: 'Customize your trading experience with risk levels, analysis styles, and notification settings.',
        type: 'preference',
        component: 'form',
        content: {
          fields: [
            'Risk Level',
            'Analysis Style',
            'Default Timeframe',
            'Notification Preferences'
          ]
        },
        order: 2,
        isRequired: true,
        isCompleted: false,
        estimatedTime: 2
      },
      {
        id: 'workspace',
        title: 'Create Your First Workspace',
        description: 'Set up a personalized workspace with your favorite indicators and analysis tools.',
        type: 'feature',
        component: 'interactive',
        content: {
          template: 'default',
          customization: 'indicators, layout, timeframes'
        },
        order: 3,
        isRequired: false,
        isCompleted: false,
        estimatedTime: 3
      },
      {
        id: 'tutorial',
        title: 'Learn the Basics',
        description: 'Quick tutorial on how to use our AI analysis and strategy building tools.',
        type: 'tutorial',
        component: 'video',
        content: {
          videoUrl: '/tutorial/getting-started',
          duration: '3:45'
        },
        order: 4,
        isRequired: false,
        isCompleted: false,
        estimatedTime: 4
      },
      {
        id: 'completion',
        title: 'You\'re All Set!',
        description: 'Your workspace is ready. Start exploring our AI-powered crypto intelligence features.',
        type: 'completion',
        component: 'modal',
        content: {
          nextSteps: [
            'Run your first analysis',
            'Create a trading strategy',
            'Set up price alerts'
          ]
        },
        order: 5,
        isRequired: false,
        isCompleted: false,
        estimatedTime: 1
      }
    ]
  }

  private applyProfessionalTone(content: string, options?: any): string {
    return content
  }

  private applyFriendlyTone(content: string, options?: any): string {
    return content
  }

  private applyEducationalTone(content: string, options?: any): string {
    return content
  }

  private applyAnalyticalTone(content: string, options?: any): string {
    return content
  }

  private navigateToWatchlist(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/watchlist'
    }
  }

  private navigateToSignals(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/signals'
    }
  }

  private navigateToStrategyBuilder(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/strategy-builder'
    }
  }

  private navigateToWorkspaces(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/workspaces'
    }
  }

  private navigateToPortfolio(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/portfolio'
    }
  }

  // Data Persistence
  private saveBrandingConfig(): void {
    try {
      localStorage.setItem('crypto-signals-branding', JSON.stringify(this.brandingConfig))
    } catch (error) {
      console.error('Failed to save branding config:', error)
    }
  }

  private loadBrandingConfig(): BrandingConfig {
    try {
      if (typeof window === 'undefined') return this.getDefaultBrandingConfig()
      const stored = localStorage.getItem('crypto-signals-branding')
      return stored ? JSON.parse(stored) : this.getDefaultBrandingConfig()
    } catch (error) {
      console.error('Failed to load branding config:', error)
      return this.getDefaultBrandingConfig()
    }
  }

  private saveOnboardingProgress(): void {
    try {
      if (typeof window === 'undefined') return
      localStorage.setItem('crypto-signals-onboarding', JSON.stringify(this.onboardingProgress))
    } catch (error) {
      console.error('Failed to save onboarding progress:', error)
    }
  }

  private loadOnboardingProgress(): void {
    try {
      if (typeof window === 'undefined') return
      const stored = localStorage.getItem('crypto-signals-onboarding')
      if (stored) {
        this.onboardingProgress = JSON.parse(stored)
      }
      
      // Check if onboarding was previously completed
      this.hasSeenOnboarding = this.onboardingProgress.isCompleted || false
      
      // Reset onboarding if it's been more than 30 days
      const daysSinceCompletion = (Date.now() - this.onboardingProgress.startedAt) / (24 * 60 * 60 * 1000)
      if (daysSinceCompletion > 30) {
        this.onboardingProgress = {
          currentStep: 0,
          totalSteps: this.getOnboardingSteps().length,
          completedSteps: [],
          isCompleted: false,
          startedAt: Date.now(),
          estimatedCompletionTime: 5
        }
      }
    } catch (error) {
      console.error('Failed to load onboarding progress:', error)
      this.onboardingProgress = {
        currentStep: 0,
        totalSteps: this.getOnboardingSteps().length,
        completedSteps: [],
        isCompleted: false,
        startedAt: Date.now(),
        estimatedCompletionTime: 5
      }
    }
  }

  private getDefaultBrandingConfig(): BrandingConfig {
    return {
      platform: {
        name: 'CryptoSignals AI',
        tagline: 'Intelligent Crypto Trading Signals',
        description: 'Advanced AI-powered cryptocurrency analysis and trading signals platform',
        version: '1.0.0',
        logo: '/logo.svg',
        colors: {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#06B6D4',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          background: {
            light: '#FFFFFF',
            dark: '#0F172A'
          }
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
          headingFont: 'Inter',
          bodyFont: 'Inter',
          codeFont: 'JetBrains Mono, monospace'
        }
      },
      ai: {
        name: 'CryptoSignals AI',
        personality: 'professional',
        avatar: '/ai-avatar.svg',
        communication: {
          style: 'clear',
          uncertainty: true,
          limitations: true,
          confidence: true
        }
      },
      messaging: {
        welcome: 'Welcome to your intelligent crypto trading assistant',
        emptyState: 'No data available at the moment',
        loading: 'Analyzing market conditions...',
        error: 'Something went wrong. Please try again.',
        success: 'Operation completed successfully',
        disclaimer: 'This is not financial advice. Always do your own research.'
      },
      features: {
        premium: [
          'Advanced AI Analysis',
          'Custom Strategy Builder',
          'Backtesting Engine',
          'Real-time Signals',
          'Portfolio Analytics'
        ],
        comingSoon: [
          'Mobile App',
          'API Access',
          'Community Features',
          'Social Trading'
        ],
        beta: [
          'Advanced Analytics',
          'Custom Indicators'
        ]
      }
    }
  }
}

// Global instance
export const platformBrandingManager = PlatformBrandingManager.getInstance()
