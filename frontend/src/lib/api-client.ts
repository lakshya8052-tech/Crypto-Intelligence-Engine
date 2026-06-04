const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
const REQUEST_TIMEOUT_MS = 10000

export interface ApiResponse<T = any> {
  data?: T
  error?: boolean
  message?: string
  status_code?: number
}

class ApiClient {
  private baseUrl: string
  private rootUrl: string

  constructor(baseUrl: string = API_URL) {
    // Normalize the base URL to always end with a single `/api` segment.
    // Handles: undefined, empty string, '/api', full domain without /api,
    // and prevents duplicate '/api/api'.
    const normalize = (input: string | undefined): string => {
      let s = (input ?? '').trim()

      // If empty or only whitespace, use the relative API root
      if (!s) return '/api'

      // Remove trailing slashes
      while (s.endsWith('/')) s = s.slice(0, -1)

      // If the path already contains '/api', keep everything up to the first '/api'
      const idx = s.indexOf('/api')
      if (idx !== -1) {
        return s.slice(0, idx + 4) // include '/api'
      }

      // Otherwise append '/api'
      return s + '/api'
    }

    this.baseUrl = normalize(baseUrl)
    this.rootUrl = this.baseUrl.endsWith('/api') ? this.baseUrl.slice(0, -4) || '/' : this.baseUrl
  }

  private getErrorMessage(data: any): string {
    return data?.message || data?.detail || 'Request failed'
  }

  private async readJson(response: Response): Promise<any> {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  private async fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController()
    const timeout = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      })
    } finally {
      globalThis.clearTimeout(timeout)
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await this.readJson(response)

      if (!response.ok) {
        return {
          error: true,
          message: this.getErrorMessage(data),
          status_code: response.status,
        }
      }

      return { data }
    } catch (error) {
      return {
        error: true,
        message: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await this.readJson(response)

      if (!response.ok) {
        return {
          error: true,
          message: this.getErrorMessage(data),
          status_code: response.status,
        }
      }

      return { data }
    } catch (error) {
      return {
        error: true,
        message: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await this.readJson(response)

      if (!response.ok) {
        return {
          error: true,
          message: this.getErrorMessage(data),
          status_code: response.status,
        }
      }

      return { data }
    } catch (error) {
      return {
        error: true,
        message: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await this.readJson(response)

      if (!response.ok) {
        return {
          error: true,
          message: this.getErrorMessage(data),
          status_code: response.status,
        }
      }

      return { data }
    } catch (error) {
      return {
        error: true,
        message: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  // Health check endpoint
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    try {
      const response = await this.fetchWithTimeout(`${this.rootUrl === '/' ? '' : this.rootUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await this.readJson(response)

      if (!response.ok) {
        return {
          error: true,
          message: this.getErrorMessage(data),
          status_code: response.status,
        }
      }

      return { data }
    } catch (error) {
      return {
        error: true,
        message: error instanceof Error ? error.message : 'Network error',
      }
    }
  }
}

export const apiClient = new ApiClient()
