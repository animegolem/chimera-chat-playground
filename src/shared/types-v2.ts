// Enhanced type system separating Discovered, Configured, and Active models
import { z } from 'zod';

/**
 * Raw discovered model from API (no user configuration)
 */
export interface DiscoveredModel {
  id: string; // Original model ID from API (e.g., 'gemma3:4b')
  name: string;
  // No user settings, emojis, colors, etc.
}

/**
 * User-configured model (inactive, available for activation)
 */
export interface ConfiguredModel {
  id: string; // Must be original model ID (no hash) - enforced by validation
  name: string;
  emoji: string;
  color: string;
  type: 'local' | 'api';
  active: false; // Must be false - enforced by validation
  provider?: string;
  settings: ModelSettings;
  // baseModelId intentionally omitted - not needed for configured models
}

/**
 * Active model (currently in use as pill)
 */
export interface ActiveModel {
  id: string; // Must be hashed model ID - enforced by validation
  baseModelId: string; // Required - original model ID for API calls
  name: string;
  emoji: string;
  color: string;
  type: 'local' | 'api';
  active: true; // Must be true - enforced by validation
  provider?: string;
  settings: ModelSettings;
}

/**
 * Legacy ModelInfo for backward compatibility
 * @deprecated Use ConfiguredModel or ActiveModel instead
 */
export type ModelInfo = ConfiguredModel | ActiveModel;

export interface ModelSettings {
  temperature: number;
  systemPrompt: string;
  topP?: number;
  maxTokens?: number;
  apiKey?: string;
  endpoint?: string;
}

// Zod schemas with strict validation
export const DiscoveredModelSchema = z.object({
  id: z.string().refine((id) => !id.includes(':hash:'), {
    message: 'Discovered models cannot have hashed IDs',
  }),
  name: z.string(),
});

export const ConfiguredModelSchema = z.object({
  id: z.string().refine(
    (id) => {
      // Must not be a hashed ID (no hash suffix)
      const parts = id.split(':');
      if (parts.length <= 2) return true;
      const lastPart = parts[parts.length - 1];
      return !/^[a-z0-9]{8}$/.test(lastPart);
    },
    {
      message:
        'Configured models cannot have hashed IDs - use baseModelId for active models',
    }
  ),
  name: z.string(),
  emoji: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  type: z.enum(['local', 'api']),
  active: z.literal(false), // Must be false
  provider: z.string().optional(),
  settings: z.object({
    temperature: z.number().min(0).max(2),
    systemPrompt: z.string(),
    topP: z.number().min(0).max(1).optional(),
    maxTokens: z.number().positive().optional(),
    apiKey: z.string().optional(),
    endpoint: z.string().optional(),
  }),
  // baseModelId intentionally omitted from schema
});

export const ActiveModelSchema = z.object({
  id: z.string().refine(
    (id) => {
      // Must be a hashed ID (has hash suffix)
      const parts = id.split(':');
      if (parts.length <= 2) return false;
      const lastPart = parts[parts.length - 1];
      return /^[a-z0-9]{8}$/.test(lastPart);
    },
    {
      message: 'Active models must have hashed IDs',
    }
  ),
  baseModelId: z.string(), // Required for API calls
  name: z.string(),
  emoji: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  type: z.enum(['local', 'api']),
  active: z.literal(true), // Must be true
  provider: z.string().optional(),
  settings: z.object({
    temperature: z.number().min(0).max(2),
    systemPrompt: z.string(),
    topP: z.number().min(0).max(1).optional(),
    maxTokens: z.number().positive().optional(),
    apiKey: z.string().optional(),
    endpoint: z.string().optional(),
  }),
});

// Validation functions that throw runtime exceptions
export function validateDiscoveredModel(data: unknown): DiscoveredModel {
  try {
    return DiscoveredModelSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid discovered model: ${error}`);
  }
}

export function validateConfiguredModel(data: unknown): ConfiguredModel {
  try {
    return ConfiguredModelSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid configured model: ${error}`);
  }
}

export function validateActiveModel(data: unknown): ActiveModel {
  try {
    return ActiveModelSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid active model: ${error}`);
  }
}

// Type guards
export function isActiveModel(model: ModelInfo): model is ActiveModel {
  return model.active === true && 'baseModelId' in model;
}

export function isConfiguredModel(model: ModelInfo): model is ConfiguredModel {
  return model.active === false && !('baseModelId' in model);
}

// Storage types
export interface ModelStorage {
  configured: ConfiguredModel[]; // Inactive models with original IDs
  active: ActiveModel[]; // Active models with hashed IDs (max 3)
}

export const ModelStorageSchema = z.object({
  configured: z.array(ConfiguredModelSchema),
  active: z.array(ActiveModelSchema).max(3, 'Maximum 3 active models allowed'),
});

// Model lifecycle operations
export interface ModelOperations {
  // Convert discovered model to configured model with user settings
  configureModel(
    discovered: DiscoveredModel,
    settings: Partial<ModelSettings>
  ): ConfiguredModel;

  // Activate a configured model (generates hashed ID)
  activateModel(configured: ConfiguredModel): ActiveModel;

  // Deactivate an active model (removes hash, returns to configured)
  deactivateModel(active: ActiveModel): ConfiguredModel;

  // Update settings for any model type
  updateModelSettings<T extends ConfiguredModel | ActiveModel>(
    model: T,
    updates: Partial<ModelSettings>
  ): T;
}

// Validation helpers for arrays
export function validateDiscoveredModels(data: unknown): DiscoveredModel[] {
  return z.array(DiscoveredModelSchema).parse(data);
}

export function validateConfiguredModels(data: unknown): ConfiguredModel[] {
  return z.array(ConfiguredModelSchema).parse(data);
}

export function validateActiveModels(data: unknown): ActiveModel[] {
  const result = z.array(ActiveModelSchema).max(3).parse(data);
  return result;
}

export function validateModelStorage(data: unknown): ModelStorage {
  return ModelStorageSchema.parse(data);
}
