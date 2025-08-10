/**
 * Security-related type definitions
 */

export interface SanitizerConfig {
  allowedTags: string[];
  allowedAttributes: Record<string, string[]>;
  forbiddenTags: string[];
  forbiddenAttributes: string[];
}

export interface CodeRenderOptions {
  language: string;
  theme: string;
  fallbackEnabled: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  warnings: string[];
}
