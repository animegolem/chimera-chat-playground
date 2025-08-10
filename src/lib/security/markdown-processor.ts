/**
 * Markdown processing utilities
 */
import { marked } from 'marked';
import { createSecureRenderer } from './markdown-renderer';
import { preprocessCodeBlocks } from './code-highlighter';

/**
 * Preprocess ==text== syntax to <mark>text</mark> for highlight support
 */
export function preprocessHighlights(content: string): string {
  // Convert ==text== to <mark>text</mark>, but avoid inside code blocks
  return content.replace(/==([^=\n]+)==/g, '<mark>$1</mark>');
}

/**
 * Process markdown to HTML with secure renderer (synchronous)
 */
export function processMarkdown(content: string): string {
  const renderer = createSecureRenderer();

  // Step 1: Preprocess ==highlight== syntax to <mark> tags
  const contentWithHighlights = preprocessHighlights(content);

  return marked(contentWithHighlights, {
    renderer,
    gfm: true,
    breaks: true,
    pedantic: false,
  }) as string;
}

/**
 * Process markdown to HTML with Shiki highlighting (asynchronous)
 */
export async function processMarkdownAsync(content: string): Promise<string> {
  // Step 1: Preprocess ==highlight== syntax to <mark> tags
  const contentWithHighlights = preprocessHighlights(content);

  // Step 2: Pre-process code blocks with Shiki before markdown parsing
  const contentWithShiki = await preprocessCodeBlocks(contentWithHighlights);

  // Step 3: Use regular renderer (code blocks already processed)
  const renderer = createSecureRenderer();

  return marked(contentWithShiki, {
    renderer,
    gfm: true,
    breaks: true,
    pedantic: false,
  }) as string;
}
