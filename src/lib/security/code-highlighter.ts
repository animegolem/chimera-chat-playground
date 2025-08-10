/**
 * Code highlighting with Shiki integration and fallback
 */
import { codeToHtml } from 'shiki';
import { logger } from '@/lib/logger';
import { escapeHtml } from './validators';

/**
 * Render code with Shiki syntax highlighting using gruvbox theme
 */
export async function renderCodeWithShiki(
  code: string,
  language: string
): Promise<string> {
  try {
    // Use Shiki's codeToHtml for proper syntax highlighting
    const highlightedHtml = await codeToHtml(code.trim(), {
      lang: language,
      theme: 'gruvbox-dark-medium', // Match LexicalEditor theme
    });

    // Add data-language attribute to preserve language info for copy buttons
    const withLanguageAttr = highlightedHtml.replace(
      '<pre class="shiki',
      `<pre data-language="${language}" class="shiki`
    );

    logger.log('Shiki highlighting successful for', language);
    return withLanguageAttr;
  } catch (error) {
    logger.warn('Shiki highlighting failed, using fallback:', error);
    return renderCodeWithFallback(code, language);
  }
}

/**
 * Fallback code rendering for when Shiki is not available
 */
export function renderCodeWithFallback(code: string, language: string): string {
  const escapedCode = escapeHtml(code);
  return `<pre style="background-color: #1d2021; border: 1px solid #504945; border-radius: 4px; color: #b8bb26; font-family: Menlo, Consolas, Monaco, monospace; font-size: 12px; line-height: 1.53; margin: 8px 0; overflow-x: auto; padding: 8px;" data-language="${language}"><code class="language-${language}">${escapedCode}</code></pre>`;
}

/**
 * Preprocess code blocks with Shiki highlighting
 */
export async function preprocessCodeBlocks(content: string): Promise<string> {
  // Find all code blocks with regex
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const matches = [...content.matchAll(codeBlockRegex)];

  if (matches.length === 0) {
    return content;
  }

  let processedContent = content;

  // Process each code block
  for (const match of matches) {
    const [fullMatch, language, code] = match;
    try {
      const highlightedHtml = await renderCodeWithShiki(
        code,
        language || 'plaintext'
      );
      // Replace the markdown code block with the highlighted HTML
      processedContent = processedContent.replace(fullMatch, highlightedHtml);
    } catch (error) {
      logger.warn('Shiki highlighting failed for code block:', error);
      // Keep original markdown if Shiki fails
    }
  }

  return processedContent;
}
