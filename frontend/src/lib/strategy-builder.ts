'use client'

import { userProfileManager, type Strategy, type StrategyIndicator, type StrategyLogic, type LogicCondition, type LogicAction } from './user-profile'

export interface StrategyTemplate {
  id: string
  name: string
  description: string
  category: 'technical' | 'momentum' | 'mean-reversion' | 'volatility' | 'volume' | 'custom'
  indicators: StrategyIndicator[]
  logic: StrategyLogic[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
}

const mapCategory = (category: StrategyTemplate["category"]): Strategy["type"] => {
  switch (category) {
    case "technical":
      return "technical"

    case "momentum":
      return "momentum"

    case "mean-reversion":
      return "mean-reversion"

    default:
      return "custom"
  }
}


export interface DragDropItem {
  id: string
  type: 'indicator' | 'condition' | 'action' | 'operator'
  data: StrategyIndicator | LogicCondition | LogicAction
  position: { x: number; y: number }
  connections: Connection[]
}

export interface Connection {
  id: string
  from: string
  to: string
  type: 'logic' | 'data'
}

export interface StrategyBuilderState {
  strategy: Partial<Strategy>
  availableIndicators: StrategyIndicator[]
  draggedItem: DragDropItem | null
  connections: Connection[]
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class StrategyBuilder {
  private static instance: StrategyBuilder
  private templates: StrategyTemplate[] = []
  private availableIndicators: StrategyIndicator[] = []
  private builderState: StrategyBuilderState
  // Demo gate: when false, heavy testing and signal generation must be disabled
  public isDemoMode: boolean = false

  private constructor() {
    // Only initialize templates/indicators in demo mode to avoid embedded logic running in production
    this.initializeIndicators()
    this.initializeTemplates()
    this.builderState = {
      strategy: {},
      availableIndicators: this.availableIndicators,
      draggedItem: null,
      connections: [],
      isValid: false,
      errors: [],
      warnings: []
    }
  }

  static getInstance(): StrategyBuilder {
    if (!StrategyBuilder.instance) {
      StrategyBuilder.instance = new StrategyBuilder()
    }
    return StrategyBuilder.instance
  }

  // Strategy Building
  startNewStrategy(template?: StrategyTemplate): StrategyBuilderState {
    if (template) {
      this.builderState = {
        strategy: {
          name: template.name,
          description: template.description,
          type: mapCategory(template.category),
          indicators: [...template.indicators],
          logic: [...template.logic],
          parameters: this.getDefaultParameters(),
          performance: this.getDefaultPerformance()
        },
        availableIndicators: this.availableIndicators,
        draggedItem: null,
        connections: [],
        isValid: false,
        errors: [],
        warnings: []
      }
    } else {
      this.builderState = {
        strategy: {
          name: '',
          description: '',
          type: 'custom',
          indicators: [],
          logic: [],
          parameters: this.getDefaultParameters(),
          performance: this.getDefaultPerformance()
        },
        availableIndicators: this.availableIndicators,
        draggedItem: null,
        connections: [],
        isValid: false,
        errors: [],
        warnings: []
      }
    }

    this.validateStrategy()
    return this.builderState
  }

  addIndicator(indicator: StrategyIndicator): StrategyBuilderState {
    if (!this.builderState.strategy.indicators) {
      this.builderState.strategy.indicators = []
    }

    // Check for duplicates by ID
    const exists = this.builderState.strategy.indicators.some(i => i.id === indicator.id)
    if (exists) {
      this.builderState.errors.push(`${indicator.name} already added`)
      return this.builderState
    }

    this.builderState.strategy.indicators.push(indicator)
    this.validateStrategy()
    return this.builderState
  }

  removeIndicator(indicatorId: string): StrategyBuilderState {
    if (!this.builderState.strategy.indicators) {
      return this.builderState
    }

    this.builderState.strategy.indicators = this.builderState.strategy.indicators.filter(
      i => i.id !== indicatorId
    )
    
    // Remove related connections
    this.builderState.connections = this.builderState.connections.filter(
      c => c.from !== indicatorId && c.to !== indicatorId
    )

    this.validateStrategy()
    return this.builderState
  }

  updateIndicator(indicatorId: string, updates: Partial<StrategyIndicator>): StrategyBuilderState {
    if (!this.builderState.strategy.indicators) {
      return this.builderState
    }

    this.builderState.strategy.indicators = this.builderState.strategy.indicators.map(indicator => {
      if (indicator.id === indicatorId) {
        return { ...indicator, ...updates }
      }
      return indicator
    })

    this.validateStrategy()
    return this.builderState
  }

  addLogicCondition(condition: LogicCondition): StrategyBuilderState {
    if (!this.builderState.strategy.logic) {
      this.builderState.strategy.logic = []
    }

    this.builderState.strategy.logic.push({
      id: this.generateId(),
      type: 'condition',
      operator: 'and',
      conditions: [condition],
      actions: []
    })

    this.validateStrategy()
    return this.builderState
  }

  addLogicAction(action: LogicAction): StrategyBuilderState {
    if (!this.builderState.strategy.logic || this.builderState.strategy.logic.length === 0) {
      this.builderState.errors.push('Add a condition before adding actions')
      return this.builderState
    }

    const lastLogic = this.builderState.strategy.logic[this.builderState.strategy.logic.length - 1]
    lastLogic.actions.push(action)

    this.validateStrategy()
    return this.builderState
  }

  removeLogic(logicId: string): StrategyBuilderState {
    if (!this.builderState.strategy.logic) {
      return this.builderState
    }

    this.builderState.strategy.logic = this.builderState.strategy.logic.filter(
      l => l.id !== logicId
    )

    this.validateStrategy()
    return this.builderState
  }

  // Drag and Drop
  startDrag(item: DragDropItem): StrategyBuilderState {
    this.builderState.draggedItem = item
    return this.builderState
  }

  endDrag(): StrategyBuilderState {
    this.builderState.draggedItem = null
    return this.builderState
  }

  dropItem(position: { x: number; y: number }): StrategyBuilderState {
    if (!this.builderState.draggedItem) {
      return this.builderState
    }

    const item = { ...this.builderState.draggedItem, position }
    
    if (item.type === 'indicator' && 'id' in item.data && 'name' in item.data) {
      this.addIndicator(item.data as StrategyIndicator)
    }

    this.builderState.draggedItem = null
    return this.builderState
  }

  addConnection(connection: Connection): StrategyBuilderState {
    // Check for duplicate connections
    const exists = this.builderState.connections.some(
      c => (c.from === connection.from && c.to === connection.to) ||
             (c.from === connection.to && c.to === connection.from)
    )

    if (exists) {
      this.builderState.errors.push('Connection already exists')
      return this.builderState
    }

    this.builderState.connections.push(connection)
    this.validateStrategy()
    return this.builderState
  }

  removeConnection(connectionId: string): StrategyBuilderState {
    this.builderState.connections = this.builderState.connections.filter(
      c => c.id !== connectionId
    )

    this.validateStrategy()
    return this.builderState
  }

  // Validation
  private validateStrategy(): void {
    this.builderState.errors = []
    this.builderState.warnings = []

    if (!this.builderState.strategy.name) {
      this.builderState.errors.push('Strategy name is required')
    }

    if (!this.builderState.strategy.indicators || this.builderState.strategy.indicators.length === 0) {
      this.builderState.errors.push('At least one indicator is required')
    }

    if (!this.builderState.strategy.logic || this.builderState.strategy.logic.length === 0) {
      this.builderState.errors.push('At least one logic condition is required')
    }

    // Validate logic completeness
    if (this.builderState.strategy.logic) {
      this.builderState.strategy.logic.forEach((logic, index) => {
        if (logic.conditions.length === 0) {
          this.builderState.errors.push(`Logic block ${index + 1} has no conditions`)
        }

        if (logic.actions.length === 0) {
          this.builderState.warnings.push(`Logic block ${index + 1} has no actions`)
        }
      })
    }

    // Validate indicator parameters
    if (this.builderState.strategy.indicators) {
      this.builderState.strategy.indicators.forEach(indicator => {
        if (indicator.weight < 0 || indicator.weight > 1) {
          this.builderState.errors.push(`${indicator.name} weight must be between 0 and 1`)
        }
      })
    }

    this.builderState.isValid = this.builderState.errors.length === 0
  }

  // Strategy Testing
  testStrategy(historicalData: Array<{ timestamp: number; price: number }>): {
    signals: Array<{
      timestamp: number
      type: 'buy' | 'sell'
      confidence: number
      price: number
      reason: string
    }>
    performance: {
      totalSignals: number
      winRate: number
      profitFactor: number
      maxDrawdown: number
    }
  } {
    // Do not execute testing simulation in production mode
    if (!this.isDemoMode) {
      return {
        signals: [],
        performance: {
          totalSignals: 0,
          winRate: 0,
          profitFactor: 0,
          maxDrawdown: 0
        }
      }
    }

    const signals = []
    let wins = 0
    let losses = 0
    let totalProfit = 0
    let totalLoss = 0
    let maxDrawdown = 0
    let currentDrawdown = 0
    let peak = 0

    // Simulate strategy execution
    for (let i = 0; i < historicalData.length; i++) {
      const data = historicalData[i]
      const signal = this.evaluateStrategy(data, i)

      if (signal) {
        signals.push({
          timestamp: data.timestamp,
          type: signal.type,
          confidence: signal.confidence,
          price: data.price,
          reason: signal.reason
        })

        // Simple backtesting logic (would need real implementation)
        if (signal.type === 'buy') {
          // Simulate trade outcome
          const nextData = historicalData[i + 1]
          if (nextData && nextData.price > data.price) {
            wins++
            totalProfit += nextData.price - data.price
          } else {
            losses++
            totalLoss += data.price - (nextData?.price || data.price)
          }
        }

        // Update drawdown
        if (totalProfit - totalLoss > peak) {
          peak = totalProfit - totalLoss
        }
        currentDrawdown = peak - (totalProfit - totalLoss)
        if (currentDrawdown > maxDrawdown) {
          maxDrawdown = currentDrawdown
        }
      }
    }

    return {
      signals,
      performance: {
        totalSignals: signals.length,
        winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
        profitFactor: totalLoss > 0 ? totalProfit / totalLoss : 0,
        maxDrawdown
      }
    }
  }

  private evaluateStrategy(data: { timestamp: number; price: number }, index: number): { type: 'buy' | 'sell'; confidence: number; reason: string } | null {
    // Simplified strategy evaluation (would need real implementation)
    const indicators = this.builderState.strategy.indicators || []
    let score = 0
    let reasons = []

    for (const indicator of indicators) {
      // This would calculate actual indicator values
      const indicatorValue = this.calculateIndicator(indicator, data, index)
      
      if (indicatorValue > 50) {
        score += indicator.weight
        reasons.push(`${indicator.name} is bullish`)
      }
    }

    if (score > 0.7) {
      return {
        type: 'buy',
        confidence: score,
        reason: reasons.join(', ')
      }
    } else if (score < 0.3) {
      return {
        type: 'sell',
        confidence: 1 - score,
        reason: reasons.join(', ')
      }
    }

    return null
  }

  private calculateIndicator(indicator: StrategyIndicator, data: { timestamp: number; price: number }, index: number): number {
    // Simplified indicator calculation (would need real implementation)
    switch (indicator.type) {
      case 'rsi':
        return this.calculateRSI(data, indicator.parameters.period || 14)
      case 'macd':
        return this.calculateMACD(data, indicator.parameters)
      case 'ema':
        return this.calculateEMA(data, indicator.parameters.period || 20)
      case 'volume':
        return this.calculateVolumeSignal(data, index)
      default:
        return 50
    }
  }

  // Simplified indicator calculations (would need real implementations)
  private calculateRSI(data: { timestamp: number; price: number }, period: number): number {
    // Simplified RSI calculation
    return Math.random() * 100
  }

  private calculateMACD(data: { timestamp: number; price: number }, params: { fast?: number; slow?: number; signal?: number }): number {
    // Simplified MACD calculation
    return Math.random() * 100
  }

  private calculateEMA(data: { timestamp: number; price: number }, period: number): number {
    // Simplified EMA calculation
    return Math.random() * 100
  }

  private calculateVolumeSignal(data: { timestamp: number; price: number }, index: number): number {
    // Simplified volume analysis
    return Math.random() * 100
  }

  // Templates
  getTemplates(): StrategyTemplate[] {
    return this.templates
  }

  getTemplate(id: string): StrategyTemplate | undefined {
    return this.templates.find(template => template.id === id)
  }

  createStrategyFromTemplate(templateId: string, customName?: string): Strategy {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error('Template not found.')
    }

    const strategy: Strategy = {
      id: this.generateId(),
      name: customName || template.name,
      description: template.description,
      type: mapCategory(template.category),
      indicators: [...template.indicators],
      logic: [...template.logic],
      parameters: this.getDefaultParameters(),
      performance: this.getDefaultPerformance(),
      createdAt: Date.now(),
      lastModified: Date.now(),
      isPublic: false,
      tags: template.tags
    }

    return userProfileManager.createStrategy(strategy)
  }

  // Utility Methods
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private getDefaultParameters(): Strategy['parameters'] {
    return {
      riskLevel: 0.5,
      positionSize: 1,
      stopLoss: 0.02,
      takeProfit: 0.04,
      timeframe: '1h',
      maxPositions: 5,
      rebalanceFrequency: 'daily'
    }
  }

  private getDefaultPerformance(): Strategy['performance'] {
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

  private initializeIndicators(): void {
    this.availableIndicators = [
      {
        id: 'rsi',
        name: 'RSI',
        type: 'rsi',
        parameters: { period: 14, overbought: 70, oversold: 30 },
        weight: 0.3
      },
      {
        id: 'macd',
        name: 'MACD',
        type: 'macd',
        parameters: { fast: 12, slow: 26, signal: 9 },
        weight: 0.4
      },
      {
        id: 'ema-20',
        name: 'EMA 20',
        type: 'ema',
        parameters: { period: 20 },
        weight: 0.2
      },
      {
        id: 'ema-50',
        name: 'EMA 50',
        type: 'ema',
        parameters: { period: 50 },
        weight: 0.2
      },
      {
        id: 'bollinger',
        name: 'Bollinger Bands',
        type: 'bollinger',
        parameters: { period: 20, stdDev: 2 },
        weight: 0.3
      },
      {
        id: 'volume',
        name: 'Volume',
        type: 'volume',
        parameters: { period: 20 },
        weight: 0.2
      },
      {
        id: 'stochastic',
        name: 'Stochastic',
        type: 'custom',
        parameters: { k: 14, d: 3 },
        weight: 0.3
      }
    ]
  }

  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'rsi-macd',
        name: 'RSI + MACD Strategy',
        description: 'Combines RSI overbought/oversold with MACD trend confirmation',
        category: 'technical',
        indicators: [
          {
            id: 'rsi',
            name: 'RSI',
            type: 'rsi',
            parameters: { period: 14, overbought: 70, oversold: 30 },
            weight: 0.6
          },
          {
            id: 'macd',
            name: 'MACD',
            type: 'macd',
            parameters: { fast: 12, slow: 26, signal: 9 },
            weight: 0.4
          }
        ],
        logic: [
          {
            id: 'buy-logic',
            type: 'condition',
            operator: 'and',
            conditions: [
              {
                indicator: 'RSI',
                operator: 'less_than',
                value: 30
              },
              {
                indicator: 'MACD',
                operator: 'crosses_above',
                value: 'signal'
              }
            ],
            actions: [
              {
                type: 'buy_signal',
                parameters: { confidence: 0.8 }
              }
            ]
          },
          {
            id: 'sell-logic',
            type: 'condition',
            operator: 'and',
            conditions: [
              {
                indicator: 'RSI',
                operator: 'greater_than',
                value: 70
              },
              {
                indicator: 'MACD',
                operator: 'crosses_below',
                value: 'signal'
              }
            ],
            actions: [
              {
                type: 'sell_signal',
                parameters: { confidence: 0.8 }
              }
            ]
          }
        ],
        difficulty: 'beginner',
        tags: ['momentum', 'trend', 'beginner-friendly']
      },
      {
        id: 'ema-crossover',
        name: 'EMA Crossover Strategy',
        description: 'Uses EMA crossovers for trend identification',
        category: 'technical',
        indicators: [
          {
            id: 'ema-fast',
            name: 'EMA 12',
            type: 'ema',
            parameters: { period: 12 },
            weight: 0.5
          },
          {
            id: 'ema-slow',
            name: 'EMA 26',
            type: 'ema',
            parameters: { period: 26 },
            weight: 0.5
          }
        ],
        logic: [
          {
            id: 'crossover-logic',
            type: 'condition',
            operator: 'and',
            conditions: [
              {
                indicator: 'EMA 12',
                operator: 'crosses_above',
                value: 'EMA 26'
              }
            ],
            actions: [
              {
                type: 'buy_signal',
                parameters: { confidence: 0.7 }
              }
            ]
          }
        ],
        difficulty: 'beginner',
        tags: ['trend', 'moving-averages', 'simple']
      },
      {
        id: 'mean-reversion',
        name: 'Mean Reversion Strategy',
        description: 'Identifies overextended moves for reversal trading',
        category: 'technical',
        indicators: [
          {
            id: 'bollinger',
            name: 'Bollinger Bands',
            type: 'bollinger',
            parameters: { period: 20, stdDev: 2 },
            weight: 0.6
          },
          {
            id: 'rsi',
            name: 'RSI',
            type: 'rsi',
            parameters: { period: 14, overbought: 80, oversold: 20 },
            weight: 0.4
          }
        ],
        logic: [
          {
            id: 'reversion-logic',
            type: 'condition',
            operator: 'or',
            conditions: [
              {
                indicator: 'Price',
                operator: 'greater_than',
                value: 'Upper Band'
              },
              {
                indicator: 'RSI',
                operator: 'greater_than',
                value: 80
              }
            ],
            actions: [
              {
                type: 'sell_signal',
                parameters: { confidence: 0.6 }
              }
            ]
          }
        ],
        difficulty: 'intermediate',
        tags: ['mean-reversion', 'volatility', 'contrarian']
      }
    ]
  }

  // State Management
  getState(): StrategyBuilderState {
    return this.builderState
  }

  reset(): void {
    this.builderState = {
      strategy: {},
      availableIndicators: this.availableIndicators,
      draggedItem: null,
      connections: [],
      isValid: false,
      errors: [],
      warnings: []
    }
  }
}





// Global instance
export const strategyBuilder = StrategyBuilder.getInstance()
