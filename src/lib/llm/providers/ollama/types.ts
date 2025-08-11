// Ollama-specific type definitions
import { ProviderConfig } from '../../types';

export interface OllamaConfig extends ProviderConfig {
  baseUrl: string;
  models?: string[];
}

export interface OllamaModelResponse {
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

export interface OlamaChatRequest {
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

export interface OlamaChatResponse {
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