import { MiddlewareHandler } from 'hono';
import { ApiError } from '../utils/error';

// Simple in-memory rate limiter
// In production, use Redis or another external store for distributed setups
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipLimiter = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests in the time window
  message?: string; // Custom error message
}

// Default options
const defaultOptions: RateLimitOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later.'
};

export const rateLimit = (options: Partial<RateLimitOptions> = {}): MiddlewareHandler => {
  const opts = { ...defaultOptions, ...options };
  
  return async (c, next) => {
    // Get client IP
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    
    // Get current timestamp
    const now = Date.now();
    
    // Get or create record for this IP
    let record = ipLimiter.get(ip);
    
    if (!record || record.resetAt <= now) {
      // Create new record if none exists or if the window has passed
      record = {
        count: 0,
        resetAt: now + opts.windowMs
      };
    }
    
    // Increment request count
    record.count += 1;
    
    // Update record in the store
    ipLimiter.set(ip, record);
    
    // Set rate limit headers
    c.header('X-RateLimit-Limit', opts.max.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, opts.max - record.count).toString());
    c.header('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000).toString());
    
    // Check if rate limit is exceeded
    if (record.count > opts.max) {
      c.header('Retry-After', Math.ceil((record.resetAt - now) / 1000).toString());
      throw ApiError.forbidden(opts.message);
    }
    
    await next();
  };
};

// Clean up expired records periodically
setInterval(() => {
  const now = Date.now();
  
  for (const [ip, record] of ipLimiter.entries()) {
    if (record.resetAt <= now) {
      ipLimiter.delete(ip);
    }
  }
}, 60 * 1000); // Clean up every minute