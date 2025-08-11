import { z } from 'zod';

/**
 * Model Configuration Schemas
 * Runtime validation for AI model settings
 */

// Model settings schema
export const ModelSettingsSchema = z.object({
  temperature: z.number().min(0).max(2),
  systemPrompt: z.string(),
  topP: z.number().min(0).max(1).optional(),
  maxTokens: z.number().positive().optional(),
  apiKey: z.string().optional(), // For API models
  endpoint: z.string().url().optional(), // For local models
});

// Model info schema
export const ModelInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  emoji: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/), // Hex color validation
  type: z.enum(['local', 'api']),
  active: z.boolean(),
  settings: ModelSettingsSchema,
  provider: z.string().optional(), // e.g., 'ollama', 'openai'
});

// Message with model info
export const MessageSchema = z.object({
  id: z.string(),
  type: z.enum(['user', 'ai']),
  content: z.string(),
  timestamp: z.number(),
  updatedAt: z.number().optional(),
  model: ModelInfoSchema.optional(),
});

// Chat session schema
export const ChatSessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  messages: z.array(MessageSchema),
  models: z.array(ModelInfoSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// App state schema
export const AppStateSchema = z.object({
  currentSession: ChatSessionSchema.nullable(),
  sessions: z.array(ChatSessionSchema),
  models: z.array(ModelInfoSchema),
  activeModelIds: z.array(z.string()),
  modelColors: z.record(z.string(), z.string()),
  activeModels: z.array(z.string()), // Legacy field
  currentSelection: z
    .object({
      text: z.string(),
      url: z.string(),
      title: z.string(),
      timestamp: z.number(),
    })
    .nullable(),
  highlightedLines: z.number(),
  sidebarOpen: z.boolean(),
});

// Type exports
export type ModelSettings = z.infer<typeof ModelSettingsSchema>;
export type ModelInfo = z.infer<typeof ModelInfoSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;
export type AppState = z.infer<typeof AppStateSchema>;

// Validation helpers
export function validateModelInfo(data: unknown): ModelInfo {
  try {
    return ModelInfoSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      throw new Error(`Invalid model info: ${issues.join(', ')}`);
    }
    throw error;
  }
}

export function validateChatSession(data: unknown): ChatSession {
  try {
    return ChatSessionSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      throw new Error(`Invalid chat session: ${issues.join(', ')}`);
    }
    throw error;
  }
}

export function validateModelsArray(data: unknown): ModelInfo[] {
  try {
    return z.array(ModelInfoSchema).parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      throw new Error(`Invalid models array: ${issues.join(', ')}`);
    }
    throw error;
  }
}
