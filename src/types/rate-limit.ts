// Rate limiting types
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  pending?: Promise<unknown>
}

export interface RateLimitError {
  success: false
  error: string
  retryAfter: number
  resetTime: string
}
