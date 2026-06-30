// Simple in-memory rate limiter
// For production, use Redis-based rate limiting

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string;
}

const DEFAULT_CONFIG: Required<Omit<RateLimitConfig, "keyGenerator">> = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
};

export function rateLimit(config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }) {
  const windowMs = config.windowMs || 60000;
  const maxRequests = config.maxRequests || 100;
  const keyGenerator = config.keyGenerator || ((req: Request) => {
    // Use IP address as key
    const forwarded = req.headers.get("x-forwarded-for");
    return forwarded ? forwarded.split(",")[0] : "unknown";
  });

  return async (req: Request): Promise<{ success: boolean; remaining: number; resetAt: number }> => {
    const key = keyGenerator(req);
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    // Reset if window expired
    if (!entry || now > entry.resetAt) {
      entry = {
        count: 0,
        resetAt: now + windowMs,
      };
    }

    entry.count++;
    rateLimitStore.set(key, entry);

    const remaining = Math.max(0, maxRequests - entry.count);
    const success = entry.count <= maxRequests;

    // Clean up expired entries periodically
    if (rateLimitStore.size > 10000) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (now > v.resetAt) {
          rateLimitStore.delete(k);
        }
      }
    }

    return { success, remaining, resetAt: entry.resetAt };
  };
}

// Middleware for API routes
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
) {
  const limiter = rateLimit(config);

  return async (req: Request): Promise<Response> => {
    const { success, remaining, resetAt } = await limiter(req);

    const headers = {
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
    };

    if (!success) {
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            ...headers,
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    const response = await handler(req);
    return response;
  };
}

// Specific rate limiters for different endpoints
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 10, // 10 requests per minute for sensitive operations
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 100, // 100 requests per minute
});

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 20, // 20 uploads per minute
});
