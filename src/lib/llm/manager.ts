// LLM Manager - Singleton coordinator for all LLM providers
// Handles provider registration, switching, and request routing

import { LLMProvider } from './providers/base';
import {
  LLMRequest,
  LLMResponse,
  LLMManagerConfig,
  LLMError,
  LLMErrorCode,
  ProviderStatus,
  CompletionOptions,
  StreamChunk,
  StreamOptions,
} from './types';
import { ModelInfo } from '@/shared/types';

/**
 * Singleton class that manages all LLM providers
 * Handles provider registration, switching, fallback, and request routing
 */
export class LLMManager {
  private static instance: LLMManager | null = null;

  private providers = new Map<string, LLMProvider>();
  private activeProviderId: string | null = null;
  private fallbackProviderId: string | null = null;

  private config: LLMManagerConfig = {
    retryAttempts: 3,
    timeout: 30000, // 30 seconds
    enableFallback: true,
  };

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): LLMManager {
    if (!LLMManager.instance) {
      LLMManager.instance = new LLMManager();
    }
    return LLMManager.instance;
  }

  /**
   * Configure the manager
   */
  configure(config: Partial<LLMManagerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Register a new provider
   */
  async registerProvider(provider: LLMProvider): Promise<void> {
    try {
      await provider.initialize();
      this.providers.set(provider.id, provider);

      // Set as active if no active provider exists
      if (!this.activeProviderId) {
        this.activeProviderId = provider.id;
      }

      console.log(`LLM Provider registered: ${provider.name} (${provider.id})`);
    } catch (error) {
      console.error(`Failed to register provider ${provider.id}:`, error);
      throw new LLMError(
        `Failed to register provider: ${error instanceof Error ? error.message : 'Unknown error'}`,
        LLMErrorCode.CONNECTION_FAILED,
        provider.id
      );
    }
  }

  /**
   * Unregister a provider
   */
  async unregisterProvider(providerId: string): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new LLMError(
        `Provider ${providerId} not found`,
        LLMErrorCode.UNKNOWN,
        providerId
      );
    }

    try {
      await provider.cleanup();
      this.providers.delete(providerId);

      // Update active provider if this was the active one
      if (this.activeProviderId === providerId) {
        this.activeProviderId =
          this.providers.size > 0 ? Array.from(this.providers.keys())[0] : null;
      }

      // Update fallback provider if this was the fallback
      if (this.fallbackProviderId === providerId) {
        this.fallbackProviderId = null;
      }

      console.log(`LLM Provider unregistered: ${providerId}`);
    } catch (error) {
      console.error(`Error cleaning up provider ${providerId}:`, error);
    }
  }

  /**
   * Set the active provider
   */
  setActiveProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new LLMError(
        `Provider ${providerId} not found`,
        LLMErrorCode.UNKNOWN,
        providerId
      );
    }

    this.activeProviderId = providerId;
    console.log(`Active LLM provider set to: ${providerId}`);
  }

  /**
   * Set the fallback provider
   */
  setFallbackProvider(providerId: string): void {
    if (!this.providers.has(providerId)) {
      throw new LLMError(
        `Provider ${providerId} not found`,
        LLMErrorCode.UNKNOWN,
        providerId
      );
    }

    this.fallbackProviderId = providerId;
    console.log(`Fallback LLM provider set to: ${providerId}`);
  }

  /**
   * Get the currently active provider
   */
  getActiveProvider(): LLMProvider {
    if (!this.activeProviderId || !this.providers.has(this.activeProviderId)) {
      throw new LLMError(
        'No active provider available',
        LLMErrorCode.UNKNOWN,
        'manager'
      );
    }

    return this.providers.get(this.activeProviderId)!;
  }

  /**
   * Get a specific provider by ID
   */
  getProvider(providerId: string): LLMProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all provider IDs
   */
  getProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Send a chat request using the active provider with fallback
   */
  async chat(request: LLMRequest): Promise<LLMResponse> {
    return this.executeWithFallback(
      (provider) => provider.chat(request),
      'chat request'
    );
  }

  /**
   * Send a completion request using the active provider with fallback
   */
  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    return this.executeWithFallback(
      (provider) => provider.complete(prompt, options),
      'completion request'
    );
  }

  /**
   * Stream a chat response using the active provider
   */
  async *stream(request: LLMRequest): AsyncIterableIterator<StreamChunk> {
    const provider = this.getActiveProvider();

    try {
      const stream = provider.stream(request);
      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      console.error(`Streaming failed with provider ${provider.id}:`, error);

      // For streaming, we don't fallback mid-stream as it would be confusing
      throw error instanceof LLMError
        ? error
        : new LLMError(
            `Streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            LLMErrorCode.UNKNOWN,
            provider.id
          );
    }
  }

  /**
   * Stream with callbacks (convenience method)
   */
  async streamWithCallbacks(
    request: LLMRequest,
    options: StreamOptions
  ): Promise<LLMResponse> {
    const provider = this.getActiveProvider();
    return provider.streamWithCallbacks(request, options);
  }

  /**
   * Get status of all providers
   */
  async getAllProviderStatuses(): Promise<Map<string, ProviderStatus>> {
    const statuses = new Map<string, ProviderStatus>();

    const statusPromises = Array.from(this.providers.entries()).map(
      async ([id, provider]) => {
        try {
          const status = await provider.getStatus();
          statuses.set(id, status);
        } catch (error) {
          statuses.set(id, {
            available: false,
            connected: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            lastChecked: Date.now(),
          });
        }
      }
    );

    await Promise.allSettled(statusPromises);
    return statuses;
  }

  /**
   * Get all available models from all providers
   */
  async getAllModels(): Promise<Map<string, ModelInfo[]>> {
    const allModels = new Map<string, ModelInfo[]>();

    const modelPromises = Array.from(this.providers.entries()).map(
      async ([id, provider]) => {
        try {
          const models = await provider.getModels();
          allModels.set(id, models);
        } catch (error) {
          console.warn(`Failed to get models from provider ${id}:`, error);
          allModels.set(id, []);
        }
      }
    );

    await Promise.allSettled(modelPromises);
    return allModels;
  }

  /**
   * Execute a function with the active provider, falling back if configured
   */
  private async executeWithFallback<T>(
    operation: (provider: LLMProvider) => Promise<T>,
    operationName: string
  ): Promise<T> {
    const provider = this.getActiveProvider();

    try {
      return await this.executeWithTimeout(
        () => operation(provider),
        this.config.timeout
      );
    } catch (error) {
      console.error(
        `${operationName} failed with provider ${provider.id}:`,
        error
      );

      // Try fallback if enabled and available
      if (
        this.config.enableFallback &&
        this.fallbackProviderId &&
        this.fallbackProviderId !== provider.id
      ) {
        const fallbackProvider = this.providers.get(this.fallbackProviderId);
        if (fallbackProvider) {
          console.log(
            `Attempting fallback to provider ${this.fallbackProviderId}`
          );

          try {
            return await this.executeWithTimeout(
              () => operation(fallbackProvider),
              this.config.timeout
            );
          } catch (fallbackError) {
            console.error(`Fallback also failed:`, fallbackError);
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
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new LLMError(
            `Operation timed out after ${timeoutMs}ms`,
            LLMErrorCode.TIMEOUT,
            this.activeProviderId || 'unknown'
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
   * Clean up all providers
   */
  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.providers.values()).map(
      (provider) =>
        provider
          .cleanup()
          .catch((error) =>
            console.error(`Error cleaning up provider ${provider.id}:`, error)
          )
    );

    await Promise.allSettled(cleanupPromises);
    this.providers.clear();
    this.activeProviderId = null;
    this.fallbackProviderId = null;

    console.log('LLMManager cleanup completed');
  }

  /**
   * Get manager configuration
   */
  getConfig(): LLMManagerConfig {
    return { ...this.config };
  }
}
