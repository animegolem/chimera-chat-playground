// Model Discovery Service for Ollama integration
import { ModelInfo } from '@/shared/types';
import { OllamaModel, ModelDiscoveryResult } from './ollama-types';

/**
 * Smart defaults system for auto-assigning model properties
 */
class SmartDefaults {
  // Gruvbox color palette for cycling through models
  private static readonly GRUVBOX_COLORS = [
    '#83a598', // blue
    '#b8bb26', // green
    '#d3869b', // purple
    '#fabd2f', // yellow
    '#fe8019', // orange
    '#fb4934', // red
    '#8ec07c', // aqua
    '#a89984', // gray
  ];

  // Model family to emoji mapping
  private static readonly MODEL_EMOJIS: Record<string, string> = {
    // Popular models
    llama: '🦙',
    gemma: '💎',
    mistral: '🌪️',
    codellama: '👨‍💻',
    vicuna: '🦄',
    alpaca: '🦙',
    wizard: '🧙‍♂️',
    orca: '🐋',
    phi: 'φ',
    neural: '🧠',
    falcon: '🦅',
    stable: '🎨',
    dolphin: '🐬',
    chat: '💬',
    instruct: '📚',
    code: '💻',
    uncensored: '🔓',
    default: '🤖',
  };

  private static usedColorIndex = 0;

  /**
   * Auto-assign color by cycling through Gruvbox palette
   */
  static getNextColor(): string {
    const color =
      this.GRUVBOX_COLORS[this.usedColorIndex % this.GRUVBOX_COLORS.length];
    this.usedColorIndex++;
    return color;
  }

  /**
   * Determine emoji based on model name patterns
   */
  static getModelEmoji(modelName: string): string {
    const normalizedName = modelName.toLowerCase();

    // Check for specific patterns in model name
    for (const [pattern, emoji] of Object.entries(this.MODEL_EMOJIS)) {
      if (normalizedName.includes(pattern)) {
        return emoji;
      }
    }

    return this.MODEL_EMOJIS.default;
  }

  /**
   * Generate system prompt based on model type
   */
  static getDefaultSystemPrompt(modelName: string): string {
    const normalizedName = modelName.toLowerCase();

    if (
      normalizedName.includes('code') ||
      normalizedName.includes('programmer')
    ) {
      return 'You are an expert programming assistant. Provide clear, efficient, and well-documented code solutions.';
    }

    if (
      normalizedName.includes('instruct') ||
      normalizedName.includes('chat')
    ) {
      return 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses to user queries.';
    }

    if (normalizedName.includes('uncensored')) {
      return 'You are an AI assistant that provides direct, honest responses without unnecessary restrictions.';
    }

    return 'You are a helpful AI assistant focused on providing accurate and useful responses.';
  }

  /**
   * Get default temperature based on model type
   */
  static getDefaultTemperature(modelName: string): number {
    const normalizedName = modelName.toLowerCase();

    // Code models benefit from lower temperature for consistency
    if (normalizedName.includes('code')) {
      return 0.1;
    }

    // Creative models can use higher temperature
    if (
      normalizedName.includes('creative') ||
      normalizedName.includes('story')
    ) {
      return 0.9;
    }

    // Standard chat temperature
    return 0.7;
  }
}

/**
 * Service for discovering and managing Ollama models
 */
export class ModelDiscoveryService {
  private static readonly OLLAMA_ENDPOINT = 'http://127.0.0.1:11434';
  private static readonly TAGS_ENDPOINT = `${this.OLLAMA_ENDPOINT}/api/tags`;

  /**
   * Discover available models from Ollama
   */
  static async discoverOllamaModels(): Promise<ModelDiscoveryResult> {
    try {
      const response = await fetch(this.TAGS_ENDPOINT, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Ollama API error: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();

      return {
        success: true,
        models: data.models || [],
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error discovering models',
      };
    }
  }

  /**
   * Convert Ollama model to our ModelInfo format with smart defaults
   */
  static ollamaToModelInfo(
    ollamaModel: OllamaModel,
    existingConfig?: Partial<ModelInfo>
  ): ModelInfo {
    const modelName = ollamaModel.name;

    // Extract clean display name (remove :tag if present)
    const displayName = modelName.includes(':')
      ? modelName.split(':')[0]
      : modelName;

    return {
      id: modelName, // Keep full name with tag as ID
      name:
        existingConfig?.name ||
        displayName.charAt(0).toUpperCase() + displayName.slice(1),
      emoji: existingConfig?.emoji || SmartDefaults.getModelEmoji(modelName),
      color: existingConfig?.color || SmartDefaults.getNextColor(),
      type: 'local' as const,
      active: existingConfig?.active ?? false, // Default to inactive
      settings: {
        temperature:
          existingConfig?.settings?.temperature ??
          SmartDefaults.getDefaultTemperature(modelName),
        systemPrompt:
          existingConfig?.settings?.systemPrompt ??
          SmartDefaults.getDefaultSystemPrompt(modelName),
        endpoint: existingConfig?.settings?.endpoint ?? this.OLLAMA_ENDPOINT,
        maxTokens: existingConfig?.settings?.maxTokens ?? 2048,
        ...existingConfig?.settings,
      },
    };
  }

  /**
   * Sync discovered models with existing user configurations
   */
  static syncWithUserConfig(
    discoveredModels: OllamaModel[],
    existingModels: ModelInfo[]
  ): ModelInfo[] {
    // Create a map of existing configurations by model ID
    const existingConfigMap = new Map<string, ModelInfo>();
    existingModels.forEach((model) => {
      existingConfigMap.set(model.id, model);
    });

    // Convert discovered models to ModelInfo with preserved user config
    const syncedModels = discoveredModels.map((ollamaModel) => {
      const existing = existingConfigMap.get(ollamaModel.name);
      return this.ollamaToModelInfo(ollamaModel, existing);
    });

    // Add any existing models that weren't discovered (might be API models)
    existingModels.forEach((existingModel) => {
      if (existingModel.type !== 'local') {
        // Keep API models that aren't from Ollama
        const notFound = !discoveredModels.some(
          (discovered) => discovered.name === existingModel.id
        );
        if (notFound) {
          syncedModels.push(existingModel);
        }
      }
    });

    return syncedModels;
  }

  /**
   * Background script compatible discovery (using XMLHttpRequest)
   */
  static async discoverModelsXHR(): Promise<ModelDiscoveryResult> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', this.TAGS_ENDPOINT);
      xhr.setRequestHeader('Accept', 'application/json');

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({
                success: true,
                models: data.models || [],
              });
            } catch (error) {
              resolve({
                success: false,
                error: 'Failed to parse Ollama API response',
              });
            }
          } else {
            resolve({
              success: false,
              error: `Ollama API error: ${xhr.status} ${xhr.statusText}`,
            });
          }
        }
      };

      xhr.onerror = function () {
        resolve({
          success: false,
          error: 'Network error connecting to Ollama',
        });
      };

      xhr.timeout = 5000; // 5 second timeout
      xhr.ontimeout = function () {
        resolve({
          success: false,
          error: 'Timeout connecting to Ollama API',
        });
      };

      xhr.send();
    });
  }
}
