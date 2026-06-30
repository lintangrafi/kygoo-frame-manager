// Sentry Error Monitoring Configuration
// For production use, set NEXT_PUBLIC_SENTRY_DSN in environment variables

// This is a placeholder configuration
// To enable Sentry:
// 1. npm install @sentry/nextjs
// 2. Set NEXT_PUBLIC_SENTRY_DSN in .env.local
// 3. Configure sentry.config.ts

// Example sentry.config.ts would look like:
// import * as Sentry from "@sentry/nextjs";
//
// const Sentry = require("@sentry/nextjs");
//
// Sentry.init({
//   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
//   tracesSampleRate: 0.1,
//   replaysSessionSampleRate: 0.1,
//   replaysOnErrorSampleRate: 1.0,
// });

// Client-side error logging
export function logError(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === "production") {
    // In production, send to Sentry
    // Sentry.captureException(error, { extra: context });
    console.error("[Production Error]", error, context);
  } else {
    console.error("[Development Error]", error, context);
  }
}

// API error logging
export function logApiError(
  endpoint: string,
  statusCode: number,
  error?: Error,
  context?: Record<string, any>
) {
  const logData = {
    endpoint,
    statusCode,
    error: error?.message,
    stack: error?.stack,
    ...context,
  };

  if (statusCode >= 500) {
    console.error("[Server Error]", logData);
    // In production: Sentry.captureMessage("API Error", logData);
  } else if (statusCode >= 400) {
    console.warn("[Client Error]", logData);
  }
}

// Performance monitoring
export function startSpan(name: string) {
  if (process.env.NODE_ENV === "production") {
    // return Sentry.startTransaction({ name, op: "task" });
  }
  return {
    finish: () => {},
    setStatus: () => {},
    setTag: () => {},
    setData: () => {},
  };
}

// User context for error tracking
export function setUserContext(user: { id: string; email?: string; name?: string }) {
  if (process.env.NODE_ENV === "production") {
    // Sentry.setUser(user);
  }
}

// Clear user context on logout
export function clearUserContext() {
  if (process.env.NODE_ENV === "production") {
    // Sentry.configureScope((scope) => scope.setUser(null));
  }
}

// Export the config for easy access
export const sentryConfig = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  enabled: process.env.NODE_ENV === "production" && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
};
