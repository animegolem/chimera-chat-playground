import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Ollama API Response Schemas
 * Runtime validation for external API responses
 */

// Model info from /api/tags
export const OllamaModelSchema = z.object({
  name: z.string(),
  model: z.string().optional(),
  modified_at: z.string().optional(),
  size: z.number().optional(),
  digest: z.string().optional(),
  details: z
    .object({
      parent_model: z.string().optional(),
      format: z.string().optional(),
      family: z.string().optional(),
      families: z.array(z.string()).optional(),
      parameter_size: z.string().optional(),
      quantization_level: z.string().optional(),
    })
    .optional(),
});

// Response from /api/tags
export const OllamaTagsResponseSchema = z.object({
  models: z.array(OllamaModelSchema),
});

// Chat message format
export const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
  timestamp: z.number().optional(),
});

// Chat request to Ollama
export const OllamaChatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(ChatMessageSchema),
  stream: z.boolean().default(false),
  options: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      num_predict: z.number().positive().optional(),
      top_p: z.number().min(0).max(1).optional(),
      top_k: z.number().positive().optional(),
      seed: z.number().optional(),
    })
    .optional(),
});

// Chat response from Ollama
export const OllamaChatResponseSchema = z
  .object({
    model: z.string(),
    created_at: z.string().optional(),
    message: z.object({
      role: z.enum(['assistant', 'user', 'system']), // More flexible role handling
      content: z.string(),
    }),
    done: z.boolean().optional(),
    done_reason: z.string().optional(), // Added done_reason field
    total_duration: z.number().optional(),
    load_duration: z.number().optional(),
    prompt_eval_count: z.number().optional(),
    prompt_eval_duration: z.number().optional(),
    eval_count: z.number().optional(),
    eval_duration: z.number().optional(),
  })
  .passthrough(); // Allow additional fields that we don't know about

// Type exports
export type OllamaModel = z.infer<typeof OllamaModelSchema>;
export type OllamaTagsResponse = z.infer<typeof OllamaTagsResponseSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type OllamaChatRequest = z.infer<typeof OllamaChatRequestSchema>;
export type OllamaChatResponse = z.infer<typeof OllamaChatResponseSchema>;

// Validation helpers with better error messages
export function validateOllamaTagsResponse(data: unknown) {
  try {
    return OllamaTagsResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      throw new Error(`Invalid Ollama tags response: ${issues.join(', ')}`);
    }
    throw error;
  }
}

export function validateOllamaChatResponse(data: unknown) {
  try {
    return OllamaChatResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      const errorMsg = `Invalid Ollama chat response: ${issues.join(', ')}`;
      logger.error('Ollama response validation error:', errorMsg);
      logger.error('Raw data:', data);
      throw new Error(errorMsg);
    }
    throw error;
  }
}
