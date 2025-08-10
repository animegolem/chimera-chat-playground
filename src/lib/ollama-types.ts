// Types for Ollama API responses

export interface OllamaModelDetails {
  parent_model: string;
  format: string;
  family: string;
  families?: string[];
  parameter_size: string;
  quantization_level: string;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: OllamaModelDetails;
  expires_at?: string;
  size_vram?: number;
}

export interface OllamaTagsResponse {
  models: OllamaModel[];
}

export interface ModelDiscoveryResult {
  success: boolean;
  models?: OllamaModel[];
  error?: string;
}
