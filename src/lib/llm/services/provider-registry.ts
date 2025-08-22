// Provider Registry Service - Manages LLM provider registration and lifecycle
import { LLMProvider } from '../providers/base';
import { LLMError, LLMErrorCode, ProviderStatus } from '../types';
import { ModelInfo } from '@/shared/types';
import { logger } from '@/lib/logger';

export class ProviderRegistry {
  private providers = new Map<string, LLMProvider>();
  private activeProviderId: string | null = null;
  private fallbackProviderId: string | null = null;

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

      logger.log(`LLM Provider registered: ${provider.name} (${provider.id})`);
    } catch (error) {
      logger.error(`Failed to register provider ${provider.id}:`, error);
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

      logger.log(`LLM Provider unregistered: ${providerId}`);
    } catch (error) {
      logger.error(`Error cleaning up provider ${providerId}:`, error);
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
    logger.log(`Active LLM provider set to: ${providerId}`);
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
    logger.log(`Fallback LLM provider set to: ${providerId}`);
  }

  /**
   * Get the currently active provider
   */
  getActiveProvider(): LLMProvider {
    if (!this.activeProviderId || !this.providers.has(this.activeProviderId)) {
      throw new LLMError(
        'No active provider available',
        LLMErrorCode.UNKNOWN,
        'registry'
      );
    }

    return this.providers.get(this.activeProviderId)!;
  }

  /**
   * Get the fallback provider
   */
  getFallbackProvider(): LLMProvider | null {
    if (
      !this.fallbackProviderId ||
      !this.providers.has(this.fallbackProviderId)
    ) {
      return null;
    }

    return this.providers.get(this.fallbackProviderId)!;
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
   * Get active provider ID
   */
  getActiveProviderId(): string | null {
    return this.activeProviderId;
  }

  /**
   * Get fallback provider ID
   */
  getFallbackProviderId(): string | null {
    return this.fallbackProviderId;
  }

  /**
   * Check if provider exists
   */
  hasProvider(providerId: string): boolean {
    return this.providers.has(providerId);
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
          logger.warn(`Failed to get models from provider ${id}:`, error);
          allModels.set(id, []);
        }
      }
    );

    await Promise.allSettled(modelPromises);
    return allModels;
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
            logger.error(`Error cleaning up provider ${provider.id}:`, error)
          )
    );

    await Promise.allSettled(cleanupPromises);
    this.providers.clear();
    this.activeProviderId = null;
    this.fallbackProviderId = null;

    logger.log('Provider registry cleanup completed');
  }
}
