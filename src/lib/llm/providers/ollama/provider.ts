// Ollama Provider - Local LLM integration
// Connects to a local Ollama server for offline LLM functionality

import { LLMProvider } from '../base';
import {
  LLMRequest,
  LLMResponse,
  ProviderStatus,
  CompletionOptions,
  StreamChunk,
  LLMErrorCode,
} from '../../types';
import { ModelInfo } from '@/shared/types';
import { logger } from '@/lib/logger';
import { OllamaClient } from './client';
import { OllamaConfig, OlamaChatRequest } from './types';

/**
 * Ollama provider for local LLM integration
 * Connects to Ollama server running locally for privacy-focused AI
 */
export class OllamaProvider extends LLMProvider {
  private client: OllamaClient;
  private availableModels: ModelInfo[] = [];

  constructor(config: OllamaConfig) {
    super(config);
    this.client = new OllamaClient(config.baseUrl);
  }

  async initialize(): Promise<void> {
    try {
      // Test connection by fetching available models
      await this.fetchAvailableModels();
      logger.log(
        `Ollama provider initialized at ${(this.config as OllamaConfig).baseUrl}`
      );
    } catch (error) {
      throw this.createError(
        `Failed to initialize Ollama provider: ${error instanceof Error ? error.message : 'Unknown error'}`,
        LLMErrorCode.CONNECTION_FAILED,
        true,
        error instanceof Error ? error : undefined
      );
    }
  }

  async cleanup(): Promise<void> {
    // Ollama provider doesn't need special cleanup
    logger.log('Ollama provider cleaned up');
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    this.validateRequest(request);
    await this.ensureInitialized();

    const ollamaRequest: OlamaChatRequest = {
      model: request.model || this.getDefaultModel(),
      messages: request.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: false,
      options: {
        temperature: request.temperature,
        top_p: request.topP,
        num_predict: request.maxTokens,
      },
    };

    const data = await this.client.chat(ollamaRequest);

    return {
      content: data.message.content,
      model: data.model,
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
      metadata: {
        finishReason: 'stop',
        processingTime: data.total_duration
          ? data.total_duration / 1000000
          : undefined, // Convert nanoseconds to milliseconds
      },
    };
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const request: LLMRequest = {
      messages: [{ role: 'user', content: prompt, timestamp: Date.now() }],
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    };

    const response = await this.chat(request);
    return response.content;
  }

  async *stream(request: LLMRequest): AsyncIterableIterator<StreamChunk> {
    this.validateRequest(request);
    await this.ensureInitialized();

    const ollamaRequest: OlamaChatRequest = {
      model: request.model || this.getDefaultModel(),
      messages: request.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: true,
      options: {
        temperature: request.temperature,
        top_p: request.topP,
        num_predict: request.maxTokens,
      },
    };

    const stream = await this.client.createChatStream(ollamaRequest, this.id);
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk;

      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        const data = this.client.parseStreamChunk(line);
        if (!data) continue;

        yield {
          content: data.message.content,
          done: data.done,
          metadata: data.done
            ? {
                finishReason: 'stop',
                usage: {
                  promptTokens: data.prompt_eval_count || 0,
                  completionTokens: data.eval_count || 0,
                  totalTokens:
                    (data.prompt_eval_count || 0) + (data.eval_count || 0),
                },
                processingTime: data.total_duration
                  ? data.total_duration / 1000000
                  : undefined,
              }
            : undefined,
        };

        if (data.done) {
          return;
        }
      }
    }

    // Process any remaining buffer content
    if (buffer.trim()) {
      const data = this.client.parseStreamChunk(buffer);
      if (data) {
        yield {
          content: data.message.content,
          done: true,
          metadata: {
            finishReason: 'stop',
          },
        };
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    return await this.client.isAvailable();
  }

  async getStatus(): Promise<ProviderStatus> {
    const lastChecked = Date.now();

    try {
      const available = await this.isAvailable();

      if (!available) {
        return {
          available: false,
          connected: false,
          error: 'Ollama server not responding',
          lastChecked,
        };
      }

      // Get model count as additional status info
      const models = await this.getModels().catch(() => []);

      return {
        available: true,
        connected: true,
        lastChecked,
        models: models.slice(0, 5).map((m) => m.name), // First 5 models
      };
    } catch (error) {
      return {
        available: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked,
      };
    }
  }

  async getModels(): Promise<ModelInfo[]> {
    if (this.availableModels.length > 0) {
      return this.availableModels;
    }

    await this.fetchAvailableModels();
    return this.availableModels;
  }

  private async fetchAvailableModels(): Promise<void> {
    this.availableModels = await this.client.fetchModels();
  }
}
