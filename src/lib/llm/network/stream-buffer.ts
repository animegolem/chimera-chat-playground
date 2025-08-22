// Stream buffer for batching streaming updates
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
