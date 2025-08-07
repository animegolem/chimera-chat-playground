/**
 * RichMessageContent - Component for rendering AI responses with rich formatting
 * IAC-113: Secure markdown-to-HTML conversion with gruvbox styling + Shiki highlighting
 */
import React, { useState, useEffect } from 'react';
import { sanitizer } from '@/sidebar/utils/sanitizer';

interface RichMessageContentProps {
  content: string;
  className?: string;
}

/**
 * Renders AI response content with rich markdown formatting and Shiki code highlighting
 * Uses async ContentSanitizer for proper Shiki syntax highlighting
 */
export function RichMessageContent({ content, className = '' }: RichMessageContentProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    async function processContent() {
      try {
        setIsLoading(true);
        // Use async version for proper Shiki highlighting
        const html = await sanitizer.sanitizeAIResponseAsync(content);
        
        if (!isCancelled) {
          setSanitizedHtml(html);
        }
      } catch (error) {
        console.warn('Async processing failed, falling back to sync:', error);
        if (!isCancelled) {
          // Fallback to sync version
          const fallbackHtml = sanitizer.sanitizeAIResponse(content);
          setSanitizedHtml(fallbackHtml);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    processContent();

    return () => {
      isCancelled = true;
    };
  }, [content]);

  if (isLoading) {
    return (
      <div className={`rich-message-content prose prose-invert max-w-none ${className}`}>
        <div className="text-gruv-medium animate-pulse">Processing...</div>
      </div>
    );
  }

  return (
    <div
      className={`rich-message-content prose prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

// CSS classes are applied via globals.css to maintain consistency with LexicalEditor styling