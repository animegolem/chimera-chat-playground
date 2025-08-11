// Retry handling for network operations
import { LLMError } from '../types';
import { logger } from '@/lib/logger';

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
  retryableErrors?: (error: Error) => boolean;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  retryableErrors: (error: Error) => {
    if (error instanceof LLMError) {
      return error.retryable;
    }
    return true; // Retry by default for unknown errors
  },
};

/**
 * Retry a streaming operation with exponential backoff
 */
export async function retryStream<T>(
  operation: () => AsyncIterableIterator<T>,
  options: Partial<RetryOptions> = {}
): Promise<AsyncIterableIterator<T>> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return operation();
    } catch (error) {
      if (attempt === config.maxRetries) {
        throw error;
      }

      // Check if error is retryable
      if (!config.retryableErrors!(error as Error)) {
        throw error;
      }

      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );

      logger.log(
        `Stream attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
        error
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Retry stream failed unexpectedly');
}

/**
 * Retry a standard async operation
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === config.maxRetries) {
        throw error;
      }

      // Check if error is retryable
      if (!config.retryableErrors!(error as Error)) {
        throw error;
      }

      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );

      logger.log(
        `Operation attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
        error
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Retry operation failed unexpectedly');
}

/**
 * Retry handler class for reusable retry logic
 */
export class RetryHandler {
  constructor(private options: RetryOptions = DEFAULT_RETRY_OPTIONS) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    return retryOperation(operation, this.options);
  }

  async executeStream<T>(operation: () => AsyncIterableIterator<T>): Promise<AsyncIterableIterator<T>> {
    return retryStream(operation, this.options);
  }

  updateOptions(newOptions: Partial<RetryOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}