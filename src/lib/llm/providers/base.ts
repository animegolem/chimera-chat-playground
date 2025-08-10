// Base LLM Provider Interface
// Defines the contract that all LLM providers must implement

import {
  LLMRequest,
  LLMResponse,
  ProviderSettings,
  ProviderStatus,
  ProviderConfig,
  CompletionOptions,
  LLMError,
  LLMErrorCode,
  StreamChunk,
  StreamOptions,
} from '../types';
import { ModelInfo } from '@/shared/types';

/**
 * Abstract base class that all LLM providers must extend
 * Provides common functionality and enforces the provider contract
 */
export abstract class LLMProvider {
  protected config: ProviderConfig;
  protected settings: ProviderSettings;
  protected isInitialized = false;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.settings = { ...config.defaultSettings };
  }

  // Abstract methods that must be implemented by concrete providers

  /**
   * Send a chat request and get a complete response
   */
  abstract chat(request: LLMRequest): Promise<LLMResponse>;

  /**
   * Send a simple completion request
   */
  abstract complete(
    prompt: string,
    options?: CompletionOptions
  ): Promise<string>;

  /**
   * Stream a chat response (returns async iterator)
   */
  abstract stream(request: LLMRequest): AsyncIterableIterator<StreamChunk>;

  /**
   * Check if the provider is available and can handle requests
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Get detailed status information about the provider
   */
  abstract getStatus(): Promise<ProviderStatus>;

  /**
   * Get list of available models from this provider
   */
  abstract getModels(): Promise<ModelInfo[]>;

  /**
   * Initialize the provider (connect, authenticate, etc.)
   */
  abstract initialize(): Promise<void>;

  /**
   * Clean up resources when provider is no longer needed
   */
  abstract cleanup(): Promise<void>;

  // Concrete methods with default implementations

  /**
   * Get the provider's unique identifier
   */
  get id(): string {
    return this.config.id;
  }

  /**
   * Get the provider's display name
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * Get the provider type (local or api)
   */
  get type(): 'local' | 'api' {
    return this.config.type;
  }

  /**
   * Get the provider's configuration
   */
  getConfig(): ProviderConfig {
    return { ...this.config };
  }

  /**
   * Configure the provider with new settings
   */
  configure(newSettings: Partial<ProviderSettings>): void {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };

    // Mark as not initialized if critical settings changed
    if (newSettings.endpoint || newSettings.apiKey) {
      this.isInitialized = false;
    }
  }

  /**
   * Get current provider settings
   */
  getSettings(): ProviderSettings {
    return { ...this.settings };
  }

  /**
   * Stream a chat response with callbacks (convenience method)
   */
  async streamWithCallbacks(
    request: LLMRequest,
    options: StreamOptions
  ): Promise<LLMResponse> {
    const chunks: string[] = [];
    let finalResponse: LLMResponse | undefined;

    try {
      for await (const chunk of this.stream(request)) {
        if (options.signal?.aborted) {
          throw new LLMError(
            'Request aborted',
            LLMErrorCode.UNKNOWN,
            this.id,
            false
          );
        }

        chunks.push(chunk.content);
        options.onChunk?.(chunk);

        if (chunk.done && chunk.metadata) {
          finalResponse = {
            content: chunks.join(''),
            model: request.model || this.config.defaultModel || 'unknown',
            ...chunk.metadata,
          };
        }
      }

      if (!finalResponse) {
        finalResponse = {
          content: chunks.join(''),
          model: request.model || this.config.defaultModel || 'unknown',
        };
      }

      options.onComplete?.(finalResponse);
      return finalResponse;
    } catch (error) {
      const llmError =
        error instanceof LLMError
          ? error
          : new LLMError(
              error instanceof Error
                ? error.message
                : 'Unknown streaming error',
              LLMErrorCode.UNKNOWN,
              this.id,
              false,
              error instanceof Error ? error : undefined
            );

      options.onError?.(llmError);
      throw llmError;
    }
  }

  /**
   * Validate a request before sending to the provider
   */
  protected validateRequest(request: LLMRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw new LLMError(
        'Request must contain at least one message',
        LLMErrorCode.INVALID_REQUEST,
        this.id
      );
    }

    if (
      request.temperature !== undefined &&
      (request.temperature < 0 || request.temperature > 2)
    ) {
      throw new LLMError(
        'Temperature must be between 0 and 2',
        LLMErrorCode.INVALID_REQUEST,
        this.id
      );
    }

    if (request.maxTokens !== undefined && request.maxTokens < 1) {
      throw new LLMError(
        'maxTokens must be at least 1',
        LLMErrorCode.INVALID_REQUEST,
        this.id
      );
    }
  }

  /**
   * Create a standardized error for this provider
   */
  protected createError(
    message: string,
    code: LLMErrorCode = LLMErrorCode.UNKNOWN,
    retryable: boolean = false,
    originalError?: Error
  ): LLMError {
    return new LLMError(message, code, this.id, retryable, originalError);
  }

  /**
   * Ensure the provider is initialized before use
   */
  protected async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
      this.isInitialized = true;
    }
  }

  /**
   * Get default model for this provider
   */
  getDefaultModel(): string {
    return this.config.defaultModel || 'unknown';
  }

  /**
   * Check if provider supports a specific feature
   */
  supportsFeature(feature: keyof ProviderConfig['supportedFeatures']): boolean {
    return !!this.config.supportedFeatures[feature];
  }
}
