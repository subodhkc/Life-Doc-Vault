import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  maxRequests: number // Max requests per interval
}

interface RateLimitStore {
  count: number
  resetTime: number
}

// In-memory store (use Redis/Upstash in production for multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitStore>()

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  /**
   * Check if request should be rate limited
   * Returns null if allowed, or NextResponse with 429 if rate limited
   */
  async check(request: NextRequest, identifier: string): Promise<NextResponse | null> {
    const key = this.getKey(identifier)
    const now = Date.now()

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key)

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetTime: now + this.config.interval,
      }
      rateLimitStore.set(key, entry)

      return null // Allow request
    }

    // Increment count
    entry.count++

    // Check if over limit
    if (entry.count > this.config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)

      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': this.config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
          },
        }
      )
    }

    // Allow request, update count
    rateLimitStore.set(key, entry)

    return null // Allow request
  }

  private getKey(identifier: string): string {
    return `ratelimit:${identifier}`
  }

  /**
   * Get identifier from request (IP address or user ID)
   */
  static getIdentifier(request: NextRequest, userId?: string): string {
    if (userId) {
      return `user:${userId}`
    }

    // Get IP address from various headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0] || realIp || 'unknown'

    return `ip:${ip}`
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // Authentication endpoints: 5 requests per minute
  auth: new RateLimiter({
    interval: 60 * 1000, // 1 minute
    maxRequests: 5,
  }),

  // File uploads: 10 requests per minute
  upload: new RateLimiter({
    interval: 60 * 1000, // 1 minute
    maxRequests: 10,
  }),

  // General API: 60 requests per minute
  api: new RateLimiter({
    interval: 60 * 1000, // 1 minute
    maxRequests: 60,
  }),

  // Document processing: 5 requests per minute (CPU intensive)
  processing: new RateLimiter({
    interval: 60 * 1000, // 1 minute
    maxRequests: 5,
  }),
}

// Clean up expired entries periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 60 * 1000) // Clean every minute
}
