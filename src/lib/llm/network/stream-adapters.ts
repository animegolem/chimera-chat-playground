// Stream adapters for converting between different stream types
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