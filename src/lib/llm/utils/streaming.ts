// Legacy re-export for backward compatibility
// All streaming functionality has been moved to ../network/ directory for better organization
export {
  parseSSE,
  parseJSONL,
  createStreamFromAsyncIterable,
  createAsyncIterableFromStream,
  StreamBuffer,
  streamFetch,
  mergeStreamChunks,
  createTimeoutController,
  retryStream,
} from '../network';

// Re-export with type compatibility
export type { SSEEvent as parseSSEResult } from '../network';
