'use client'

import React from 'react'

export interface PerformanceMetrics {
  renderTime: number
  componentCount: number
  apiCalls: number
  memoryUsage: number
  cacheHitRate: number
  errorRate: number
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

export class PerformanceOptimizer {
  private cache = new Map<string, CacheEntry<any>>()
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    componentCount: 0,
    apiCalls: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    errorRate: 0
  }
  private observers: Set<() => void> = new Set()
  private apiCallCache = new Map<string, Promise<any>>()
  private renderStartTime = 0

  constructor() {
    this.initializePerformanceMonitoring()
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring() {
    if (typeof window !== 'undefined') {
      // Monitor render performance
      this.observeRenderPerformance()
      
      // Monitor memory usage
      this.observeMemoryUsage()
      
      // Monitor API calls
      this.observeApiCalls()
    }
  }

  // Observe render performance
  private observeRenderPerformance() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'measure') {
          this.metrics.renderTime = Math.max(this.metrics.renderTime, entry.duration)
        }
      })
    })

    try {
      observer.observe({ entryTypes: ['measure'] })
    } catch (error) {
      console.warn('Performance observer not supported:', error)
    }
  }

  // Observe memory usage
  private observeMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
      }, 5000)
    }
  }

  // Observe API calls
  private observeApiCalls() {
    const originalFetch = window.fetch
    let callCount = 0

    window.fetch = async (...args) => {
      callCount++
      this.metrics.apiCalls = callCount
      
      const startTime = performance.now()
      
      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()
        
        // Log slow API calls
        if (endTime - startTime > 1000) {
          console.warn(`Slow API call: ${endTime - startTime}ms`, args[0])
        }
        
        return response
      } catch (error) {
        this.metrics.errorRate = (this.metrics.errorRate + 1) / callCount
        throw error
      }
    }
  }

  // Cache management
  setCache<T>(key: string, data: T, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key
    })
  }

  getCache<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if cache is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern)
      const keys = Array.from(this.cache.keys())
      for (const key of keys) {
        if (regex.test(key)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }

  // Debounced API calls
  async debouncedApiCall<T>(
    key: string,
    apiCall: () => Promise<T>,
    debounceTime: number = 300
  ): Promise<T> {
    // Check if call is already in progress
    if (this.apiCallCache.has(key)) {
      return this.apiCallCache.get(key)
    }

    // Create debounced promise
    const promise = new Promise<T>((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await apiCall()
          this.apiCallCache.delete(key)
          resolve(result)
        } catch (error) {
          this.apiCallCache.delete(key)
          reject(error)
        }
      }, debounceTime)
    })

    this.apiCallCache.set(key, promise)
    return promise
  }

  // Throttled function
  throttle<T extends (...args: any[]) => any>(
    fn: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return function(this: any, ...args: Parameters<T>) {
      if (!inThrottle) {
        fn.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  // Memoized function
  memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>()
    
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
      
      if (cache.has(key)) {
        return cache.get(key)
      }
      
      const result = fn(...args)
      cache.set(key, result)
      return result
    }) as T
  }

  // Lazy load component
  lazyLoad<T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>
  ): React.LazyExoticComponent<T> {
    return React.lazy(() => {
      this.metrics.componentCount++
      return importFunc()
    })
  }

  // Virtual scrolling helper
  createVirtualList<T>(
    items: T[],
    itemHeight: number,
    containerHeight: number,
    renderItem: (item: T, index: number) => React.ReactNode
  ): {
    visibleItems: Array<{ item: T; index: number; top: number }>
    totalHeight: number
    scrollTop: number
    handleScroll: (scrollTop: number) => void
  } {
    let scrollTop = 0
    
    const calculateVisibleItems = (scrollTop: number) => {
      const startIndex = Math.floor(scrollTop / itemHeight)
      const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) + 1,
        items.length
      )
      
      const visibleItems = []
      for (let i = startIndex; i < endIndex; i++) {
        visibleItems.push({
          item: items[i],
          index: i,
          top: i * itemHeight
        })
      }
      
      return visibleItems
    }

    return {
      visibleItems: calculateVisibleItems(scrollTop),
      totalHeight: items.length * itemHeight,
      scrollTop,
      handleScroll: (newScrollTop: number) => {
        scrollTop = newScrollTop
      }
    }
  }

  // Image optimization
  optimizeImage(src: string, options?: { width?: number; height?: number; quality?: number }): string {
    const params = new URLSearchParams()
    
    if (options?.width) params.set('w', options.width.toString())
    if (options?.height) params.set('h', options.height.toString())
    if (options?.quality) params.set('q', options.quality.toString())
    
    const paramString = params.toString()
    return paramString ? `${src}?${paramString}` : src
  }

  // Bundle size monitoring
  getBundleSize(): Promise<{ size: number; gzipped: number }> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const entries = performance.getEntriesByType('navigation')
        if (entries.length > 0) {
          const nav = entries[0] as PerformanceNavigationTiming
          resolve({
            size: nav.transferSize || 0,
            gzipped: nav.encodedBodySize || 0
          })
        }
      }
      resolve({ size: 0, gzipped: 0 })
    })
  }

  // Get performance metrics
  getMetrics(): PerformanceMetrics {
    // Calculate cache hit rate
    const totalRequests = this.metrics.apiCalls
    const cacheHits = Array.from(this.cache.values()).filter(
      entry => Date.now() - entry.timestamp < entry.ttl
    ).length
    
    this.metrics.cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0

    return { ...this.metrics }
  }

  // Subscribe to performance updates
  subscribe(callback: () => void): () => void {
    this.observers.add(callback)
    return () => this.observers.delete(callback)
  }

  // Notify subscribers
  private notifySubscribers(): void {
    this.observers.forEach(callback => callback())
  }

  // Start render timing
  startRenderTiming(): void {
    this.renderStartTime = performance.now()
  }

  // End render timing
  endRenderTiming(): void {
    if (this.renderStartTime > 0) {
      const renderTime = performance.now() - this.renderStartTime
      this.metrics.renderTime = Math.max(this.metrics.renderTime, renderTime)
      this.renderStartTime = 0
      this.notifySubscribers()
    }
  }

  // Optimize for mobile
  optimizeForMobile(): void {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768
      
      if (isMobile) {
        // Reduce update frequency on mobile
        this.throttle(() => this.notifySubscribers(), 100)
        
        // Reduce cache size on mobile
        if (this.cache.size > 50) {
          const entries = Array.from(this.cache.entries())
          entries.slice(0, -25).forEach(([key]) => this.cache.delete(key))
        }
      }
    }
  }

  // Cleanup
  cleanup(): void {
    this.cache.clear()
    this.apiCallCache.clear()
    this.observers.clear()
  }
}

// Global performance optimizer instance
export const performanceOptimizer = new PerformanceOptimizer()

// Performance hook for React components
export function usePerformance(componentName: string) {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({
    renderTime: 0,
    componentCount: 0,
    apiCalls: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    errorRate: 0
  })

  React.useEffect(() => {
    const unsubscribe = performanceOptimizer.subscribe(() => {
      setMetrics(performanceOptimizer.getMetrics())
    })

    return unsubscribe
  }, [])

  React.useEffect(() => {
    performanceOptimizer.startRenderTiming()
    return () => {
      performanceOptimizer.endRenderTiming()
    }
  })

  return metrics
}

// Optimized API hook
export function useOptimizedApi<T>(
  key: string,
  apiCall: () => Promise<T>,
  options?: { cacheTime?: number; debounceTime?: number }
) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const cacheKey = `${key}-${JSON.stringify(options)}`
    
    // Check cache first
    const cachedData = performanceOptimizer.getCache<T>(cacheKey)
    if (cachedData) {
      setData(cachedData)
      return
    }

    setLoading(true)
    setError(null)

    performanceOptimizer
      .debouncedApiCall(cacheKey, apiCall, options?.debounceTime)
      .then((result) => {
        setData(result)
        performanceOptimizer.setCache(cacheKey, result, options?.cacheTime)
      })
      .catch((err) => {
        setError(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [key, JSON.stringify(options)])

  return { data, loading, error }
}

// Resource preloading
export function preloadResources(resources: string[]): Promise<void[]> {
  const promises = resources.map(resource => {
    if (resource.endsWith('.js') || resource.endsWith('.css')) {
      return preloadScript(resource)
    } else if (resource.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return preloadImage(resource)
    }
    return Promise.resolve()
  })

  return Promise.all(promises)
}

function preloadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'script'
    link.href = src
    link.onload = () => resolve()
    link.onerror = () => reject(new Error(`Failed to preload ${src}`))
    document.head.appendChild(link)
  })
}

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to preload ${src}`))
    img.src = src
  })
}
