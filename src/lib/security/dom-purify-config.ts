/**
 * DOMPurify configuration and setup
 */
import DOMPurify from 'dompurify';
import { SECURITY_CONFIG } from './config';

/**
 * Configure DOMPurify with security hooks
 */
export function configureDOMPurify(): void {
  if (typeof window === 'undefined') return;

  // Add hook to open links in new window with security attributes
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

/**
 * Get DOMPurify sanitization config
 */
export function getDOMPurifyConfig() {
  return {
    FORBID_TAGS: SECURITY_CONFIG.FORBIDDEN_TAGS,
    FORBID_ATTR: SECURITY_CONFIG.FORBIDDEN_ATTRIBUTES,
  };
}
