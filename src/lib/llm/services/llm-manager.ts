// LLM Manager - Refactored using service layer pattern
// Orchestrates provider management, execution, and streaming services

import { LLMProvider } from '../providers/base';
import {
  LLMRequest,
  LLMResponse,
  LLMManagerConfig,
  ProviderStatus,
  CompletionOptions,
  StreamChunk,
  StreamOptions,
} from '../types';
import { ModelInfo } from '@/shared/types';
import { ProviderRegistry } from './provider-registry';
import { ExecutionService } from './execution-service';
import { StreamingService } from './streaming-service';
import { ConfigService } from './config-service';

/**
 * Refactored LLM Manager using service layer pattern
 * Coordinates provider management, execution, and streaming services
 */
export class LLMManager {
  private static instance: LLMManager | null = null;

  private configService: ConfigService;
  private providerRegistry: ProviderRegistry;
  private executionService: ExecutionService;
  private streamingService: StreamingService;

  private constructor() {
    // Initialize services
    this.configService = new ConfigService();
    this.providerRegistry = new ProviderRegistry();
    this.executionService = new ExecutionService(
      this.providerRegistry,
      this.configService.getConfig()
    );
    this.streamingService = new StreamingService(this.providerRegistry);
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

  // Configuration methods
  configure(config: Partial<LLMManagerConfig>): void {
    this.configService.configure(config);
    // Update execution service with new config
    this.executionService = new ExecutionService(
      this.providerRegistry,
      this.configService.getConfig()
    );
  }

  getConfig(): LLMManagerConfig {
    return this.configService.getConfig();
  }

  // Provider management methods (delegated to ProviderRegistry)
  async registerProvider(provider: LLMProvider): Promise<void> {
    return this.providerRegistry.registerProvider(provider);
  }

  async unregisterProvider(providerId: string): Promise<void> {
    return this.providerRegistry.unregisterProvider(providerId);
  }

  setActiveProvider(providerId: string): void {
    return this.providerRegistry.setActiveProvider(providerId);
  }

  setFallbackProvider(providerId: string): void {
    return this.providerRegistry.setFallbackProvider(providerId);
  }

  getActiveProvider(): LLMProvider {
    return this.providerRegistry.getActiveProvider();
  }

  getProvider(providerId: string): LLMProvider | undefined {
    return this.providerRegistry.getProvider(providerId);
  }

  getAllProviders(): LLMProvider[] {
    return this.providerRegistry.getAllProviders();
  }

  getProviderIds(): string[] {
    return this.providerRegistry.getProviderIds();
  }

  async getAllProviderStatuses(): Promise<Map<string, ProviderStatus>> {
    return this.providerRegistry.getAllProviderStatuses();
  }

  async getAllModels(): Promise<Map<string, ModelInfo[]>> {
    return this.providerRegistry.getAllModels();
  }

  // Request execution methods (delegated to ExecutionService)
  async chat(request: LLMRequest): Promise<LLMResponse> {
    return this.executionService.executeWithFallback(
      (provider) => provider.chat(request),
      'chat request'
    );
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    return this.executionService.executeWithFallback(
      (provider) => provider.complete(prompt, options),
      'completion request'
    );
  }

  // Streaming methods (delegated to StreamingService)
  async *stream(request: LLMRequest): AsyncIterableIterator<StreamChunk> {
    yield* this.streamingService.stream(request);
  }

  async streamWithCallbacks(
    request: LLMRequest,
    options: StreamOptions
  ): Promise<LLMResponse> {
    return this.streamingService.streamWithCallbacks(request, options);
  }

  // Cleanup
  async cleanup(): Promise<void> {
    await this.providerRegistry.cleanup();
  }
}