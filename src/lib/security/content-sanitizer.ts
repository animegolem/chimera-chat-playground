/**
 * Main content sanitizer class - refactored from monolithic sanitizer.ts
 * Based on GraphIAC ContentSanitizer for secure LLM output rendering
 */
import DOMPurify from 'dompurify';
import { logger } from '@/lib/logger';
import { configureDOMPurify, getDOMPurifyConfig } from './dom-purify-config';
import { processMarkdown, processMarkdownAsync } from './markdown-processor';
import { escapeHtml } from './validators';

/**
 * Content sanitization utility for AI responses
 */
export class ContentSanitizer {
  private static instance: ContentSanitizer;

  private constructor() {
    if (typeof window !== 'undefined') {
      configureDOMPurify();
    }
  }

  static getInstance(): ContentSanitizer {
    if (!ContentSanitizer.instance) {
      ContentSanitizer.instance = new ContentSanitizer();
    }
    return ContentSanitizer.instance;
  }

  /**
   * Sanitize AI response content using marked + DOMPurify pipeline
   */
  sanitizeAIResponse(content: string): string {
    if (typeof content !== 'string') {
      logger.error('Content must be string, received:', typeof content);
      return '';
    }

    try {
      // Step 1: Process markdown to HTML with marked
      const htmlContent = processMarkdown(content);

      // Step 2: Sanitize HTML with DOMPurify
      const sanitized = DOMPurify.sanitize(htmlContent, getDOMPurifyConfig());

      return sanitized;
    } catch (error) {
      logger.error('Error sanitizing content:', error);
      return escapeHtml(content);
    }
  }

  /**
   * Async version with proper Shiki highlighting
   */
  async sanitizeAIResponseAsync(content: string): Promise<string> {
    if (typeof content !== 'string') {
      logger.error('Content must be string, received:', typeof content);
      return '';
    }

    try {
      // Step 1: Process markdown to HTML with async Shiki support
      const htmlContent = await processMarkdownAsync(content);

      // Step 2: Sanitize HTML with DOMPurify
      const sanitized = DOMPurify.sanitize(htmlContent, getDOMPurifyConfig());

      return sanitized;
    } catch (error) {
      logger.error('Error sanitizing content:', error);
      return escapeHtml(content);
    }
  }
}

// Export singleton instance
export const sanitizer = ContentSanitizer.getInstance();
