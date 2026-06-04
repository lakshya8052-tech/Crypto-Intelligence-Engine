'use client'

import { userProfileManager, type Workspace, type LayoutComponent } from './user-profile'

export interface WorkspaceTemplate {
  id: string
  name: string
  description: string
  type: Workspace['type']
  layout: Workspace['layout']
  indicators: string[]
  timeframes: string[]
  coins: string[]
  strategies: string[]
  isDefault: boolean
}

export interface WorkspacePreset {
  id: string
  name: string
  description: string
  category: 'beginner' | 'intermediate' | 'advanced' | 'professional'
  components: LayoutComponent[]
  settings: {
    gridColumns: number
    gridRows: number
    theme: string
  }
}

export class WorkspaceManager {
  private static instance: WorkspaceManager
  private templates: WorkspaceTemplate[] = []
  private presets: WorkspacePreset[] = []

  private constructor() {
    this.initializeTemplates()
    this.initializePresets()
  }

  static getInstance(): WorkspaceManager {
    if (!WorkspaceManager.instance) {
      WorkspaceManager.instance = new WorkspaceManager()
    }
    return WorkspaceManager.instance
  }

  // Template Management
  getTemplates(): WorkspaceTemplate[] {
    return this.templates
  }

  getTemplate(id: string): WorkspaceTemplate | undefined {
    return this.templates.find(template => template.id === id)
  }

  createWorkspaceFromTemplate(templateId: string, customName?: string): Workspace {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error('Template not found.')
    }

    const profile = userProfileManager.getProfile()
    if (!profile) {
      throw new Error('No profile exists. Create profile first.')
    }

    return userProfileManager.createWorkspace({
      name: customName || template.name,
      description: template.description,
      type: template.type,
      layout: template.layout,
      indicators: template.indicators,
      timeframes: template.timeframes,
      coins: template.coins,
      strategies: template.strategies,
      isActive: true
    })
  }

  // Preset Management
  getPresets(): WorkspacePreset[] {
    return this.presets
  }

  getPreset(id: string): WorkspacePreset | undefined {
    return this.presets.find(preset => preset.id === id)
  }

  applyPresetToWorkspace(workspaceId: string, presetId: string): Workspace {
    const preset = this.getPreset(presetId)
    if (!preset) {
      throw new Error('Preset not found.')
    }

    const profile = userProfileManager.getProfile()
    if (!profile) {
      throw new Error('No profile exists. Create profile first.')
    }

    const workspace = profile.workspaces.find(w => w.id === workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found.')
    }

    return userProfileManager.updateWorkspace(workspaceId, {
      layout: {
        id: preset.id,
        name: preset.name,
        components: preset.components,
        gridColumns: preset.settings.gridColumns,
        gridRows: preset.settings.gridRows,
        theme: preset.settings.theme
      }
    })
  }

  // Layout Management
  addComponentToWorkspace(workspaceId: string, component: LayoutComponent): Workspace {
    const profile = userProfileManager.getProfile()
    if (!profile) {
      throw new Error('No profile exists. Create profile first.')
    }

    const workspace = profile.workspaces.find(w => w.id === workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found.')
    }

    // Check for position conflicts
    const hasConflict = workspace.layout.components.some(
      c => this.checkPositionConflict(c.position, component.position, c.size, component.size)
    )

    if (hasConflict) {
      throw new Error('Component position conflicts with existing component.')
    }

    const updatedLayout = {
      ...workspace.layout,
      components: [...workspace.layout.components, component]
    }

    return userProfileManager.updateWorkspace(workspaceId, {
      layout: updatedLayout,
      lastModified: Date.now()
    })
  }

  removeComponentFromWorkspace(workspaceId: string, componentId: string): Workspace {
    const profile = userProfileManager.getProfile()
    if (!profile) {
      throw new Error('No profile exists. Create profile first.')
    }

    const workspace = profile.workspaces.find(w => w.id === workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found.')
    }

    const updatedLayout = {
      ...workspace.layout,
      components: workspace.layout.components.filter(c => c.id !== componentId)
    }

    return userProfileManager.updateWorkspace(workspaceId, {
      layout: updatedLayout,
      lastModified: Date.now()
    })
  }

  moveComponentInWorkspace(
    workspaceId: string, 
    componentId: string, 
    newPosition: { x: number; y: number }
  ): Workspace {
    const profile = userProfileManager.getProfile()
    if (!profile) {
      throw new Error('No profile exists. Create profile first.')
    }

    const workspace = profile.workspaces.find(w => w.id === workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found.')
    }

    const updatedComponents = workspace.layout.components.map(component => {
      if (component.id === componentId) {
        return { ...component, position: newPosition }
      }
      return component
    })

    const updatedLayout = {
      ...workspace.layout,
      components: updatedComponents
    }

    return userProfileManager.updateWorkspace(workspaceId, {
      layout: updatedLayout,
      lastModified: Date.now()
    })
  }

  resizeComponentInWorkspace(
    workspaceId: string, 
    componentId: string, 
    newSize: { width: number; height: number }
  ): Workspace {
    const profile = userProfileManager.getProfile()
    if (!profile) {
      throw new Error('No profile exists. Create profile first.')
    }

    const workspace = profile.workspaces.find(w => w.id === workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found.')
    }

    const updatedComponents = workspace.layout.components.map(component => {
      if (component.id === componentId) {
        return { ...component, size: newSize }
      }
      return component
    })

    const updatedLayout = {
      ...workspace.layout,
      components: updatedComponents
    }

    return userProfileManager.updateWorkspace(workspaceId, {
      layout: updatedLayout,
      lastModified: Date.now()
    })
  }

  // Workspace Analysis
  getWorkspaceAnalytics(workspaceId: string): {
    componentCount: number
    indicatorCount: number
    coinCount: number
    strategyCount: number
    lastModified: number
    type: string
  } | null {
    const profile = userProfileManager.getProfile()
    if (!profile) {
      return null
    }

    const workspace = profile.workspaces.find(w => w.id === workspaceId)
    if (!workspace) {
      return null
    }

    return {
      componentCount: workspace.layout.components.length,
      indicatorCount: workspace.indicators.length,
      coinCount: workspace.coins.length,
      strategyCount: workspace.strategies.length,
      lastModified: workspace.lastModified,
      type: workspace.type
    }
  }

  // Workspace Comparison
  compareWorkspaces(workspaceId1: string, workspaceId2: string): {
    workspace1: any
    workspace2: any
    differences: string[]
    similarities: string[]
  } | null {
    const profile = userProfileManager.getProfile()
    if (!profile) {
      return null
    }

    const workspace1 = profile.workspaces.find(w => w.id === workspaceId1)
    const workspace2 = profile.workspaces.find(w => w.id === workspaceId2)

    if (!workspace1 || !workspace2) {
      return null
    }

    const differences: string[] = []
    const similarities: string[] = []

    // Compare types
    if (workspace1.type !== workspace2.type) {
      differences.push(`Different types: ${workspace1.type} vs ${workspace2.type}`)
    } else {
      similarities.push(`Same type: ${workspace1.type}`)
    }

    // Compare indicators
    const commonIndicators = workspace1.indicators.filter(i => workspace2.indicators.includes(i))
    const uniqueToWorkspace1 = workspace1.indicators.filter(i => !workspace2.indicators.includes(i))
    const uniqueToWorkspace2 = workspace2.indicators.filter(i => !workspace1.indicators.includes(i))

    if (commonIndicators.length > 0) {
      similarities.push(`Common indicators: ${commonIndicators.join(', ')}`)
    }
    if (uniqueToWorkspace1.length > 0) {
      differences.push(`Unique to workspace 1: ${uniqueToWorkspace1.join(', ')}`)
    }
    if (uniqueToWorkspace2.length > 0) {
      differences.push(`Unique to workspace 2: ${uniqueToWorkspace2.join(', ')}`)
    }

    return {
      workspace1,
      workspace2,
      differences,
      similarities
    }
  }

  // Private Methods
  private checkPositionConflict(
    pos1: { x: number; y: number },
    pos2: { x: number; y: number },
    size1: { width: number; height: number },
    size2: { width: number; height: number }
  ): boolean {
    return !(
      pos1.x + size1.width <= pos2.x ||
      pos2.x + size2.width <= pos1.x ||
      pos1.y + size1.height <= pos2.y ||
      pos2.y + size2.height <= pos1.y
    )
  }

  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'swing-trading',
        name: 'Swing Trading Workspace',
        description: 'Optimized for swing trading with medium-term indicators',
        type: 'swing',
        layout: {
          id: 'swing-layout',
          name: 'Swing Trading Layout',
          components: [
            {
              id: 'main-chart',
              type: 'chart',
              position: { x: 0, y: 0 },
              size: { width: 8, height: 6 },
              config: { timeframe: '4h', chartType: 'candlestick' }
            },
            {
              id: 'signals',
              type: 'signals',
              position: { x: 8, y: 0 },
              size: { width: 4, height: 3 },
              config: { riskLevel: 'moderate' }
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
        indicators: ['RSI', 'MACD', 'Bollinger Bands', 'Volume'],
        timeframes: ['4h', '1d', '1w'],
        coins: ['BTC', 'ETH', 'SOL', 'AVAX'],
        strategies: [],
        isDefault: false
      },
      {
        id: 'scalping',
        name: 'Scalping Workspace',
        description: 'High-frequency trading setup for quick entries and exits',
        type: 'scalping',
        layout: {
          id: 'scalping-layout',
          name: 'Scalping Layout',
          components: [
            {
              id: 'price-chart',
              type: 'chart',
              position: { x: 0, y: 0 },
              size: { width: 6, height: 4 },
              config: { timeframe: '1m', chartType: 'line' }
            },
            {
              id: 'orderbook',
              type: 'analysis',
              position: { x: 6, y: 0 },
              size: { width: 6, height: 4 },
              config: { type: 'orderbook' }
            },
            {
              id: 'quick-signals',
              type: 'signals',
              position: { x: 0, y: 4 },
              size: { width: 12, height: 2 },
              config: { frequency: 'high' }
            }
          ],
          gridColumns: 12,
          gridRows: 6,
          theme: 'dark'
        },
        indicators: ['Volume', 'VWAP', 'RSI', 'Stochastic'],
        timeframes: ['1m', '5m', '15m'],
        coins: ['BTC', 'ETH', 'SOL', 'MATIC'],
        strategies: [],
        isDefault: false
      },
      {
        id: 'position-trading',
        name: 'Position Trading Workspace',
        description: 'Long-term position trading with fundamental analysis',
        type: 'position',
        layout: {
          id: 'position-layout',
          name: 'Position Trading Layout',
          components: [
            {
              id: 'weekly-chart',
              type: 'chart',
              position: { x: 0, y: 0 },
              size: { width: 8, height: 5 },
              config: { timeframe: '1w', chartType: 'candlestick' }
            },
            {
              id: 'fundamentals',
              type: 'analysis',
              position: { x: 8, y: 0 },
              size: { width: 4, height: 5 },
              config: { type: 'fundamentals' }
            },
            {
              id: 'market-sentiment',
              type: 'news',
              position: { x: 0, y: 5 },
              size: { width: 6, height: 1 },
              config: { source: 'sentiment' }
            },
            {
              id: 'portfolio-health',
              type: 'portfolio',
              position: { x: 6, y: 5 },
              size: { width: 6, height: 1 },
              config: { view: 'health' }
            }
          ],
          gridColumns: 12,
          gridRows: 6,
          theme: 'light'
        },
        indicators: ['Moving Averages', 'Volume', 'RSI', 'MACD'],
        timeframes: ['1d', '1w', '1M'],
        coins: ['BTC', 'ETH', 'SOL', 'DOT', 'LINK'],
        strategies: [],
        isDefault: false
      },
      {
        id: 'low-risk',
        name: 'Low Risk Portfolio Workspace',
        description: 'Conservative trading setup focused on capital preservation',
        type: 'custom',
        layout: {
          id: 'low-risk-layout',
          name: 'Low Risk Layout',
          components: [
            {
              id: 'portfolio-overview',
              type: 'portfolio',
              position: { x: 0, y: 0 },
              size: { width: 6, height: 3 },
              config: { view: 'overview' }
            },
            {
              id: 'risk-analysis',
              type: 'analysis',
              position: { x: 6, y: 0 },
              size: { width: 6, height: 3 },
              config: { type: 'risk' }
            },
            {
              id: 'market-overview',
              type: 'chart',
              position: { x: 0, y: 3 },
              size: { width: 12, height: 3 },
              config: { timeframe: '1d', chartType: 'area' }
            }
          ],
          gridColumns: 12,
          gridRows: 6,
          theme: 'light'
        },
        indicators: ['Moving Averages', 'RSI', 'Volume', 'Volatility'],
        timeframes: ['1d', '1w'],
        coins: ['BTC', 'ETH', 'USDT', 'USDC'],
        strategies: [],
        isDefault: false
      }
    ]
  }

  private initializePresets(): void {
    this.presets = [
      {
        id: 'minimalist',
        name: 'Minimalist',
        description: 'Clean, focused layout for distraction-free trading',
        category: 'beginner',
        components: [
          {
            id: 'chart',
            type: 'chart',
            position: { x: 0, y: 0 },
            size: { width: 12, height: 8 },
            config: { timeframe: '1h' }
          }
        ],
        settings: {
          gridColumns: 12,
          gridRows: 8,
          theme: 'light'
        }
      },
      {
        id: 'professional',
        name: 'Professional',
        description: 'Comprehensive layout for serious traders',
        category: 'professional',
        components: [
          {
            id: 'main-chart',
            type: 'chart',
            position: { x: 0, y: 0 },
            size: { width: 8, height: 6 },
            config: { timeframe: '1h' }
          },
          {
            id: 'order-book',
            type: 'analysis',
            position: { x: 8, y: 0 },
            size: { width: 4, height: 3 },
            config: { type: 'orderbook' }
          },
          {
            id: 'recent-trades',
            type: 'analysis',
            position: { x: 8, y: 3 },
            size: { width: 4, height: 3 },
            config: { type: 'trades' }
          },
          {
            id: 'portfolio',
            type: 'portfolio',
            position: { x: 0, y: 6 },
            size: { width: 6, height: 2 },
            config: {}
          },
          {
            id: 'signals',
            type: 'signals',
            position: { x: 6, y: 6 },
            size: { width: 6, height: 2 },
            config: {}
          }
        ],
        settings: {
          gridColumns: 12,
          gridRows: 8,
          theme: 'dark'
        }
      },
      {
        id: 'multi-monitor',
        name: 'Multi-Monitor',
        description: 'Optimized for multi-monitor setups',
        category: 'advanced',
        components: [
          {
            id: 'primary-chart',
            type: 'chart',
            position: { x: 0, y: 0 },
            size: { width: 8, height: 6 },
            config: { timeframe: '1h' }
          },
          {
            id: 'secondary-chart',
            type: 'chart',
            position: { x: 8, y: 0 },
            size: { width: 4, height: 6 },
            config: { timeframe: '4h' }
          },
          {
            id: 'signals-panel',
            type: 'signals',
            position: { x: 0, y: 6 },
            size: { width: 4, height: 2 },
            config: {}
          },
          {
            id: 'portfolio-panel',
            type: 'portfolio',
            position: { x: 4, y: 6 },
            size: { width: 4, height: 2 },
            config: {}
          },
          {
            id: 'news-panel',
            type: 'news',
            position: { x: 8, y: 6 },
            size: { width: 4, height: 2 },
            config: {}
          }
        ],
        settings: {
          gridColumns: 12,
          gridRows: 8,
          theme: 'auto'
        }
      }
    ]
  }
}

// Global instance
export const workspaceManager = WorkspaceManager.getInstance()
