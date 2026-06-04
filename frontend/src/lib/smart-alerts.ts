'use client'

export interface SmartAlert {
  id: string
  name: string
  type: 'price_crosses' | 'rsi_zone' | 'signal_generated' | 'volatility_spike' | 'volume_anomaly'
  coinId?: string
  coinSymbol?: string
  condition: {
    operator: 'above' | 'below' | 'enters' | 'exits'
    value: number
    metric: string
  }
  isActive: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: number
  triggeredAt?: number
  triggerCount: number
  lastTriggered?: number
  description: string
}

export interface AlertTrigger {
  id: string
  alertId: string
  timestamp: number
  value: number
  condition: string
  message: string
  acknowledged: boolean
}

export interface AlertHistory {
  triggers: AlertTrigger[]
  totalTriggers: number
  lastTriggered: number
}

export class SmartAlertEngine {
  private alerts: SmartAlert[] = []
  private alertHistory: { [alertId: string]: AlertHistory } = {}
  private callbacks: Set<() => void> = new Set()
  private interval: NodeJS.Timeout | null = null

  constructor() {
    this.loadAlertsFromStorage()
    this.loadHistoryFromStorage()
  }

  // Subscribe to alert updates
  subscribe(callback: () => void) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  // Start alert monitoring
  start() {
    if (this.interval) return

    this.interval = setInterval(() => {
      this.checkAlerts()
      this.notifySubscribers()
    }, 3000) // Check every 3 seconds
  }

  // Stop alert monitoring
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  // Get all alerts
  getAlerts() {
    return this.alerts
  }

  // Get alert history
  getAlertHistory(alertId: string) {
    return this.alertHistory[alertId] || { triggers: [], totalTriggers: 0, lastTriggered: 0 }
  }

  // Create new alert
  createAlert(alert: Omit<SmartAlert, 'id' | 'createdAt' | 'triggerCount'>) {
    const newAlert: SmartAlert = {
      ...alert,
      id: Date.now().toString(),
      createdAt: Date.now(),
      triggerCount: 0
    }

    this.alerts.push(newAlert)
    this.alertHistory[newAlert.id] = { triggers: [], totalTriggers: 0, lastTriggered: 0 }
    this.saveAlertsToStorage()
    this.notifySubscribers()

    return newAlert
  }

  // Update alert
  updateAlert(alertId: string, updates: Partial<SmartAlert>) {
    const alertIndex = this.alerts.findIndex(alert => alert.id === alertId)
    if (alertIndex !== -1) {
      this.alerts[alertIndex] = { ...this.alerts[alertIndex], ...updates }
      this.saveAlertsToStorage()
      this.notifySubscribers()
    }
  }

  // Delete alert
  deleteAlert(alertId: string) {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId)
    delete this.alertHistory[alertId]
    this.saveAlertsToStorage()
    this.notifySubscribers()
  }

  // Toggle alert active status
  toggleAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.isActive = !alert.isActive
      this.saveAlertsToStorage()
      this.notifySubscribers()
    }
  }

  // Check all active alerts
  private checkAlerts() {
    const activeAlerts = this.alerts.filter(alert => alert.isActive)
    
    activeAlerts.forEach(alert => {
      if (this.evaluateAlertCondition(alert)) {
        this.triggerAlert(alert)
      }
    })
  }

  // Evaluate alert condition
  private evaluateAlertCondition(alert: SmartAlert): boolean {
    // Simulate condition checking based on alert type
    const random = Math.random()
    
    switch (alert.type) {
      case 'price_crosses':
        return random > 0.95 // 5% chance of triggering
      case 'rsi_zone':
        return random > 0.90 // 10% chance of triggering
      case 'signal_generated':
        return random > 0.85 // 15% chance of triggering
      case 'volatility_spike':
        return random > 0.92 // 8% chance of triggering
      case 'volume_anomaly':
        return random > 0.88 // 12% chance of triggering
      default:
        return false
    }
  }

  // Trigger alert
  private triggerAlert(alert: SmartAlert) {
    const trigger: AlertTrigger = {
      id: `${alert.id}-${Date.now()}`,
      alertId: alert.id,
      timestamp: Date.now(),
      value: Math.random() * 100000, // Simulated value
      condition: this.formatCondition(alert),
      message: this.generateTriggerMessage(alert),
      acknowledged: false
    }

    // Update alert
    alert.triggerCount += 1
    alert.lastTriggered = trigger.timestamp
    alert.triggeredAt = trigger.timestamp

    // Update history
    if (!this.alertHistory[alert.id]) {
      this.alertHistory[alert.id] = { triggers: [], totalTriggers: 0, lastTriggered: 0 }
    }
    
    this.alertHistory[alert.id].triggers.unshift(trigger)
    this.alertHistory[alert.id].triggers = this.alertHistory[alert.id].triggers.slice(0, 50) // Keep last 50 triggers
    this.alertHistory[alert.id].totalTriggers += 1
    this.alertHistory[alert.id].lastTriggered = trigger.timestamp

    this.saveAlertsToStorage()
    this.saveHistoryToStorage()
  }

  // Format condition for display
  private formatCondition(alert: SmartAlert): string {
    const { operator, value, metric } = alert.condition
    return `${metric} ${operator} ${value}`
  }

  // Generate trigger message
  private generateTriggerMessage(alert: SmartAlert): string {
    const coinName = alert.coinSymbol || 'Market'
    
    switch (alert.type) {
      case 'price_crosses':
        return `${coinName} price crossed ${alert.condition.value} threshold`
      case 'rsi_zone':
        return `${coinName} RSI ${alert.condition.operator} ${alert.condition.value} zone`
      case 'signal_generated':
        return `New ${alert.condition.value} signal generated for ${coinName}`
      case 'volatility_spike':
        return `${coinName} volatility spike detected (${alert.condition.value}%)`
      case 'volume_anomaly':
        return `${coinName} unusual volume activity detected`
      default:
        return `Alert triggered for ${coinName}`
    }
  }

  // Get suggested alerts
  getSuggestedAlerts(): Omit<SmartAlert, 'id' | 'createdAt' | 'triggerCount'>[] {
    return [
      {
        name: 'Bitcoin Price Alert',
        type: 'price_crosses',
        coinId: '1',
        coinSymbol: 'BTC',
        condition: {
          operator: 'above',
          value: 45000,
          metric: 'Price'
        },
        isActive: false,
        priority: 'high',
        description: 'Get notified when Bitcoin crosses $45,000'
      },
      {
        name: 'Ethereum RSI Oversold',
        type: 'rsi_zone',
        coinId: '2',
        coinSymbol: 'ETH',
        condition: {
          operator: 'enters',
          value: 30,
          metric: 'RSI'
        },
        isActive: false,
        priority: 'medium',
        description: 'Alert when Ethereum RSI enters oversold zone (< 30)'
      },
      {
        name: 'Solana Volume Spike',
        type: 'volume_anomaly',
        coinId: '3',
        coinSymbol: 'SOL',
        condition: {
          operator: 'above',
          value: 200,
          metric: 'Volume'
        },
        isActive: false,
        priority: 'medium',
        description: 'Detect unusual volume activity in Solana'
      },
      {
        name: 'Market Volatility Alert',
        type: 'volatility_spike',
        condition: {
          operator: 'above',
          value: 5,
          metric: 'Volatility'
        },
        isActive: false,
        priority: 'low',
        description: 'Alert when market volatility exceeds 5%'
      }
    ]
  }

  // Save alerts to localStorage
  private saveAlertsToStorage() {
    if (typeof window === 'undefined') return
    localStorage.setItem('smart-alerts', JSON.stringify(this.alerts))
  }

  // Load alerts from localStorage
  private loadAlertsFromStorage() {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('smart-alerts')
    if (stored) {
      try {
        this.alerts = JSON.parse(stored)
      } catch (error) {
        console.error('Failed to load alerts from localStorage:', error)
        this.alerts = []
      }
    }
  }

  // Save history to localStorage
  private saveHistoryToStorage() {
    if (typeof window === 'undefined') return
    localStorage.setItem('alert-history', JSON.stringify(this.alertHistory))
  }

  // Load history from localStorage
  private loadHistoryFromStorage() {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('alert-history')
    if (stored) {
      try {
        this.alertHistory = JSON.parse(stored)
      } catch (error) {
        console.error('Failed to load alert history from localStorage:', error)
        this.alertHistory = {}
      }
    }
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.callbacks.forEach(callback => callback())
  }
}

// Global instance
export const smartAlertEngine = new SmartAlertEngine()
