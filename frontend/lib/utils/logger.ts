/**
 * Frontend logging utility for user actions and errors
 * 
 * Provides structured logging similar to backend logging service
 * Can be integrated with external services (Sentry, LogRocket, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

class FrontendLogger {
  private isDevelopment: boolean;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      this.log('debug', message, context);
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context);
    }
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
    console.warn(`[WARN] ${message}`, context);
  }

  /**
   * Log an error
   */
  error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };

    this.log('error', message, errorContext);
    console.error(`[ERROR] ${message}`, errorContext);

    // In production, send to error tracking service
    if (!this.isDevelopment) {
      this.sendToErrorTracking(message, errorContext);
    }
  }

  /**
   * Log user action for analytics
   */
  logUserAction(action: string, details?: Record<string, any>) {
    this.info(`User Action: ${action}`, {
      action,
      ...details,
      type: 'user_action',
    });
  }

  /**
   * Log API call
   */
  logApiCall(method: string, endpoint: string, duration?: number, status?: number) {
    this.info(`API Call: ${method} ${endpoint}`, {
      method,
      endpoint,
      duration_ms: duration,
      status,
      type: 'api_call',
    });
  }

  /**
   * Log page view
   */
  logPageView(path: string, title?: string) {
    this.info(`Page View: ${path}`, {
      path,
      title,
      type: 'page_view',
    });
  }

  /**
   * Log feedback submission
   */
  logFeedbackSubmission(recommendationId: string, rating: number, hasComment: boolean) {
    this.info('Feedback Submitted', {
      recommendation_id: recommendationId,
      rating,
      has_comment: hasComment,
      type: 'feedback',
    });
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    // Add to in-memory logs
    this.logs.push(entry);

    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  /**
   * Send error to external tracking service
   * TODO: Integrate with Sentry, LogRocket, or similar
   */
  private sendToErrorTracking(message: string, context: Record<string, any>) {
    // Example: Sentry.captureException(...)
    // For now, just store it
    console.error('[Error Tracking]', message, context);
  }

  /**
   * Get recent logs (useful for debugging)
   */
  getRecentLogs(count: number = 10): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs as JSON (for debugging/support)
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Global logger instance
export const logger = new FrontendLogger();

/**
 * Error boundary logger helper
 */
export function logErrorBoundary(error: Error, errorInfo: any) {
  logger.error('React Error Boundary', error, {
    componentStack: errorInfo.componentStack,
    type: 'error_boundary',
  });
}

/**
 * API call wrapper with automatic logging
 */
export async function loggedApiCall<T>(
  fn: () => Promise<T>,
  method: string,
  endpoint: string
): Promise<T> {
  const startTime = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    logger.logApiCall(method, endpoint, duration, 200);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.logApiCall(method, endpoint, duration, 500);
    logger.error(`API call failed: ${method} ${endpoint}`, error);
    throw error;
  }
}
