'use client'

export interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  timestamp: number
  url: string
  sentiment: 'positive' | 'negative' | 'neutral'
  sentimentScore: number
  impact: 'high' | 'medium' | 'low'
  relatedCoins: string[]
  category: 'market' | 'regulation' | 'technology' | 'adoption' | 'security'
}

export interface SentimentAnalysis {
  overall: 'bullish' | 'bearish' | 'neutral'
  score: number
  positiveCount: number
  negativeCount: number
  neutralCount: number
  timeframe: string
  summary: string
}

export interface MarketMovingEvent {
  id: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category: 'regulation' | 'partnership' | 'listing' | 'hack' | 'adoption'
  affectedCoins: string[]
  timestamp: number
  expectedImpact: string
}

export interface NewsSentimentData {
  news: NewsItem[]
  sentiment: SentimentAnalysis
  marketMovingEvents: MarketMovingEvent[]
  lastUpdated: number
}

export class NewsSentimentEngine {
  private data: NewsSentimentData = this.generateInitialData()
  private callbacks: Set<() => void> = new Set()
  private interval: NodeJS.Timeout | null = null

  constructor() {
    this.data = this.generateInitialData()
  }

  // Subscribe to news updates
  subscribe(callback: () => void) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  // Start live news updates
  start() {
    if (this.interval) return

    this.interval = setInterval(() => {
      this.updateData()
      this.notifySubscribers()
    }, 8000) // Update every 8 seconds
  }

  // Stop news updates
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  // Get current news and sentiment data
  getData() {
    return this.data
  }

  // Generate initial news and sentiment data
  private generateInitialData(): NewsSentimentData {
    const news: NewsItem[] = [
      {
        id: '1',
        title: 'Bitcoin ETF Inflows Reach Record High',
        summary: 'Institutional investors continue to pour money into Bitcoin ETFs, with daily inflows exceeding $500 million.',
        source: 'Reuters',
        timestamp: Date.now() - 3600000,
        url: '#',
        sentiment: 'positive',
        sentimentScore: 0.85,
        impact: 'high',
        relatedCoins: ['BTC', 'ETH'],
        category: 'market'
      },
      {
        id: '2',
        title: 'Major Bank Announces Crypto Custody Service',
        summary: 'One of the largest global banks has launched a fully regulated cryptocurrency custody service for institutional clients.',
        source: 'Bloomberg',
        timestamp: Date.now() - 7200000,
        url: '#',
        sentiment: 'positive',
        sentimentScore: 0.78,
        impact: 'high',
        relatedCoins: ['BTC', 'ETH', 'SOL'],
        category: 'adoption'
      },
      {
        id: '3',
        title: 'SEC Delays Decision on Ethereum ETF',
        summary: 'The Securities and Exchange Commission has postponed its decision on spot Ethereum ETF applications, citing need for more review.',
        source: 'CNBC',
        timestamp: Date.now() - 10800000,
        url: '#',
        sentiment: 'negative',
        sentimentScore: -0.65,
        impact: 'medium',
        relatedCoins: ['ETH'],
        category: 'regulation'
      },
      {
        id: '4',
        title: 'DeFi Protocol Reaches $10B Total Value Locked',
        summary: 'A leading decentralized finance protocol has achieved a milestone of $10 billion in total value locked, showing strong ecosystem growth.',
        source: 'The Block',
        timestamp: Date.now() - 14400000,
        url: '#',
        sentiment: 'positive',
        sentimentScore: 0.72,
        impact: 'medium',
        relatedCoins: ['ETH', 'UNI', 'AAVE'],
        category: 'technology'
      },
      {
        id: '5',
        title: 'Crypto Exchange Faces Regulatory Scrutiny',
        summary: 'Regulators are investigating trading practices at a major cryptocurrency exchange over potential market manipulation concerns.',
        source: 'Financial Times',
        timestamp: Date.now() - 18000000,
        url: '#',
        sentiment: 'negative',
        sentimentScore: -0.58,
        impact: 'medium',
        relatedCoins: ['BTC', 'ETH'],
        category: 'regulation'
      }
    ]

    const marketMovingEvents: MarketMovingEvent[] = [
      {
        id: '1',
        title: 'Bitcoin ETF Approval',
        description: 'SEC approves first spot Bitcoin ETFs in the United States',
        impact: 'high',
        category: 'regulation',
        affectedCoins: ['BTC'],
        timestamp: Date.now() - 86400000,
        expectedImpact: 'Significant price increase and institutional adoption'
      },
      {
        id: '2',
        title: 'Ethereum Merge Success',
        description: 'Ethereum successfully completes transition to proof-of-stake',
        impact: 'high',
        category: 'partnership',
        affectedCoins: ['ETH'],
        timestamp: Date.now() - 172800000,
        expectedImpact: 'Reduced energy consumption and potential staking rewards'
      }
    ]

    return {
      news,
      sentiment: this.calculateSentiment(news),
      marketMovingEvents,
      lastUpdated: Date.now()
    }
  }

  // Calculate sentiment analysis from news
  private calculateSentiment(news: NewsItem[]): SentimentAnalysis {
    const positiveCount = news.filter(item => item.sentiment === 'positive').length
    const negativeCount = news.filter(item => item.sentiment === 'negative').length
    const neutralCount = news.filter(item => item.sentiment === 'neutral').length
    
    const totalScore = news.reduce((sum, item) => sum + item.sentimentScore, 0)
    const averageScore = totalScore / news.length
    
    let overall: 'bullish' | 'bearish' | 'neutral'
    if (averageScore > 0.2) overall = 'bullish'
    else if (averageScore < -0.2) overall = 'bearish'
    else overall = 'neutral'

    return {
      overall,
      score: Math.round(averageScore * 100),
      positiveCount,
      negativeCount,
      neutralCount,
      timeframe: '24h',
      summary: this.generateSentimentSummary(overall, positiveCount, negativeCount, neutralCount)
    }
  }

  private generateSentimentSummary(overall: string, positive: number, negative: number, neutral: number): string {
    if (overall === 'bullish') {
      return `Market sentiment is bullish with ${positive} positive news items outweighing ${negative} negative ones. Investors are showing increased confidence.`
    } else if (overall === 'bearish') {
      return `Market sentiment is bearish with ${negative} negative news items impacting market outlook. Caution is advised.`
    }
    return `Market sentiment is neutral with mixed signals. ${neutral} neutral news items suggest uncertainty in market direction.`
  }

  // Update news and sentiment data
  private updateData() {
    // Simulate new news items
    const newNewsItem: NewsItem = {
      id: Date.now().toString(),
      title: this.generateNewsTitle(),
      summary: this.generateNewsSummary(),
      source: this.generateSource(),
      timestamp: Date.now(),
      url: '#',
      sentiment: this.generateSentiment(),
      sentimentScore: this.generateSentimentScore(),
      impact: this.generateImpact(),
      relatedCoins: this.generateRelatedCoins(),
      category: this.generateCategory()
    }

    // Update news (keep latest 10 items)
    const updatedNews = [newNewsItem, ...this.data.news.slice(0, 9)]

    // Update sentiment analysis
    const updatedSentiment = this.calculateSentiment(updatedNews)

    this.data = {
      ...this.data,
      news: updatedNews,
      sentiment: updatedSentiment,
      lastUpdated: Date.now()
    }
  }

  private generateNewsTitle(): string {
    const titles = [
      'Crypto Trading Volume Surges 40% Weekly',
      'Central Bank Digital Currency Pilot Launches',
      'Major Retailer Accepts Bitcoin Payments',
      'Blockchain Startup Secures $100M Funding',
      'DeFi Protocol Introduces New Yield Farming Feature',
      'NFT Market Shows Signs of Recovery',
      'Lightning Network Capacity Doubles',
      'Crypto Mining Difficulty Reaches New High'
    ]
    return titles[Math.floor(Math.random() * titles.length)]
  }

  private generateNewsSummary(): string {
    const summaries = [
      'Recent developments in the cryptocurrency space have caught investors\' attention, with significant implications for market dynamics.',
      'Industry experts are closely monitoring emerging trends that could reshape the digital asset landscape in the coming months.',
      'Market participants are reacting to latest announcements with renewed interest in blockchain technology applications.',
      'Technical analysis suggests potential breakout patterns forming across major cryptocurrency pairs.',
      'Regulatory developments continue to shape the cryptocurrency ecosystem with new guidelines and frameworks.'
    ]
    return summaries[Math.floor(Math.random() * summaries.length)]
  }

  private generateSource(): string {
    const sources = ['Reuters', 'Bloomberg', 'CNBC', 'CoinDesk', 'The Block', 'Financial Times', 'WSJ']
    return sources[Math.floor(Math.random() * sources.length)]
  }

  private generateSentiment(): 'positive' | 'negative' | 'neutral' {
    const rand = Math.random()
    if (rand > 0.6) return 'positive'
    if (rand < 0.3) return 'negative'
    return 'neutral'
  }

  private generateSentimentScore(): number {
    const sentiment = this.generateSentiment()
    if (sentiment === 'positive') return 0.3 + Math.random() * 0.6
    if (sentiment === 'negative') return -0.3 - Math.random() * 0.6
    return (Math.random() - 0.5) * 0.3
  }

  private generateImpact(): 'high' | 'medium' | 'low' {
    const rand = Math.random()
    if (rand > 0.7) return 'high'
    if (rand > 0.3) return 'medium'
    return 'low'
  }

  private generateRelatedCoins(): string[] {
    const coins = ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC']
    const count = Math.floor(Math.random() * 3) + 1
    return coins.slice(0, count)
  }

  private generateCategory(): 'market' | 'regulation' | 'technology' | 'adoption' | 'security' {
    const categories = ['market', 'regulation', 'technology', 'adoption', 'security']
    return categories[Math.floor(Math.random() * categories.length)] as any
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.callbacks.forEach(callback => callback())
  }
}

// Global instance
export const newsSentimentEngine = new NewsSentimentEngine()
