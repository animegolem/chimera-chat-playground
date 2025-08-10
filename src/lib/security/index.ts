/**
 * Security module exports
 * Provides a clean API for content sanitization and security utilities
 */

// Main sanitizer class and instance
export { ContentSanitizer, sanitizer } from './content-sanitizer';

// Configuration
export { SECURITY_CONFIG } from './config';

// Validation utilities
export {
  validateUrl,
  validateImageUrl,
  validateLanguage,
  escapeHtml,
} from './validators';

// Code highlighting
export {
  renderCodeWithShiki,
  renderCodeWithFallback,
  preprocessCodeBlocks,
} from './code-highlighter';

// Markdown processing
export {
  processMarkdown,
  processMarkdownAsync,
  preprocessHighlights,
} from './markdown-processor';

// Types
export type {
  SanitizerConfig,
  CodeRenderOptions,
  ValidationResult,
} from './types';
