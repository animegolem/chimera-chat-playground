/**
 * Secure markdown renderer with custom overrides
 */
import { Renderer } from 'marked';
import {
  validateUrl,
  validateImageUrl,
  validateLanguage,
  escapeHtml,
} from './validators';
import { renderCodeWithFallback } from './code-highlighter';

/**
 * Create secure markdown renderer with safety overrides
 */
export function createSecureRenderer(): Renderer {
  const renderer = new Renderer();

  // Override link rendering to validate URLs
  renderer.link = ({ href, title, tokens }) => {
    const safeHref = validateUrl(href);
    const safeTitle = escapeHtml(title || '');
    const safeText = escapeHtml(
      tokens.map((t) => ('raw' in t ? t.raw : '')).join('')
    );

    return `<a href="${safeHref}" title="${safeTitle}">${safeText}</a>`;
  };

  // Override image rendering to use safe sources only
  renderer.image = ({ href, title, text }) => {
    const safeHref = validateImageUrl(href);
    const safeTitle = escapeHtml(title || '');
    const safeText = escapeHtml(text);

    if (!safeHref) {
      return `[${safeText}]`;
    }

    return `<img src="${safeHref}" alt="${safeText}" title="${safeTitle}" loading="lazy">`;
  };

  // Override code block rendering - use fallback since sync Shiki is not available
  renderer.code = ({ text, lang }) => {
    const safeCode = text;
    const safeLanguage = lang ? validateLanguage(lang) : 'plaintext';

    // Use fallback rendering for sync context (async path handles Shiki properly)
    return renderCodeWithFallback(safeCode, safeLanguage);
  };

  // Override inline code rendering
  renderer.codespan = ({ text }) => {
    const safeCode = escapeHtml(text);
    return `<code>${safeCode}</code>`;
  };

  return renderer;
}
