// Legacy re-export for backward compatibility
// All Ollama functionality has been moved to ./ollama/ directory for better organization
export { OllamaProvider } from './ollama/provider';
export { createOllamaProvider } from './ollama/factory';
export type { OllamaConfig } from './ollama/types';
