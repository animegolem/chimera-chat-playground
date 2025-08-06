import TurndownService from 'turndown';

/**
 * HTML to Markdown conversion utility
 * Used for copying rich content as clean markdown
 */
class MarkdownConverter {
  private static instance: MarkdownConverter;
  private turndownService: TurndownService;

  private constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
      fence: '```',
      emDelimiter: '*',
      strongDelimiter: '**',
      linkStyle: 'inlined',
      linkReferenceStyle: 'full',
    });

    // Configure custom rules for better markdown output
    this.configureTurndown();
  }

  static getInstance(): MarkdownConverter {
    if (!MarkdownConverter.instance) {
      MarkdownConverter.instance = new MarkdownConverter();
    }
    return MarkdownConverter.instance;
  }

  private configureTurndown() {
    // Handle code blocks with language preservation
    this.turndownService.addRule('codeBlock', {
      filter: (node) => {
        return node.nodeName === 'PRE' && node.firstChild?.nodeName === 'CODE';
      },
      replacement: (content, node) => {
        const codeNode = node.firstChild as HTMLElement;
        const language = codeNode.className.replace('language-', '') || '';

        return '\n\n```' + language + '\n' + content + '\n```\n\n';
      },
    });

    // Handle inline code
    this.turndownService.addRule('inlineCode', {
      filter: ['code'],
      replacement: (content) => {
        return '`' + content + '`';
      },
    });

    // Handle highlights (from TipTap highlight extension)
    this.turndownService.addRule('highlight', {
      filter: ['mark'],
      replacement: (content) => {
        return '==' + content + '==';
      },
    });
  }

  /**
   * Convert HTML to Markdown
   */
  htmlToMarkdown(html: string): string {
    try {
      return this.turndownService.turndown(html);
    } catch (error) {
      console.error('Error converting HTML to Markdown:', error);
      // Fallback: strip HTML tags and return plain text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      return tempDiv.textContent || tempDiv.innerText || '';
    }
  }

  /**
   * Copy content to clipboard as markdown
   */
  async copyToClipboard(html: string): Promise<boolean> {
    try {
      const markdown = this.htmlToMarkdown(html);
      await navigator.clipboard.writeText(markdown);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }
}

// Export singleton instance
export const converter = MarkdownConverter.getInstance();
