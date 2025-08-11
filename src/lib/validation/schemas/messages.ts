import { z } from 'zod';
import { ModelInfoSchema } from './models';

/**
 * Extension Message Passing Schemas
 * Runtime validation for inter-component messages
 */

// Tab and page info schemas
export const TabInfoSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  url: z.string().optional(),
  hostname: z.string().optional(),
  active: z.boolean(),
});

export const TabGroupInfoSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  tabCount: z.number(),
  tabs: z.array(TabInfoSchema),
});

export const SelectionInfoSchema = z.object({
  text: z.string(),
  url: z.string(),
  title: z.string(),
  timestamp: z.number(),
});

export const PageContentSchema = z.object({
  text: z.string(),
  title: z.string(),
  url: z.string(),
  domain: z.string(),
  timestamp: z.number(),
});

// Background messages
export const BackgroundMessageSchema = z.object({
  type: z.enum([
    'TAB_GROUP_NAMED',
    'TAB_GROUP_CREATED',
    'CONTEXT_MENU_SELECTION',
    'EXTENSION_UPDATED',
    'LLM_RESPONSE',
  ]),
  groupId: z.number().optional(),
  name: z.string().optional(),
  tabCount: z.number().optional(),
  text: z.string().optional(),
  url: z.string().optional(),
  title: z.string().optional(),
  timestamp: z.number().optional(),
});

// Content script messages
export const ContentMessageSchema = z.object({
  type: z.enum([
    'TEXT_SELECTED',
    'TEXT_SELECTION_CLEARED',
    'PAGE_CONTENT_READY',
    'HIGHLIGHT_UPDATED',
  ]),
  text: z.string().optional(),
  url: z.string().optional(),
  title: z.string().optional(),
  timestamp: z.number().optional(),
  content: PageContentSchema.optional(),
  highlightCount: z.number().optional(),
});

// LLM request schema
export const LLMRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
      timestamp: z.number().optional(),
    })
  ),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  systemPrompt: z.string().optional(),
});

// Sidebar messages
export const SidebarMessageSchema = z.object({
  type: z.enum([
    'GET_TAB_GROUPS',
    'RENAME_TAB_GROUP',
    'GET_PAGE_CONTENT',
    'GET_SELECTION',
    'HIGHLIGHT_TEXT',
    'SEND_TO_LLM',
    'LLM_CHAT_REQUEST',
    'UPDATE_MODEL_SETTINGS',
    'TOGGLE_MODEL',
    'DISCOVER_OLLAMA_MODELS',
  ]),
  groupId: z.number().optional(),
  name: z.string().optional(),
  tabId: z.number().optional(),
  searchText: z.string().optional(),
  prompt: z.string().optional(),
  models: z.array(z.string()).optional(),
  includeSelection: z.boolean().optional(),
  includePageContent: z.boolean().optional(),
  llmRequest: LLMRequestSchema.optional(),
  modelId: z.string().optional(),
  modelSettings: ModelInfoSchema.partial().optional(),
});

// Response messages
export const ResponseMessageSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  groups: z.array(TabGroupInfoSchema).optional(),
  selection: SelectionInfoSchema.optional(),
  content: PageContentSchema.optional(),
  highlightCount: z.number().optional(),
  response: z.string().optional(),
  model: z.string().optional(),
  tokenCount: z.number().optional(),
  models: z.array(ModelInfoSchema).optional(), // For DISCOVER_OLLAMA_MODELS
  data: z.unknown().optional(),
});

// Union of all message types
export const ExtensionMessageSchema = z.union([
  BackgroundMessageSchema,
  ContentMessageSchema,
  SidebarMessageSchema,
  ResponseMessageSchema,
]);

// Type exports
export type TabInfo = z.infer<typeof TabInfoSchema>;
export type TabGroupInfo = z.infer<typeof TabGroupInfoSchema>;
export type SelectionInfo = z.infer<typeof SelectionInfoSchema>;
export type PageContent = z.infer<typeof PageContentSchema>;
export type BackgroundMessage = z.infer<typeof BackgroundMessageSchema>;
export type ContentMessage = z.infer<typeof ContentMessageSchema>;
export type SidebarMessage = z.infer<typeof SidebarMessageSchema>;
export type ResponseMessage = z.infer<typeof ResponseMessageSchema>;
export type ExtensionMessage = z.infer<typeof ExtensionMessageSchema>;
export type LLMRequest = z.infer<typeof LLMRequestSchema>;

// Validation helpers
export function validateSidebarMessage(message: unknown): SidebarMessage {
  try {
    return SidebarMessageSchema.parse(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      throw new Error(`Invalid sidebar message: ${issues.join(', ')}`);
    }
    throw error;
  }
}

export function validateResponseMessage(message: unknown): ResponseMessage {
  try {
    return ResponseMessageSchema.parse(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      throw new Error(`Invalid response message: ${issues.join(', ')}`);
    }
    throw error;
  }
}
