// Streaming utilities for LLM responses
// Common functionality for handling streaming responses across providers

import { StreamChunk, LLMError, LLMErrorCode } from '../types';

/**
 * Parse Server-Sent Events (SSE) format commonly used by LLM APIs
 */
export function parseSSE(
  data: string
): { event?: string; data: string; id?: string }[] {
  const events: { event?: string; data: string; id?: string }[] = [];
  const lines = data.split('\n');

  let currentEvent: { event?: string; data: string; id?: string } = {
    data: '',
  };

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
export function parseJSONL(data: string): any[] {
  const results: any[] = [];
  const lines = data.split('\n').filter((line) => line.trim());

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      results.push(parsed);
    } catch (error) {
      console.warn('Failed to parse JSONL line:', line, error);
    }
  }

  return results;
}

/**
 * Create a readable stream from an async iterable
 */
export function createStreamFromAsyncIterable<T>(
  iterable: AsyncIterable<T>
): ReadableStream<T> {
  const iterator = iterable[Symbol.asyncIterator]();

  return new ReadableStream<T>({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();

        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      }
    },

    async cancel() {
      if (iterator.return) {
        await iterator.return();
      }
    },
  });
}

/**
 * Create an async iterable from a ReadableStream
 */
export async function* createAsyncIterableFromStream<T>(
  stream: ReadableStream<T>
): AsyncIterableIterator<T> {
  const reader = stream.getReader();

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Buffer streaming chunks to reduce UI update frequency
 */
export class StreamBuffer {
  private buffer: string = '';
  private flushTimeout: number | null = null;
  private readonly flushDelay: number;

  constructor(
    private onFlush: (content: string) => void,
    flushDelayMs: number = 50
  ) {
    this.flushDelay = flushDelayMs;
  }

  /**
   * Add content to the buffer
   */
  add(content: string): void {
    this.buffer += content;
    this.scheduleFlush();
  }

  /**
   * Force flush the buffer immediately
   */
  flush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.buffer) {
      this.onFlush(this.buffer);
      this.buffer = '';
    }
  }

  /**
   * Get current buffer content without flushing
   */
  peek(): string {
    return this.buffer;
  }

  /**
   * Clear the buffer without flushing
   */
  clear(): void {
    this.buffer = '';
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }

    this.flushTimeout = window.setTimeout(() => {
      this.flush();
    }, this.flushDelay);
  }
}

/**
 * Handle fetch streaming responses with proper error handling
 */
export async function* streamFetch(
  url: string,
  options: RequestInit,
  providerId: string
): AsyncIterableIterator<string> {
  let response: Response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new LLMError(
      `Network request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      LLMErrorCode.CONNECTION_FAILED,
      providerId,
      true,
      error instanceof Error ? error : undefined
    );
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    // Try to get more detailed error from response body
    try {
      const errorBody = await response.text();
      if (errorBody) {
        errorMessage += ` - ${errorBody}`;
      }
    } catch {
      // Ignore errors reading error body
    }

    const errorCode =
      response.status === 401
        ? LLMErrorCode.AUTH_FAILED
        : response.status === 429
          ? LLMErrorCode.RATE_LIMITED
          : response.status >= 500
            ? LLMErrorCode.CONNECTION_FAILED
            : LLMErrorCode.UNKNOWN;

    throw new LLMError(
      errorMessage,
      errorCode,
      providerId,
      response.status >= 500 || response.status === 429
    );
  }

  if (!response.body) {
    throw new LLMError(
      'Response body is null',
      LLMErrorCode.UNKNOWN,
      providerId
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        yield chunk;
      }
    }
  } catch (error) {
    throw new LLMError(
      `Stream reading failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      LLMErrorCode.CONNECTION_FAILED,
      providerId,
      true,
      error instanceof Error ? error : undefined
    );
  } finally {
    reader.releaseLock();
  }
}

/**
 * Merge multiple stream chunks with content deduplication
 */
export function mergeStreamChunks(chunks: StreamChunk[]): StreamChunk {
  if (chunks.length === 0) {
    return { content: '', done: false };
  }

  if (chunks.length === 1) {
    return chunks[0];
  }

  // Merge content, removing duplicates at boundaries
  let mergedContent = chunks[0].content;

  for (let i = 1; i < chunks.length; i++) {
    const currentContent = chunks[i].content;

    // Find overlap between end of merged content and start of current content
    let overlap = 0;
    const maxOverlap = Math.min(mergedContent.length, currentContent.length);

    for (let j = 1; j <= maxOverlap; j++) {
      const endSlice = mergedContent.slice(-j);
      const startSlice = currentContent.slice(0, j);

      if (endSlice === startSlice) {
        overlap = j;
      }
    }

    // Append non-overlapping part
    mergedContent += currentContent.slice(overlap);
  }

  // Take metadata from the last chunk
  const lastChunk = chunks[chunks.length - 1];

  return {
    content: mergedContent,
    done: lastChunk.done,
    metadata: lastChunk.metadata,
  };
}

/**
 * Create an AbortController that cancels after a timeout
 */
export function createTimeoutController(timeoutMs: number): AbortController {
  const controller = new AbortController();

  setTimeout(() => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  }, timeoutMs);

  return controller;
}

/**
 * Retry a streaming operation with exponential backoff
 */
export async function retryStream<T>(
  operation: () => AsyncIterableIterator<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<AsyncIterableIterator<T>> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Only retry on retryable errors
      if (error instanceof LLMError && !error.retryable) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(
        `Stream attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
        error
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Retry stream failed unexpectedly');
}
