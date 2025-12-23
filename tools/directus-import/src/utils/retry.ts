import { log } from './log';

const DEFAULT_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface RetryOptions {
  retries?: number;
  delayMs?: number;
  context?: string;
}

/**
 * Check if an error is a connection/transient error that should be retried
 */
function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const retryablePatterns = [
    'connection',
    'ROLLBACK',
    'timeout',
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'socket hang up',
    'network',
  ];
  return retryablePatterns.some((pattern) => message.toLowerCase().includes(pattern.toLowerCase()));
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with automatic retries on connection errors.
 * Uses exponential backoff for retry delays.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = DEFAULT_RETRIES, delayMs = RETRY_DELAY_MS, context = '' } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === retries;

      if (isLastAttempt || !isRetryableError(error)) {
        throw error;
      }

      const backoffDelay = delayMs * attempt;
      const prefix = context ? `[${context}] ` : '';
      log.warn(`${prefix}Attempt ${attempt}/${retries} failed. Retrying in ${backoffDelay}ms...`);
      await sleep(backoffDelay);
    }
  }

  throw lastError;
}
