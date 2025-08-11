import { z } from 'zod';
import { logger } from '@/lib/logger';
import { ModelInfoSchema, ChatSessionSchema } from './models';

/**
 * Browser Storage Schemas
 * Runtime validation for persisted data
 */

// Storage keys as const for type safety
export const STORAGE_KEYS = {
  MODELS: 'firefox-bootstrap-models',
  SESSIONS: 'firefox-bootstrap-sessions',
  CURRENT_SESSION_ID: 'firefox-bootstrap-current-session',
  PREFERENCES: 'firefox-bootstrap-preferences',
} as const;

// User preferences schema
export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('dark'),
  sidebarWidth: z.number().min(200).max(800).default(400),
  fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
  autoSave: z.boolean().default(true),
  debugMode: z.boolean().default(false),
  modelDefaults: z
    .object({
      temperature: z.number().min(0).max(2).default(0.7),
      maxTokens: z.number().positive().default(2048),
    })
    .optional(),
});

// Storage data schema - what we save to browser.storage.local
export const StorageDataSchema = z.object({
  [STORAGE_KEYS.MODELS]: z.array(ModelInfoSchema).optional(),
  [STORAGE_KEYS.SESSIONS]: z.array(ChatSessionSchema).optional(),
  [STORAGE_KEYS.CURRENT_SESSION_ID]: z.string().optional(),
  [STORAGE_KEYS.PREFERENCES]: UserPreferencesSchema.optional(),
});

// Type exports
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type StorageData = z.infer<typeof StorageDataSchema>;
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// Validation helpers for storage operations
export function validateStoredModels(data: unknown) {
  try {
    // Handle undefined/null as empty array
    if (!data) return [];
    
    // Try to parse with strict validation first
    return z.array(ModelInfoSchema).parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Migration: try to fix invalid models instead of throwing
      logger.warn('Found invalid models in storage, attempting migration:', error.issues);
      
      if (Array.isArray(data)) {
        const migratedModels = data.map((model: Record<string, unknown>) => {
          if (typeof model === 'object' && model !== null) {
            // Migrate old model format to new schema
            return {
              id: model.id || 'unknown',
              name: model.name || model.id || 'Unknown Model',
              emoji: model.emoji || '🤖',
              color: model.color || '#8ec07c', // Default gruvbox green
              type: model.type || 'local',
              active: Boolean(model.active),
              settings: {
                temperature: (model.settings as Record<string, unknown>)?.temperature as number ?? 0.7,
                systemPrompt: (model.settings as Record<string, unknown>)?.systemPrompt as string ?? 'You are a helpful AI assistant.',
                endpoint: (model.settings as Record<string, unknown>)?.endpoint as string ?? 'http://localhost:11434',
                maxTokens: (model.settings as Record<string, unknown>)?.maxTokens as number ?? 2048,
              },
              provider: model.provider || 'ollama',
            };
          }
          return null;
        }).filter(Boolean);
        
        // Validate the migrated models
        try {
          return z.array(ModelInfoSchema).parse(migratedModels);
        } catch (migrationError) {
          logger.error('Model migration failed:', migrationError);
          return []; // Return empty array if migration fails
        }
      }
      
      // If it's not an array or migration fails, return empty array
      logger.warn('Could not migrate invalid models, returning empty array');
      return [];
    }
    throw error;
  }
}

export function validateStoredSessions(data: unknown) {
  try {
    // Handle undefined/null as empty array
    if (!data) return [];
    return z.array(ChatSessionSchema).parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      throw new Error(`Invalid stored sessions: ${issues.join(', ')}`);
    }
    throw error;
  }
}

export function validateStoredPreferences(data: unknown) {
  try {
    // Use defaults if not present
    if (!data) return UserPreferencesSchema.parse({});
    return UserPreferencesSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      throw new Error(`Invalid stored preferences: ${issues.join(', ')}`);
    }
    throw error;
  }
}

// Safe storage read with validation
export async function safeStorageGet<K extends StorageKey>(
  key: K
): Promise<StorageData[K]> {
  const result = await browser.storage.local.get(key);
  const value = result[key];

  switch (key) {
    case STORAGE_KEYS.MODELS: {
      const validatedModels = validateStoredModels(value);
      // If migration occurred (original data was invalid), save the migrated data
      if (value && Array.isArray(value) && JSON.stringify(value) !== JSON.stringify(validatedModels)) {
        logger.info('Storage migration occurred, saving migrated models');
        await browser.storage.local.set({ [key]: validatedModels });
      }
      return validatedModels as StorageData[K];
    }
    case STORAGE_KEYS.SESSIONS:
      return validateStoredSessions(value) as StorageData[K];
    case STORAGE_KEYS.CURRENT_SESSION_ID:
      return (value || null) as StorageData[K];
    case STORAGE_KEYS.PREFERENCES:
      return validateStoredPreferences(value) as StorageData[K];
    default:
      return value as StorageData[K];
  }
}

// Safe storage write with validation
export async function safeStorageSet<K extends StorageKey>(
  key: K,
  value: StorageData[K]
): Promise<void> {
  // Validate before saving
  switch (key) {
    case STORAGE_KEYS.MODELS:
      validateStoredModels(value);
      break;
    case STORAGE_KEYS.SESSIONS:
      validateStoredSessions(value);
      break;
    case STORAGE_KEYS.PREFERENCES:
      validateStoredPreferences(value);
      break;
  }

  await browser.storage.local.set({ [key]: value });
}
