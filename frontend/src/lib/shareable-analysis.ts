'use client'

import { userProfileManager, type Strategy, type Workspace } from './user-profile'

export interface ShareableAnalysis {
  id: string
  type: 'analysis' | 'strategy' | 'workspace' | 'insight'
  title: string
  description: string
  content: ShareableContent
  metadata: ShareableMetadata
  createdAt: number
  expiresAt?: number
  isPublic: boolean
  shareCode: string
  viewCount: number
  downloadCount: number
}

export interface ShareableContent {
  analysis?: {
    symbol: string
    timeframe: string
    indicators: string[]
    summary: string
    confidence: number
    riskLevel: string
    recommendation: string
    timestamp: number
  }
  strategy?: {
    name: string
    description: string
    indicators: any[]
    logic: any[]
    parameters: any
    performance?: any
  }
  workspace?: {
    name: string
    description: string
    layout: any
    indicators: string[]
    timeframes: string[]
    coins: string[]
  }
  insight?: {
    title: string
    content: string
    category: string
    confidence: number
    sources: string[]
    timestamp: number
  }
}

export interface ShareableMetadata {
  author: string
  authorId?: string
  tags: string[]
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  language: string
  version: string
  platform: string
  checksum: string
}

export interface AnalysisSnapshot {
  id: string
  name: string
  description: string
  timestamp: number
  data: {
    symbol: string
    price: number
    indicators: Record<string, number>
    signals: Array<{
      type: string
      confidence: number
      timestamp: number
    }>
    analysis: {
      bullish: number
      bearish: number
      risk: string
      recommendation: string
      confidence: number
    }
  }
  settings: {
    timeframe: string
    indicators: string[]
    analysisMode: string
  }
}

export interface ShareableReport {
  id: string
  title: string
  type: 'summary' | 'detailed' | 'comparison'
  sections: ReportSection[]
  generatedAt: number
  format: 'html' | 'pdf' | 'json'
  data: any
}

export interface ReportSection {
  id: string
  title: string
  type: 'text' | 'chart' | 'table' | 'metrics'
  content: any
  order: number
}

export class ShareableAnalysisManager {
  private static instance: ShareableAnalysisManager
  private sharedAnalyses: ShareableAnalysis[] = []
  private snapshots: AnalysisSnapshot[] = []
  private reports: ShareableReport[] = []

  private constructor() {
    this.loadSharedData()
  }

  static getInstance(): ShareableAnalysisManager {
    if (!ShareableAnalysisManager.instance) {
      ShareableAnalysisManager.instance = new ShareableAnalysisManager()
    }
    return ShareableAnalysisManager.instance
  }

  // Share current analysis
  shareAnalysis(
    type: ShareableAnalysis['type'],
    title: string,
    description: string,
    content: ShareableContent,
    options?: {
      isPublic?: boolean
      expiresIn?: number // days
      tags?: string[]
    }
  ): ShareableAnalysis {
    const analysis: ShareableAnalysis = {
      id: this.generateId(),
      type,
      title,
      description,
      content,
      metadata: {
        author: this.getCurrentUser(),
        tags: options?.tags || [],
        category: this.getCategoryFromType(type),
        difficulty: 'intermediate',
        language: 'en',
        version: '1.0.0',
        platform: 'CryptoSignals AI',
        checksum: this.calculateChecksum(content)
      },
      createdAt: Date.now(),
      expiresAt: options?.expiresIn ? Date.now() + (options.expiresIn * 24 * 60 * 60 * 1000) : undefined,
      isPublic: options?.isPublic || false,
      shareCode: this.generateShareCode(),
      viewCount: 0,
      downloadCount: 0
    }

    this.sharedAnalyses.push(analysis)
    this.saveSharedData()
    
    return analysis
  }

  // Create analysis snapshot
  createSnapshot(
    name: string,
    description: string,
    data: AnalysisSnapshot['data'],
    settings: AnalysisSnapshot['settings']
  ): AnalysisSnapshot {
    const snapshot: AnalysisSnapshot = {
      id: this.generateId(),
      name,
      description,
      timestamp: Date.now(),
      data,
      settings
    }

    this.snapshots.push(snapshot)
    this.saveSnapshots()
    
    return snapshot
  }

  // Generate shareable report
  generateReport(
    title: string,
    type: ShareableReport['type'],
    data: any,
    options?: {
      format?: ShareableReport['format']
      includeCharts?: boolean
      includeMetrics?: boolean
    }
  ): ShareableReport {
    const sections = this.generateReportSections(data, type, options)
    
    const report: ShareableReport = {
      id: this.generateId(),
      title,
      type,
      sections,
      generatedAt: Date.now(),
      format: options?.format || 'html',
      data
    }

    this.reports.push(report)
    this.saveReports()
    
    return report
  }

  // Compare analyses
  compareAnalyses(analysisIds: string[]): {
    comparison: Array<{
      analysis: ShareableAnalysis
      score: number
      rank: number
    }>
    summary: {
      bestAnalysis: string
      averageScore: number
      commonTags: string[]
    }
  } {
    const analyses = analysisIds.map(id => 
      this.sharedAnalyses.find(a => a.id === id)
    ).filter((a): a is ShareableAnalysis => a !== undefined)

    const comparison = analyses.map(analysis => ({
      analysis,
      score: this.calculateAnalysisScore(analysis),
      rank: 0
    })).sort((a, b) => b.score - a.score).map((item, index) => ({
      ...item,
      rank: index + 1
    }))

    const allTags = analyses.flatMap(a => a.metadata.tags)
    const commonTags = allTags.filter((tag, index) => 
      allTags.indexOf(tag) === index && allTags.filter(t => t === tag).length > 1
    )

    return {
      comparison,
      summary: {
        bestAnalysis: comparison[0]?.analysis.title || 'None',
        averageScore: comparison.reduce((sum, c) => sum + c.score, 0) / comparison.length,
        commonTags
      }
    }
  }

  // Export analysis
  exportAnalysis(
    analysisId: string,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): string {
    const analysis = this.sharedAnalyses.find(a => a.id === analysisId)
    if (!analysis) {
      throw new Error('Analysis not found')
    }

    switch (format) {
      case 'json':
        return JSON.stringify(analysis, null, 2)
      
      case 'csv':
        return this.convertToCSV(analysis)
      
      case 'pdf':
        return this.convertToPDF(analysis)
      
      default:
        throw new Error('Unsupported format')
    }
  }

  // Generate insight card
  generateInsightCard(
    title: string,
    insight: string,
    category: string,
    confidence: number,
    data?: any
  ): ShareableAnalysis {
    const content: ShareableContent = {
      insight: {
        title,
        content: insight,
        category,
        confidence,
        sources: ['AI Analysis', 'Technical Indicators'],
        timestamp: Date.now()
      }
    }

    return this.shareAnalysis('insight', title, insight, content, {
      tags: [category, 'ai-insight'],
      isPublic: true
    })
  }

  // Get shareable link
  getShareableLink(analysisId: string): string {
    const analysis = this.sharedAnalyses.find(a => a.id === analysisId)
    if (!analysis) {
      throw new Error('Analysis not found')
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cryptosignals.ai'
    return `${baseUrl}/shared/${analysis.shareCode}`
  }

  // Get QR code data
  getQRCodeData(analysisId: string): string {
    const link = this.getShareableLink(analysisId)
    return link
  }

  // Social media sharing
  shareToSocial(analysisId: string, platform: 'twitter' | 'linkedin' | 'reddit' | 'telegram'): void {
    const analysis = this.sharedAnalyses.find(a => a.id === analysisId)
    if (!analysis) return

    const link = this.getShareableLink(analysisId)
    const text = `Check out this crypto analysis: ${analysis.title}`

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}&summary=${encodeURIComponent(text)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(link)}&title=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`
    }

    if (typeof window !== 'undefined') {
      window.open(urls[platform], '_blank', 'width=600,height=400')
    }
  }

  // Private methods
  private generateReportSections(data: any, type: ShareableReport['type'], options?: any): ReportSection[] {
    const sections: ReportSection[] = []

    if (type === 'summary') {
      sections.push({
        id: 'overview',
        title: 'Overview',
        type: 'text',
        content: this.generateOverviewText(data),
        order: 1
      })
      
      if (options?.includeMetrics) {
        sections.push({
          id: 'metrics',
          title: 'Key Metrics',
          type: 'metrics',
          content: data.metrics || {},
          order: 2
        })
      }
    } else if (type === 'detailed') {
      sections.push({
        id: 'analysis',
        title: 'Detailed Analysis',
        type: 'text',
        content: data.analysis || {},
        order: 1
      })
      
      if (options?.includeCharts) {
        sections.push({
          id: 'charts',
          title: 'Charts',
          type: 'chart',
          content: data.charts || [],
          order: 2
        })
      }
      
      sections.push({
        id: 'recommendations',
        title: 'Recommendations',
        type: 'text',
        content: data.recommendations || [],
        order: 3
      })
    } else if (type === 'comparison') {
      sections.push({
        id: 'comparison',
        title: 'Strategy Comparison',
        type: 'table',
        content: data.comparison || [],
        order: 1
      })
    }

    return sections
  }

  private generateOverviewText(data: any): string {
    return `
# Analysis Overview

This analysis was generated on ${new Date().toLocaleDateString()} using advanced AI algorithms and technical indicators.

## Summary
${data.summary || 'No summary available'}

## Key Findings
${data.keyFindings || 'No key findings available'}

## Recommendation
${data.recommendation || 'No recommendation available'}

---
*This analysis is for informational purposes only and should not be considered financial advice.*
    `.trim()
  }

  private convertToCSV(analysis: ShareableAnalysis): string {
    const headers = ['ID', 'Title', 'Type', 'Created', 'Author', 'Tags', 'Public']
    const row = [
      analysis.id,
      analysis.title,
      analysis.type,
      new Date(analysis.createdAt).toISOString(),
      analysis.metadata.author,
      analysis.metadata.tags.join(';'),
      analysis.isPublic
    ]

    return [headers.join(','), row.join(',')].join('\n')
  }

  private convertToPDF(analysis: ShareableAnalysis): string {
    // Simplified PDF generation (would need real PDF library)
    return `
PDF Content for ${analysis.title}

${analysis.description}

Generated by: ${analysis.metadata.author}
Created: ${new Date(analysis.createdAt).toLocaleDateString()}
    `.trim()
  }

  private calculateAnalysisScore(analysis: ShareableAnalysis): number {
    let score = 0
    
    // Score based on completeness
    if (analysis.content.analysis) score += 20
    if (analysis.content.strategy) score += 30
    if (analysis.content.workspace) score += 25
    if (analysis.content.insight) score += 15
    
    // Score based on metadata
    score += analysis.metadata.tags.length * 2
    score += analysis.viewCount * 0.1
    score += analysis.downloadCount * 0.2
    
    // Score based on recency
    const daysOld = (Date.now() - analysis.createdAt) / (24 * 60 * 60 * 1000)
    if (daysOld < 7) score += 10
    else if (daysOld < 30) score += 5
    
    return Math.round(score)
  }

  private getCategoryFromType(type: ShareableAnalysis['type']): string {
    const categories = {
      analysis: 'technical-analysis',
      strategy: 'trading-strategy',
      workspace: 'trading-workspace',
      insight: 'market-insight'
    }
    return categories[type] || 'general'
  }

  private calculateChecksum(content: ShareableContent): string {
    // Simple checksum (would use real hashing in production)
    return btoa(JSON.stringify(content)).slice(0, 16)
  }

  private generateShareCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  private getCurrentUser(): string {
    const profile = userProfileManager.getProfile()
    return profile?.username || 'Anonymous Trader'
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Data persistence
  private saveSharedData(): void {
    try {
      localStorage.setItem('crypto-signals-shared-analyses', JSON.stringify(this.sharedAnalyses))
    } catch (error) {
      console.error('Failed to save shared analyses:', error)
    }
  }

  private saveSnapshots(): void {
    try {
      if (typeof window === 'undefined') return
      localStorage.setItem('crypto-signals-snapshots', JSON.stringify(this.snapshots))
    } catch (error) {
      console.error('Failed to save snapshots:', error)
    }
  }

  private saveReports(): void {
    try {
      if (typeof window === 'undefined') return
      localStorage.setItem('crypto-signals-reports', JSON.stringify(this.reports))
    } catch (error) {
      console.error('Failed to save reports:', error)
    }
  }

  private loadSharedData(): void {
    try {
      if (typeof window === 'undefined') return
      const shared = localStorage.getItem('crypto-signals-shared-analyses')
      if (shared) {
        this.sharedAnalyses = JSON.parse(shared)
      }

      const snapshots = localStorage.getItem('crypto-signals-snapshots')
      if (snapshots) {
        this.snapshots = JSON.parse(snapshots)
      }

      const reports = localStorage.getItem('crypto-signals-reports')
      if (reports) {
        this.reports = JSON.parse(reports)
      }
    } catch (error) {
      console.error('Failed to load shared data:', error)
    }
  }

  // Public methods for data access
  getSharedAnalyses(): ShareableAnalysis[] {
    return this.sharedAnalyses
  }

  getSnapshots(): AnalysisSnapshot[] {
    return this.snapshots
  }

  getReports(): ShareableReport[] {
    return this.reports
  }

  getAnalysis(id: string): ShareableAnalysis | undefined {
    return this.sharedAnalyses.find(a => a.id === id)
  }

  getSnapshot(id: string): AnalysisSnapshot | undefined {
    return this.snapshots.find(s => s.id === id)
  }

  getReport(id: string): ShareableReport | undefined {
    return this.reports.find(r => r.id === id)
  }

  deleteSharedAnalysis(id: string): void {
    this.sharedAnalyses = this.sharedAnalyses.filter(a => a.id !== id)
    this.saveSharedData()
  }

  deleteSnapshot(id: string): void {
    this.snapshots = this.snapshots.filter(s => s.id !== id)
    this.saveSnapshots()
  }

  deleteReport(id: string): void {
    this.reports = this.reports.filter(r => r.id !== id)
    this.saveReports()
  }

  // Analytics
  getAnalytics(): {
    totalShared: number
    totalViews: number
    totalDownloads: number
    topCategories: Array<{ category: string; count: number }>
    recentActivity: Array<{
      type: string
      timestamp: number
      title: string
    }>
  } {
    const categories = this.sharedAnalyses.reduce((acc, analysis) => {
      const category = this.getCategoryFromType(analysis.type)
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topCategories = Object.entries(categories)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const recentActivity = this.sharedAnalyses
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map(analysis => ({
        type: analysis.type,
        timestamp: analysis.createdAt,
        title: analysis.title
      }))

    return {
      totalShared: this.sharedAnalyses.length,
      totalViews: this.sharedAnalyses.reduce((sum, a) => sum + a.viewCount, 0),
      totalDownloads: this.sharedAnalyses.reduce((sum, a) => sum + a.downloadCount, 0),
      topCategories,
      recentActivity
    }
  }
}

// Global instance
export const shareableAnalysisManager = ShareableAnalysisManager.getInstance()
