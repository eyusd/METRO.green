import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing required Upstash Redis environment variables')
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Rate limiter for image analysis API (more restrictive)
export const imageAnalysisRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
  analytics: true,
  prefix: 'metro_image_analysis',
})

function getClientIP(request: Request): string {
  // Priority order for IP detection in Netlify environment
  const headers = [
    'x-nf-client-connection-ip', // Netlify specific
    'cf-connecting-ip',          // Cloudflare
    'x-real-ip',                 // Nginx
    'x-forwarded-for'            // Standard proxy header
  ]
  
  for (const header of headers) {
    const value = request.headers.get(header)
    if (value) {
      return header === 'x-forwarded-for' 
        ? value.split(',')[0].trim() 
        : value
    }
  }
  
  return 'unknown'
}

export async function withRateLimit(
  request: Request,
  rateLimiter: Ratelimit = imageAnalysisRateLimit
): Promise<Response | null> {
  const ip = getClientIP(request)
  const identifier = ip
  
  try {
    const { success, limit, reset, remaining } = await rateLimiter.limit(identifier)
    
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000)
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      )
    }
    
    return null // Rate limit passed
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Fail open: if rate limiting service is down, allow the request
    return null
  }
}
