// Ollama Provider - Local LLM integration
// Connects to a local Ollama server for offline LLM functionality

import { LLMProvider } from './base';
import {
  LLMRequest,
  LLMResponse,
  ProviderStatus,
  ProviderConfig,
  CompletionOptions,
  StreamChunk,
  LLMError,
  LLMErrorCode,
} from '../types';
import { ModelInfo } from '@/shared/types';
import { streamFetch, parseJSONL } from '../utils/streaming';

export interface OllamaConfig extends ProviderConfig {
  baseUrl: string;
  models?: string[];
}

interface OllamaModelResponse {
  models: Array<{
    name: string;
    size: number;
    digest: string;
    details: {
      format: string;
      family: string;
      families?: string[];
      parameter_size: string;
      quantization_level: string;
    };
    modified_at: string;
  }>;
}

interface OlamaChatRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number;
  };
}

interface OlamaChatResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Ollama provider for local LLM integration
 * Connects to Ollama server running locally for privacy-focused AI
 */
export class OllamaProvider extends LLMProvider {
  private baseUrl: string;
  private availableModels: ModelInfo[] = [];

  constructor(config: OllamaConfig) {
    super(config);
    this.baseUrl = config.baseUrl;
  }

  async initialize(): Promise<void> {
    try {
      // Test connection by fetching available models
      await this.fetchAvailableModels();
      console.log(`Ollama provider initialized at ${this.baseUrl}`);
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
    console.log('Ollama provider cleaned up');
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

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ollamaRequest),
      });

      if (!response.ok) {
        throw this.createError(
          `Ollama API error: ${response.status} ${response.statusText}`,
          response.status >= 500
            ? LLMErrorCode.CONNECTION_FAILED
            : LLMErrorCode.UNKNOWN,
          response.status >= 500
        );
      }

      const data: OlamaChatResponse = await response.json();

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
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }

      throw this.createError(
        `Ollama chat request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        LLMErrorCode.CONNECTION_FAILED,
        true,
        error instanceof Error ? error : undefined
      );
    }
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

    try {
      const stream = streamFetch(
        `${this.baseUrl}/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ollamaRequest),
        },
        this.id
      );

      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk;

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data: OlamaChatResponse = JSON.parse(line);

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
                          (data.prompt_eval_count || 0) +
                          (data.eval_count || 0),
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
            } catch (parseError) {
              console.warn(
                'Failed to parse Ollama streaming response:',
                line,
                parseError
              );
            }
          }
        }
      }

      // Process any remaining buffer content
      if (buffer.trim()) {
        try {
          const data: OlamaChatResponse = JSON.parse(buffer);
          yield {
            content: data.message.content,
            done: true,
            metadata: {
              finishReason: 'stop',
            },
          };
        } catch (parseError) {
          console.warn(
            'Failed to parse final Ollama response:',
            buffer,
            parseError
          );
        }
      }
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }

      throw this.createError(
        `Ollama streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        LLMErrorCode.CONNECTION_FAILED,
        true,
        error instanceof Error ? error : undefined
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      return false;
    }
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
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch models: ${response.status} ${response.statusText}`
        );
      }

      const data: OllamaModelResponse = await response.json();

      this.availableModels = data.models.map((model) => ({
        id: model.name,
        name: model.name,
        emoji: this.getModelEmoji(model.details.family || model.details.format),
        color: this.getModelColor(model.details.family || model.details.format),
        type: 'local' as const,
        active: false,
        settings: {
          temperature: 0.7,
          systemPrompt: '',
          endpoint: this.baseUrl,
        },
      }));
    } catch (error) {
      throw this.createError(
        `Failed to fetch Ollama models: ${error instanceof Error ? error.message : 'Unknown error'}`,
        LLMErrorCode.CONNECTION_FAILED,
        true,
        error instanceof Error ? error : undefined
      );
    }
  }

  private extractContextLength(parameterSize: string): number {
    // Try to extract reasonable context lengths based on model size
    // This is a rough heuristic since Ollama doesn't always report context length
    if (parameterSize.includes('7B')) return 4096;
    if (parameterSize.includes('13B')) return 4096;
    if (parameterSize.includes('30B') || parameterSize.includes('34B'))
      return 8192;
    if (parameterSize.includes('70B')) return 8192;
    return 2048; // Conservative default
  }

  private getModelColor(family: string): string {
    // Color coding based on model family
    const familyColors: { [key: string]: string } = {
      llama: '#8ec07c', // Green for Llama models
      codellama: '#fb4934', // Red for CodeLlama
      mistral: '#fabd2f', // Yellow for Mistral
      gemma: '#83a598', // Blue for Gemma
      qwen: '#d3869b', // Purple for Qwen
      phi: '#fe8019', // Orange for Phi
    };

    for (const [key, color] of Object.entries(familyColors)) {
      if (family.toLowerCase().includes(key)) {
        return color;
      }
    }

    return '#8ec07c'; // Default green
  }

  private getModelEmoji(family: string): string {
    // Emoji based on model family
    const familyEmojis: { [key: string]: string } = {
      llama: '🦙',
      codellama: '💻',
      mistral: '🌪️',
      gemma: '💎',
      qwen: '🐼',
      phi: '🔬',
    };

    for (const [key, emoji] of Object.entries(familyEmojis)) {
      if (family.toLowerCase().includes(key)) {
        return emoji;
      }
    }

    return '🤖'; // Default robot
  }
}

// Factory function to create Ollama provider with default config
export function createOllamaProvider(
  baseUrl: string = 'http://localhost:11434'
): OllamaProvider {
  const config: OllamaConfig = {
    id: 'ollama',
    name: 'Ollama Local',
    type: 'local',
    baseUrl,
    defaultModel: 'llama2', // Will be updated when models are fetched
    defaultSettings: {
      endpoint: baseUrl,
      timeout: 30000,
      retryAttempts: 3,
    },
    supportedFeatures: {
      streaming: true,
      multipleModels: true,
      customEndpoint: true,
      contextWindows: [2048, 4096, 8192],
      functionCalling: false, // Ollama doesn't support function calling yet
      imageInput: false,
      codeGeneration: true,
    },
  };

  return new OllamaProvider(config);
}
