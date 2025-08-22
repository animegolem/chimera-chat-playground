// HTTP client with streaming support and error handling
import { LLMError, LLMErrorCode } from '../types';

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
 * Standard HTTP client with error handling
 */
export class HttpClient {
  constructor(
    private defaultHeaders: Record<string, string> = {},
    private timeoutMs: number = 30000
  ) {}

  /**
   * Make a standard HTTP request
   */
  async request<T>(
    url: string,
    options: RequestInit & { providerId?: string } = {}
  ): Promise<T> {
    const { providerId = 'http-client', ...fetchOptions } = options;

    const controller = createTimeoutController(this.timeoutMs);

    const requestOptions: RequestInit = {
      ...fetchOptions,
      headers: {
        ...this.defaultHeaders,
        ...fetchOptions.headers,
      },
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        throw new LLMError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status >= 500
            ? LLMErrorCode.CONNECTION_FAILED
            : LLMErrorCode.UNKNOWN,
          providerId
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }

      throw new LLMError(
        `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        LLMErrorCode.CONNECTION_FAILED,
        providerId,
        true,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create a streaming request
   */
  stream(
    url: string,
    options: RequestInit & { providerId?: string } = {}
  ): AsyncIterableIterator<string> {
    const { providerId = 'http-client', ...fetchOptions } = options;

    const requestOptions: RequestInit = {
      ...fetchOptions,
      headers: {
        ...this.defaultHeaders,
        ...fetchOptions.headers,
      },
    };

    return streamFetch(url, requestOptions, providerId);
  }
}
