// Configuration Service - Manages LLM manager configuration
import { LLMManagerConfig } from '../types';

export class ConfigService {
  private config: LLMManagerConfig = {
    retryAttempts: 3,
    timeout: 30000, // 30 seconds
    enableFallback: true,
  };

  /**
   * Configure the manager
   */
  configure(config: Partial<LLMManagerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): LLMManagerConfig {
    return { ...this.config };
  }

  /**
   * Get specific config value
   */
  getTimeout(): number {
    return this.config.timeout || 30000;
  }

  /**
   * Get retry attempts
   */
  getRetryAttempts(): number {
    return this.config.retryAttempts || 3;
  }

  /**
   * Check if fallback is enabled
   */
  isFallbackEnabled(): boolean {
    return this.config.enableFallback !== false;
  }
}