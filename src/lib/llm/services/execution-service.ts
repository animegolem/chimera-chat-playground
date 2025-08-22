// Execution Service - Handles request execution with fallback and timeout logic
import { LLMProvider } from '../providers/base';
import { LLMError, LLMErrorCode, LLMManagerConfig } from '../types';
import { logger } from '@/lib/logger';
import { ProviderRegistry } from './provider-registry';

export class ExecutionService {
  constructor(
    private registry: ProviderRegistry,
    private config: LLMManagerConfig
  ) {}

  /**
   * Execute a function with the active provider, falling back if configured
   */
  async executeWithFallback<T>(
    operation: (provider: LLMProvider) => Promise<T>,
    operationName: string
  ): Promise<T> {
    const provider = this.registry.getActiveProvider();

    try {
      return await this.executeWithTimeout(
        () => operation(provider),
        this.config.timeout || 30000
      );
    } catch (error) {
      logger.error(
        `${operationName} failed with provider ${provider.id}:`,
        error
      );

      // Try fallback if enabled and available
      if (this.config.enableFallback) {
        const fallbackProvider = this.registry.getFallbackProvider();
        if (fallbackProvider && fallbackProvider.id !== provider.id) {
          logger.log(`Attempting fallback to provider ${fallbackProvider.id}`);

          try {
            return await this.executeWithTimeout(
              () => operation(fallbackProvider),
              this.config.timeout || 30000
            );
          } catch (fallbackError) {
            logger.error(`Fallback also failed:`, fallbackError);
            // Fall through to throw original error
          }
        }
      }

      // Re-throw the original error
      throw error instanceof LLMError
        ? error
        : new LLMError(
            `${operationName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            LLMErrorCode.UNKNOWN,
            provider.id
          );
    }
  }

  /**
   * Execute a function with timeout
   */
  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new LLMError(
            `Operation timed out after ${timeoutMs}ms`,
            LLMErrorCode.TIMEOUT,
            this.registry.getActiveProviderId() || 'unknown'
          )
        );
      }, timeoutMs);

      operation()
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeout));
    });
  }

  /**
   * Execute with retry logic
   */
  async executeWithRetry<T>(
    operation: (provider: LLMProvider) => Promise<T>,
    operationName: string,
    maxRetries: number = this.config.retryAttempts || 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeWithFallback(operation, operationName);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          logger.warn(
            `${operationName} attempt ${attempt} failed, retrying in ${delay}ms:`,
            error
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }
}
