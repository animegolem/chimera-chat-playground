/**
 * Development logger with toggle for production builds
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.log('Component rendered', props);
 *   logger.error('Failed to fetch', error);
 *   logger.debug('State updated', { old, new });
 */

// Dev flag - can be set via environment variable or browser storage
const IS_DEV = (() => {
  // Check multiple sources for dev mode
  if (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'development'
  ) {
    return true;
  }

  // Check if running in about:debugging (Firefox extension development)
  if (typeof browser !== 'undefined' && browser.runtime?.getManifest) {
    const manifest = browser.runtime.getManifest();
    // Firefox adds this when loading temporary extensions
    if (manifest.applications?.gecko?.id?.includes('@temporary')) {
      return true;
    }
  }

  // Check localStorage for manual override
  if (typeof localStorage !== 'undefined') {
    const devMode = localStorage.getItem('firefox-bootstrap-dev-mode');
    if (devMode === 'true') return true;
    if (devMode === 'false') return false;
  }

  // Default to false in production
  return false;
})();

// Color coding for different log levels
const LOG_STYLES = {
  log: 'color: #8ec07c', // Green
  info: 'color: #83a598', // Blue
  warn: 'color: #fabd2f', // Yellow
  error: 'color: #fb4934', // Red
  debug: 'color: #d3869b', // Purple
  trace: 'color: #928374', // Gray
} as const;

type LogLevel = keyof typeof LOG_STYLES;

class Logger {
  private enabled: boolean;
  private prefix: string;

  constructor(
    enabled: boolean = IS_DEV,
    prefix: string = '[Firefox Bootstrap]'
  ) {
    this.enabled = enabled;
    this.prefix = prefix;
  }

  /**
   * Enable or disable logging at runtime
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('firefox-bootstrap-dev-mode', enabled.toString());
    }
    this.info(`Logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if logging is currently enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Create a scoped logger with a specific prefix
   */
  scope(scopeName: string): Logger {
    return new Logger(this.enabled, `${this.prefix} [${scopeName}]`);
  }

  /**
   * Generic log method
   */
  private _log(level: LogLevel, ...args: any[]): void {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const style = LOG_STYLES[level];

    // Use the appropriate console method
    const consoleMethod = console[level] || console.log;

    // Format with timestamp and styling
    consoleMethod(`%c${timestamp} ${this.prefix}`, style, ...args);
  }

  /**
   * Standard log levels
   */
  log(...args: any[]): void {
    this._log('log', ...args);
  }

  info(...args: any[]): void {
    this._log('info', ...args);
  }

  warn(...args: any[]): void {
    this._log('warn', ...args);
  }

  error(...args: any[]): void {
    this._log('error', ...args);
  }

  debug(...args: any[]): void {
    this._log('debug', ...args);
  }

  trace(...args: any[]): void {
    this._log('trace', ...args);
  }

  /**
   * Group related logs together
   */
  group(label: string, collapsed: boolean = true): void {
    if (!this.enabled) return;

    const groupMethod = collapsed ? console.groupCollapsed : console.group;
    groupMethod(`%c${this.prefix} ${label}`, LOG_STYLES.info);
  }

  groupEnd(): void {
    if (!this.enabled) return;
    console.groupEnd();
  }

  /**
   * Timing utilities
   */
  time(label: string): void {
    if (!this.enabled) return;
    console.time(`${this.prefix} ${label}`);
  }

  timeEnd(label: string): void {
    if (!this.enabled) return;
    console.timeEnd(`${this.prefix} ${label}`);
  }

  /**
   * Table display for structured data
   */
  table(data: any, columns?: string[]): void {
    if (!this.enabled) return;
    console.table(data, columns);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for creating scoped loggers
export { Logger };

// Helper to toggle dev mode from console
if (typeof window !== 'undefined') {
  (window as any).toggleDevMode = (enabled?: boolean) => {
    const newState = enabled !== undefined ? enabled : !logger.isEnabled();
    logger.setEnabled(newState);
    console.log(
      `🔧 Dev mode ${newState ? 'enabled' : 'disabled'}. Refresh to see changes.`
    );
    return newState;
  };

  // Log initial state
  if (IS_DEV) {
    console.log('🔧 Dev mode enabled. Use window.toggleDevMode() to toggle.');
  }
}
