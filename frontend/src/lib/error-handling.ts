'use client'

export interface ErrorContext {
  type: 'network' | 'api' | 'websocket' | 'validation' | 'timeout' | 'unknown'
  message: string
  code?: string
  timestamp: number
  retryable: boolean
  fallbackData?: any
}

export interface ErrorReporting {
  error: ErrorContext
  context: {
    url?: string
    method?: string
    status?: number
    userAgent: string
    timestamp: number
  }
}

export class ErrorHandler {
  private errors: ErrorContext[] = []
  private maxErrors = 100
  private retryAttempts = new Map<string, number>()
  private maxRetries = 3

  // Handle API errors
  handleApiError(error: any, context?: { url?: string, method?: string }): ErrorContext {
    const errorContext: ErrorContext = {
      type: this.getErrorType(error),
      message: this.getErrorMessage(error),
      code: error.code || error.status?.toString(),
      timestamp: Date.now(),
      retryable: this.isRetryable(error),
      fallbackData: error.fallbackData
    }

    this.logError(errorContext, context)
    return errorContext
  }

  // Handle WebSocket errors
  handleWebSocketError(error: any, context?: { url?: string }): ErrorContext {
    const errorContext: ErrorContext = {
      type: 'websocket',
      message: this.getWebSocketErrorMessage(error),
      code: error.code?.toString(),
      timestamp: Date.now(),
      retryable: true
    }

    this.logError(errorContext, context)
    return errorContext
  }

  // Handle network errors
  handleNetworkError(error: any, context?: { url?: string }): ErrorContext {
    const errorContext: ErrorContext = {
      type: 'network',
      message: this.getNetworkErrorMessage(error),
      code: error.code?.toString(),
      timestamp: Date.now(),
      retryable: this.isNetworkRetryable(error)
    }

    this.logError(errorContext, context)
    return errorContext
  }

  // Get user-friendly error message
  getErrorMessage(error: any): string {
    if (typeof error === 'string') return error
    
    if (error?.message) {
      // Common API error messages
      const commonErrors: Record<string, string> = {
        'Network request failed': 'Unable to connect to the server. Please check your internet connection.',
        'Request timeout': 'The request took too long to complete. Please try again.',
        'Unauthorized': 'You need to log in to access this feature.',
        'Forbidden': 'You don\'t have permission to access this resource.',
        'Not Found': 'The requested resource was not found.',
        'Internal Server Error': 'Something went wrong on our end. Please try again later.',
        'Service Unavailable': 'Our services are temporarily unavailable. Please try again later.',
        'Rate Limit Exceeded': 'Too many requests. Please wait a moment before trying again.',
        'Invalid API Key': 'Invalid API credentials. Please check your configuration.',
        'Insufficient Balance': 'Insufficient balance to complete this operation.',
        'Invalid Order': 'Invalid order parameters. Please check your inputs.',
        'Market Closed': 'Market is currently closed for trading.',
        'Maintenance': 'System is under maintenance. Please try again later.'
      }

      return commonErrors[error.message] || error.message
    }

    // Default error messages based on error type
    if (error?.name === 'TypeError') {
      return 'Invalid data format received. Please try again.'
    }

    if (error?.name === 'NetworkError') {
      return 'Network connection failed. Please check your internet connection.'
    }

    return 'An unexpected error occurred. Please try again.'
  }

  // Get WebSocket error message
  getWebSocketErrorMessage(error: any): string {
    if (error?.code === 1006) {
      return 'Connection lost. Reconnecting...'
    }
    
    if (error?.code === 1000) {
      return 'Connection closed normally.'
    }

    if (error?.message) {
      return error.message
    }

    return 'WebSocket connection error. Attempting to reconnect...'
  }

  // Get network error message
  getNetworkErrorMessage(error: any): string {
    if (error?.code === 'NETWORK_ERROR') {
      return 'Network connection failed. Please check your internet connection.'
    }

    if (error?.code === 'TIMEOUT') {
      return 'Request timed out. Please try again.'
    }

    if (error?.code === 'OFFLINE') {
      return 'You appear to be offline. Please check your internet connection.'
    }

    return 'Network error occurred. Please try again.'
  }

  // Determine error type
  private getErrorType(error: any): ErrorContext['type'] {
    if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
      return 'network'
    }

    if (error?.name === 'TimeoutError' || error?.code === 'TIMEOUT') {
      return 'timeout'
    }

    if (error?.status || error?.response) {
      return 'api'
    }

    if (error?.validation) {
      return 'validation'
    }

    return 'unknown'
  }

  // Check if error is retryable
  private isRetryable(error: any): boolean {
    const retryableCodes = [408, 429, 500, 502, 503, 504]
    const retryableErrors = ['NetworkError', 'TimeoutError', 'NETWORK_ERROR', 'TIMEOUT']
    
    return (
      retryableCodes.includes(error?.status) ||
      retryableErrors.includes(error?.name) ||
      retryableErrors.includes(error?.code)
    )
  }

  // Check if network error is retryable
  private isNetworkRetryable(error: any): boolean {
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'OFFLINE']
    return retryableCodes.includes(error?.code)
  }

  // Log error for debugging
  private logError(error: ErrorContext, context?: { url?: string, method?: string }) {
    const errorReporting: ErrorReporting = {
      error,
      context: {
        url: context?.url,
        method: context?.method,
        status: error.code ? parseInt(error.code) : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        timestamp: Date.now()
      }
    }

    // Add to error history
    this.errors.push(error)
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorReporting)
    }

    // In production, you would send this to error tracking service
    // this.sendToErrorTracking(errorReporting)
  }

  // Get retry attempt count
  getRetryAttempts(key: string): number {
    return this.retryAttempts.get(key) || 0
  }

  // Increment retry attempts
  incrementRetryAttempts(key: string): number {
    const attempts = this.getRetryAttempts(key) + 1
    this.retryAttempts.set(key, attempts)
    return attempts
  }

  // Reset retry attempts
  resetRetryAttempts(key: string): void {
    this.retryAttempts.delete(key)
  }

  // Check if should retry
  shouldRetry(key: string): boolean {
    return this.getRetryAttempts(key) < this.maxRetries
  }

  // Get recent errors
  getRecentErrors(limit: number = 10): ErrorContext[] {
    return this.errors.slice(-limit)
  }

  // Clear error history
  clearErrors(): void {
    this.errors = []
    this.retryAttempts.clear()
  }

  // Get error statistics
  getErrorStats(): {
    total: number
    byType: Record<string, number>
    recent: ErrorContext[]
  } {
    const byType: Record<string, number> = {}
    
    this.errors.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1
    })

    return {
      total: this.errors.length,
      byType,
      recent: this.getRecentErrors(5)
    }
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler()


// Retry wrapper for API calls
export async function withRetry<T>(
  key: string,
  fn: () => Promise<T>,
  options?: { maxRetries?: number; delay?: number }
): Promise<T> {
  const maxRetries = options?.maxRetries || 3
  const delay = options?.delay || 1000

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn()
      errorHandler.resetRetryAttempts(key)
      return result
    } catch (error) {
      const errorContext = errorHandler.handleApiError(error)
      
      if (attempt === maxRetries || !errorContext.retryable) {
        throw error
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)))
    }
  }

  throw new Error('Max retries exceeded')
}

// Fallback data provider
export function getFallbackData(type: string): any {
  const fallbackData: Record<string, any> = {
    'market-data': {
      coins: [
        { id: '1', symbol: 'BTC', name: 'Bitcoin', price: 43250, change: 2.5 },
        { id: '2', symbol: 'ETH', name: 'Ethereum', price: 2280, change: 1.8 },
        { id: '3', symbol: 'SOL', name: 'Solana', price: 98.45, change: -0.5 }
      ]
    },
    'signals': [],
    'portfolio': { balance: 10000, positions: [] },
    'alerts': [],
    'opportunities': []
  }

  return fallbackData[type] || null
}
