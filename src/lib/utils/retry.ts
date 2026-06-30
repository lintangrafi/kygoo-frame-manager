// Auto-retry with exponential backoff

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: Error, delay: number) => void;
  shouldRetry?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  onRetry: () => {},
  shouldRetry: () => true,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt === opts.maxRetries) break;
      if (!opts.shouldRetry(lastError)) break;

      // Check if status is retryable
      const status = (lastError as any).status || (lastError as any).response?.status;
      if (status && !opts.retryableStatuses.includes(status)) break;

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );
      const jitter = delay * 0.1 * Math.random(); // 10% jitter
      const actualDelay = delay + jitter;

      opts.onRetry(attempt + 1, lastError, actualDelay);

      await sleep(actualDelay);
    }
  }

  throw lastError!;
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Hook for retry state
import { useState, useCallback } from "react";

interface UseRetryOptions extends RetryOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useRetry<T>(options: UseRetryOptions = {}) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  const execute = useCallback(
    async (fn: () => Promise<T>) => {
      setIsRetrying(true);
      setLastError(null);

      try {
        const result = await withRetry(fn, {
          ...options,
          onRetry: (attempt, error, delay) => {
            setRetryCount(attempt);
            options.onRetry?.(attempt, error, delay);
          },
        });
        options.onSuccess?.();
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setLastError(err);
        options.onError?.(err);
        throw err;
      } finally {
        setIsRetrying(false);
        setRetryCount(0);
      }
    },
    [options]
  );

  return {
    execute,
    isRetrying,
    retryCount,
    lastError,
  };
}

// API fetch with retry built-in
export async function fetchWithRetry(
  url: string,
  options: RequestInit & RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    retryableStatuses = [408, 429, 500, 502, 503, 504],
    ...fetchOptions
  } = options;

  let lastError: Error;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      lastResponse = response;

      if (response.ok) {
        return response;
      }

      if (!retryableStatuses.includes(response.status)) {
        return response;
      }

      if (attempt === maxRetries) {
        return response;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw lastError;
      }
    }

    if (attempt < maxRetries) {
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  // This should never be reached since we return inside the loop
  throw new Error("Request failed after retries");
}

// Generic async function wrapper with retry
export async function retryAsync<T>(
  asyncFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(asyncFn, options);
}
