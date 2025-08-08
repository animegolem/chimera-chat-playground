// LLM Service Types
// Common types and interfaces for the LLM integration system

import { ModelInfo } from '@/shared/types';

// Core LLM Request/Response Types
export interface LLMRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
  stream?: boolean;
  context?: MessageContext;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: TokenUsage;
  metadata?: Record<string, any>;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls';
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number; // in USD for API providers
}

export interface MessageContext {
  pageUrl?: string;
  pageTitle?: string;
  selectedText?: string;
  tabContext?: TabContext[];
}

export interface TabContext {
  title: string;
  url: string;
  domain: string;
}

// Provider Management Types
export interface ProviderSettings {
  endpoint?: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retryAttempts?: number;
  customHeaders?: Record<string, string>;
}

export interface ProviderStatus {
  available: boolean;
  connected: boolean;
  error?: string;
  lastChecked: number;
  latency?: number; // in milliseconds
  models?: string[];
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stop?: string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
}

// Error Types
export class LLMError extends Error {
  constructor(
    message: string,
    public code: LLMErrorCode,
    public provider: string,
    public retryable: boolean = false,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

export enum LLMErrorCode {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTH_FAILED = 'AUTH_FAILED',
  RATE_LIMITED = 'RATE_LIMITED',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  INVALID_REQUEST = 'INVALID_REQUEST',
  TIMEOUT = 'TIMEOUT',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  CONTENT_FILTERED = 'CONTENT_FILTERED',
  UNKNOWN = 'UNKNOWN'
}

// Provider Configuration
export interface ProviderConfig {
  id: string;
  name: string;
  type: 'local' | 'api';
  description?: string;
  defaultModel?: string;
  supportedFeatures: ProviderFeatures;
  defaultSettings: ProviderSettings;
}

export interface ProviderFeatures {
  streaming: boolean;
  multipleModels: boolean;
  customEndpoint: boolean;
  contextWindows: number[]; // supported context window sizes
  functionCalling?: boolean;
  imageInput?: boolean;
  codeGeneration?: boolean;
}

// Streaming Types
export interface StreamChunk {
  content: string;
  done: boolean;
  metadata?: Record<string, any>;
}

export interface StreamOptions {
  onChunk?: (chunk: StreamChunk) => void;
  onError?: (error: LLMError) => void;
  onComplete?: (response: LLMResponse) => void;
  signal?: AbortSignal;
}

// Manager Types
export interface LLMManagerConfig {
  defaultProvider?: string;
  fallbackProvider?: string;
  retryAttempts: number;
  timeout: number;
  enableFallback: boolean;
}

export type ProviderType = 'local' | 'api';

// Re-export shared types for convenience
export type { ModelInfo, Message } from '@/shared/types';