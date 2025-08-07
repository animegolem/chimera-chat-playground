import DOMPurify from 'dompurify';
import { marked, Renderer } from 'marked';

/**
 * Content sanitization utility for AI responses
 * Based on GraphIAC ContentSanitizer for secure LLM output rendering
 */
export class ContentSanitizer {
  private static instance: ContentSanitizer;

  private readonly allowedTags = [
    'p',
    'br',
    'strong',
    'em',
    'code',
    'pre',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'a',
    'span',
  ];

  private readonly allowedAttributes = {
    a: ['href', 'title'],
    code: ['class'],
    pre: ['class'],
    span: ['class'],
  };

  private constructor() {
    if (typeof window !== 'undefined') {
      this.configureDOMPurify();
    }
  }

  static getInstance(): ContentSanitizer {
    if (!ContentSanitizer.instance) {
      ContentSanitizer.instance = new ContentSanitizer();
    }
    return ContentSanitizer.instance;
  }

  private configureDOMPurify() {
    // Add hook to open links in new window
    DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  /**
   * Sanitize AI response content using marked + DOMPurify pipeline
   */
  sanitizeAIResponse(content: string): string {
    if (typeof content !== 'string') {
      console.error('Content must be string, received:', typeof content);
      return '';
    }

    try {
      // Step 1: Process markdown to HTML with marked
      const htmlContent = this.processMarkdown(content);

      // Step 2: Sanitize HTML with DOMPurify - simplified config
      const sanitized = DOMPurify.sanitize(htmlContent, {
        FORBID_TAGS: [
          'script',
          'object',
          'embed',
          'iframe',
          'form',
          'input',
          'style',
        ],
        FORBID_ATTR: [
          'onerror',
          'onload',
          'onclick',
          'onmouseover',
          'onfocus',
          'onblur',
          'onchange',
          'onsubmit',
        ],
      });

      return sanitized;
    } catch (error) {
      console.error('Error sanitizing content:', error);
      return this.escapeHtml(content);
    }
  }

  /**
   * Process markdown to HTML with secure renderer
   */
  private processMarkdown(content: string): string {
    const renderer = this.createSecureRenderer();

    return marked(content, {
      renderer,
      gfm: true,
      breaks: true,
      pedantic: false,
    }) as string;
  }

  /**
   * Create secure markdown renderer
   */
  private createSecureRenderer(): Renderer {
    const renderer = new Renderer();

    // Override link rendering to validate URLs
    renderer.link = ({ href, title, tokens }) => {
      const safeHref = this.validateUrl(href);
      const safeTitle = this.escapeHtml(title || '');
      const safeText = this.escapeHtml(
        tokens.map((t) => ('raw' in t ? t.raw : '')).join('')
      );

      return `<a href="${safeHref}" title="${safeTitle}">${safeText}</a>`;
    };

    // Override image rendering to use safe sources only
    renderer.image = ({ href, title, text }) => {
      const safeHref = this.validateImageUrl(href);
      const safeTitle = this.escapeHtml(title || '');
      const safeText = this.escapeHtml(text);

      if (!safeHref) {
        return `[${safeText}]`;
      }

      return `<img src="${safeHref}" alt="${safeText}" title="${safeTitle}" loading="lazy">`;
    };

    // Override code block rendering to prevent injection
    renderer.code = ({ text, lang }) => {
      const safeCode = this.escapeHtml(text);
      const safeLanguage = lang ? this.validateLanguage(lang) : '';

      return `<pre><code class="language-${safeLanguage}">${safeCode}</code></pre>`;
    };

    // Override inline code rendering
    renderer.codespan = ({ text }) => {
      const safeCode = this.escapeHtml(text);
      return `<code>${safeCode}</code>`;
    };

    return renderer;
  }

  /**
   * Validate URL for safety
   */
  private validateUrl(url: string): string {
    try {
      const parsed = new URL(url);

      // Only allow safe protocols
      if (!['https:', 'http:', 'mailto:'].includes(parsed.protocol)) {
        return '#';
      }

      return url;
    } catch {
      return '#';
    }
  }

  /**
   * Validate image URL
   */
  private validateImageUrl(url: string): string {
    try {
      const parsed = new URL(url);

      // Only allow HTTPS images or data URLs
      if (parsed.protocol === 'https:') {
        return url;
      }

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
   * Validate language for code blocks
   */
  private validateLanguage(language: string): string {
    const allowedLanguages = [
      'javascript',
      'typescript',
      'python',
      'java',
      'cpp',
      'c',
      'csharp',
      'go',
      'rust',
      'ruby',
      'php',
      'swift',
      'kotlin',
      'html',
      'css',
      'scss',
      'json',
      'xml',
      'yaml',
      'markdown',
      'bash',
      'shell',
      'powershell',
      'sql',
      'graphql',
      'dockerfile',
    ];

    const cleaned = language.toLowerCase().trim();
    return allowedLanguages.includes(cleaned) ? cleaned : 'plaintext';
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export singleton instance
export const sanitizer = ContentSanitizer.getInstance();
