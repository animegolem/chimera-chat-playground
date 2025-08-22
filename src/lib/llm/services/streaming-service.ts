// Streaming Service - Handles streaming operations
import { LLMProvider } from '../providers/base';
import {
  LLMRequest,
  StreamChunk,
  StreamOptions,
  LLMResponse,
  LLMError,
  LLMErrorCode,
} from '../types';
import { logger } from '@/lib/logger';
import { ProviderRegistry } from './provider-registry';

export class StreamingService {
  constructor(private registry: ProviderRegistry) {}

  /**
   * Stream a chat response using the active provider
   */
  async *stream(request: LLMRequest): AsyncIterableIterator<StreamChunk> {
    const provider = this.registry.getActiveProvider();

    try {
      const stream = provider.stream(request);
      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      logger.error(`Streaming failed with provider ${provider.id}:`, error);

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
    const provider = this.registry.getActiveProvider();
    return provider.streamWithCallbacks(request, options);
  }
}
