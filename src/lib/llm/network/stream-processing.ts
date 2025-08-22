// Stream processing utilities for merging and manipulating chunks
import { StreamChunk, LLMError } from '../types';
import { logger } from '@/lib/logger';

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
 * Filter stream chunks based on content or metadata
 */
export function filterStreamChunks(
  chunks: StreamChunk[],
  filter: (chunk: StreamChunk) => boolean
): StreamChunk[] {
  return chunks.filter(filter);
}

/**
 * Transform stream chunks with a mapping function
 */
export function transformStreamChunks<T>(
  chunks: StreamChunk[],
  transform: (chunk: StreamChunk) => T
): T[] {
  return chunks.map(transform);
}

/**
 * Create a stream chunk processor with customizable processing logic
 */
export class StreamProcessor {
  private chunks: StreamChunk[] = [];

  constructor(
    private processingOptions: {
      bufferSize?: number;
      mergeOverlapping?: boolean;
      filterEmpty?: boolean;
    } = {}
  ) {}

  /**
   * Add a chunk to the processor
   */
  addChunk(chunk: StreamChunk): StreamChunk[] {
    this.chunks.push(chunk);

    // Apply filtering if enabled
    if (this.processingOptions.filterEmpty) {
      this.chunks = this.chunks.filter((c) => c.content.trim().length > 0);
    }

    // Merge overlapping content if enabled
    if (this.processingOptions.mergeOverlapping && this.chunks.length > 1) {
      const merged = mergeStreamChunks(this.chunks);
      this.chunks = [merged];
    }

    // Return processed chunks
    const bufferSize = this.processingOptions.bufferSize;
    if (bufferSize && this.chunks.length >= bufferSize) {
      const result = [...this.chunks];
      this.chunks = [];
      return result;
    }

    return chunk.done ? this.flush() : [];
  }

  /**
   * Flush all remaining chunks
   */
  flush(): StreamChunk[] {
    const result = [...this.chunks];
    this.chunks = [];
    return result;
  }

  /**
   * Get current buffer status
   */
  getBufferInfo(): { count: number; totalLength: number } {
    return {
      count: this.chunks.length,
      totalLength: this.chunks.reduce(
        (sum, chunk) => sum + chunk.content.length,
        0
      ),
    };
  }
}
