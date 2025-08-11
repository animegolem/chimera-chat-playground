// Network data parsers for various streaming formats
import { logger } from '@/lib/logger';

export interface SSEEvent {
  event?: string;
  data: string;
  id?: string;
}

/**
 * Parse Server-Sent Events (SSE) format commonly used by LLM APIs
 */
export function parseSSE(data: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const lines = data.split('\n');

  let currentEvent: SSEEvent = { data: '' };

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine === '') {
      // Empty line indicates end of event
      if (currentEvent.data) {
        events.push(currentEvent);
        currentEvent = { data: '' };
      }
      continue;
    }

    if (trimmedLine.startsWith('data: ')) {
      const data = trimmedLine.slice(6);
      currentEvent.data += (currentEvent.data ? '\n' : '') + data;
    } else if (trimmedLine.startsWith('event: ')) {
      currentEvent.event = trimmedLine.slice(7);
    } else if (trimmedLine.startsWith('id: ')) {
      currentEvent.id = trimmedLine.slice(4);
    }
  }

  // Handle final event if no trailing newline
  if (currentEvent.data) {
    events.push(currentEvent);
  }

  return events;
}

/**
 * Parse JSONL (JSON Lines) format used by some streaming APIs
 */
export function parseJSONL<T = Record<string, unknown>>(data: string): T[] {
  const results: T[] = [];
  const lines = data.split('\n').filter((line) => line.trim());

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as T;
      results.push(parsed);
    } catch (error) {
      logger.warn('Failed to parse JSONL line:', line, error);
    }
  }

  return results;
}

/**
 * Parse chunked text data with line-based separation
 */
export function parseChunkedText(data: string): string[] {
  return data
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}