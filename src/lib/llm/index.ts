// LLM Service - Main entry point
// Provides a unified interface for LLM integration in the Firefox extension

// Core classes
export { LLMManager } from './manager';
export { LLMProvider } from './providers/base';

// Types
export type {
  LLMRequest,
  LLMResponse,
  ChatMessage,
  TokenUsage,
  MessageContext,
  TabContext,
  ProviderSettings,
  ProviderStatus,
  ProviderConfig,
  ProviderFeatures,
  CompletionOptions,
  StreamChunk,
  StreamOptions,
  LLMManagerConfig,
  ProviderType,
  ModelInfo,
  Message,
} from './types';

// Error handling
export { LLMError, LLMErrorCode } from './types';

// Streaming utilities
export {
  parseSSE,
  parseJSONL,
  createStreamFromAsyncIterable,
  createAsyncIterableFromStream,
  StreamBuffer,
  streamFetch,
  mergeStreamChunks,
  createTimeoutController,
  retryStream,
} from './utils/streaming';

// Convenience functions for common operations

// Import the types we need for function signatures
import { LLMManager } from './manager';
import { LLMProvider } from './providers/base';
import { LLMRequest, ChatMessage, LLMError, LLMErrorCode } from './types';

/**
 * Get the singleton LLM manager instance
 */
export const getLLMManager = () => LLMManager.getInstance();

/**
 * Initialize the LLM service with default configuration
 */
export async function initializeLLMService(config?: {
  timeout?: number;
  enableFallback?: boolean;
  retryAttempts?: number;
}) {
  const manager = LLMManager.getInstance();

  if (config) {
    manager.configure(config);
  }

  return manager;
}

/**
 * Create a simple chat request object
 */
export function createChatRequest(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    stream?: boolean;
  }
): LLMRequest {
  return {
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: Date.now(),
    })),
    model: options?.model,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
    systemPrompt: options?.systemPrompt,
    stream: options?.stream,
  };
}

/**
 * Create a simple completion request
 */
export function createCompletionRequest(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
): LLMRequest {
  const messages: ChatMessage[] = [];

  if (options?.systemPrompt) {
    messages.push({
      role: 'system',
      content: options.systemPrompt,
      timestamp: Date.now(),
    });
  }

  messages.push({
    role: 'user',
    content: prompt,
    timestamp: Date.now(),
  });

  return {
    messages,
    model: options?.model,
    temperature: options?.temperature,
    maxTokens: options?.maxTokens,
  };
}

/**
 * Check if any LLM providers are available
 */
export async function hasAvailableProviders(): Promise<boolean> {
  const manager = LLMManager.getInstance();
  const providers = manager.getAllProviders();

  if (providers.length === 0) {
    return false;
  }

  // Check if at least one provider is available
  const availabilityChecks = providers.map((provider) =>
    provider.isAvailable().catch(() => false)
  );

  const results = await Promise.all(availabilityChecks);
  return results.some((available) => available);
}

/**
 * Get a summary of all provider statuses
 */
export async function getProviderSummary(): Promise<{
  total: number;
  available: number;
  connected: number;
  errors: string[];
}> {
  const manager = LLMManager.getInstance();
  const statuses = await manager.getAllProviderStatuses();

  let available = 0;
  let connected = 0;
  const errors: string[] = [];

  for (const [providerId, status] of statuses) {
    if (status.available) available++;
    if (status.connected) connected++;
    if (status.error) {
      errors.push(`${providerId}: ${status.error}`);
    }
  }

  return {
    total: statuses.size,
    available,
    connected,
    errors,
  };
}

// Default export for convenience
export default {
  LLMManager,
  LLMProvider,
  LLMError,
  LLMErrorCode,
  getLLMManager,
  initializeLLMService,
  createChatRequest,
  createCompletionRequest,
  hasAvailableProviders,
  getProviderSummary,
};
