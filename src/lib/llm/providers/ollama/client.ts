// Ollama API client - handles HTTP communication with Ollama server
import { LLMError, LLMErrorCode } from '../../types';
import { ModelInfo } from '@/shared/types';
import { logger } from '@/lib/logger';
import { streamFetch } from '../../utils/streaming';
import {
  OllamaModelResponse,
  OlamaChatRequest,
  OlamaChatResponse,
} from './types';
import { mapOllamaModelToModelInfo } from './utils';

export class OllamaClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if Ollama server is available
   */
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

  /**
   * Fetch available models from Ollama server
   */
  async fetchModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch models: ${response.status} ${response.statusText}`
        );
      }

      const data: OllamaModelResponse = await response.json();

      return data.models.map((model) =>
        mapOllamaModelToModelInfo(model, this.baseUrl)
      );
    } catch (error) {
      throw new LLMError(
        `Failed to fetch Ollama models: ${error instanceof Error ? error.message : 'Unknown error'}`,
        LLMErrorCode.CONNECTION_FAILED,
        'ollama',
        true,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Send chat request to Ollama (non-streaming)
   */
  async chat(request: OlamaChatRequest): Promise<OlamaChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new LLMError(
          `Ollama API error: ${response.status} ${response.statusText}`,
          response.status >= 500
            ? LLMErrorCode.CONNECTION_FAILED
            : LLMErrorCode.UNKNOWN,
          'ollama',
          response.status >= 500
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }

      throw new LLMError(
        `Ollama chat request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        LLMErrorCode.CONNECTION_FAILED,
        'ollama',
        true,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create streaming chat request to Ollama
   */
  async createChatStream(
    request: OlamaChatRequest,
    providerId: string
  ): Promise<AsyncIterable<string>> {
    try {
      const streamRequest = { ...request, stream: true };

      return streamFetch(
        `${this.baseUrl}/api/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(streamRequest),
        },
        providerId
      );
    } catch (error) {
      throw new LLMError(
        `Ollama streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        LLMErrorCode.CONNECTION_FAILED,
        'ollama',
        true,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Parse streaming response chunks from Ollama
   */
  parseStreamChunk(chunk: string): OlamaChatResponse | null {
    if (!chunk.trim()) {
      return null;
    }

    try {
      return JSON.parse(chunk);
    } catch (parseError) {
      logger.warn(
        'Failed to parse Ollama streaming response:',
        chunk,
        parseError
      );
      return null;
    }
  }
}
