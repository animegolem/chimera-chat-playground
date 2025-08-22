// Factory function to create Ollama provider with default configuration
import { OllamaProvider } from './provider';
import { OllamaConfig } from './types';

/**
 * Create Ollama provider with default configuration
 */
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
