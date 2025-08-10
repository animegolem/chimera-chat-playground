/**
 * URL and content validation utilities
 */
import { SECURITY_CONFIG } from './config';

/**
 * Validate URL for safety
 */
export function validateUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Only allow safe protocols
    if (!SECURITY_CONFIG.ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return '#';
    }

    return url;
  } catch {
    return '#';
  }
}

/**
 * Validate image URL with support for data URLs
 */
export function validateImageUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Only allow HTTPS images
    if (parsed.protocol === 'https:') {
      return url;
    }

    // Allow specific data URL formats for images
    if (parsed.protocol === 'data:' && url.startsWith('data:image/')) {
      const matches = url.match(
        /^data:image\/(png|jpg|jpeg|gif|svg\+xml|webp);base64,/
      );
      if (matches) {
        return url;
      }
    }

    return '';
  } catch {
    return '';
  }
}

/**
 * Validate programming language for code blocks
 */
export function validateLanguage(language: string): string {
  const cleaned = language.toLowerCase().trim();
  return SECURITY_CONFIG.ALLOWED_LANGUAGES.includes(cleaned)
    ? cleaned
    : 'plaintext';
}

/**
 * Escape HTML entities safely
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
