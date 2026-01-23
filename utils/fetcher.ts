/**
 * Lightweight fetch wrapper to replace axios
 * Reduces bundle size by ~13KB gzipped
 */

export class FetchError extends Error {
  status: number
  data: any

  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = 'FetchError'
    this.status = status
    this.data = data
  }
}

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  headers?: Record<string, string>
  params?: Record<string, any>
}

async function parseResponse(res: Response) {
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json()
  }
  return res.text()
}

export async function fetcher<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, params } = options

  // Build URL with query params
  let fullUrl = url
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      fullUrl += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  const fetchOptions: RequestInit = {
    method,
    credentials: 'include', // equivalent to axios.defaults.withCredentials = true
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body)
  }

  const res = await fetch(fullUrl, fetchOptions)
  const data = await parseResponse(res)

  if (!res.ok) {
    throw new FetchError(
      data?.message || data?.error || `Request failed with status ${res.status}`,
      res.status,
      data
    )
  }

  return data
}

// Convenience methods matching axios API style
export const api = {
  get: <T = any>(url: string, options?: { params?: Record<string, any>; headers?: Record<string, string> }) =>
    fetcher<T>(url, { method: 'GET', ...options }),

  post: <T = any>(url: string, body?: any, options?: { headers?: Record<string, string> }) =>
    fetcher<T>(url, { method: 'POST', body, ...options }),

  put: <T = any>(url: string, body?: any, options?: { headers?: Record<string, string> }) =>
    fetcher<T>(url, { method: 'PUT', body, ...options }),

  delete: <T = any>(url: string, options?: { headers?: Record<string, string> }) =>
    fetcher<T>(url, { method: 'DELETE', ...options }),

  patch: <T = any>(url: string, body?: any, options?: { headers?: Record<string, string> }) =>
    fetcher<T>(url, { method: 'PATCH', body, ...options }),
}

// Helper to check if error is a FetchError (replaces axios.isAxiosError)
export function isFetchError(error: any): error is FetchError {
  return error instanceof FetchError || error?.name === 'FetchError'
}
