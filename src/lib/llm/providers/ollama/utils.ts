// Ollama utility functions
import { ModelInfo } from '@/shared/types';
import { OllamaModelResponse } from './types';

/**
 * Extract reasonable context length based on model parameter size
 * This is a heuristic since Ollama doesn't always report context length
 */
export function extractContextLength(parameterSize: string): number {
  if (parameterSize.includes('7B')) return 4096;
  if (parameterSize.includes('13B')) return 4096;
  if (parameterSize.includes('30B') || parameterSize.includes('34B'))
    return 8192;
  if (parameterSize.includes('70B')) return 8192;
  return 2048; // Conservative default
}

/**
 * Get color coding based on model family
 */
export function getModelColor(family: string): string {
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

/**
 * Get emoji based on model family
 */
export function getModelEmoji(family: string): string {
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

/**
 * Convert Ollama API model response to ModelInfo format
 */
export function mapOllamaModelToModelInfo(
  model: OllamaModelResponse['models'][0],
  baseUrl: string
): ModelInfo {
  const family = model.details.family || model.details.format;

  return {
    id: model.name,
    name: model.name,
    emoji: getModelEmoji(family),
    color: getModelColor(family),
    type: 'local' as const,
    active: false,
    settings: {
      temperature: 0.7,
      systemPrompt: '',
      endpoint: baseUrl,
    },
  };
}
