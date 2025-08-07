/**
 * RichMessageContent - Component for rendering AI responses with rich formatting
 * IAC-113: Secure markdown-to-HTML conversion with gruvbox styling + Shiki highlighting
 */
import React, { useState, useEffect, useRef } from 'react';
import { sanitizer } from '@/sidebar/utils/sanitizer';
import { useApp } from '@/sidebar/contexts/AppContext';

interface RichMessageContentProps {
  content: string;
  className?: string;
}

/**
 * Renders AI response content with rich markdown formatting and Shiki code highlighting
 * Uses async ContentSanitizer for proper Shiki syntax highlighting
 */
export function RichMessageContent({ content, className = '' }: RichMessageContentProps) {
  const { actions } = useApp();
  const [sanitizedHtml, setSanitizedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const contentRef = useRef<HTMLDivElement>(null);

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

  // Add copy buttons to code blocks after content is rendered
  useEffect(() => {
    if (!contentRef.current || isLoading) return;

    const codeBlocks = contentRef.current.querySelectorAll('pre');
    
    codeBlocks.forEach((pre, index) => {
      // Skip if already has copy button
      if (pre.querySelector('.code-copy-btn')) return;

      const codeElement = pre.querySelector('code');
      if (!codeElement) return;

      const copyButton = document.createElement('button');
      copyButton.className = 'code-copy-btn absolute top-2 right-2 text-gruv-medium hover:text-gruv-light p-1 rounded bg-gruv-dark-soft hover:bg-gruv-medium transition-colors opacity-0 group-hover:opacity-100';
      copyButton.innerHTML = '📄'; // Document icon
      copyButton.title = 'Copy code';
      copyButton.style.fontSize = '12px';
      
      copyButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const code = codeElement.textContent || '';
        await actions.copyMessage(code);
        
        // Temporary feedback
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = '✓';
        copyButton.style.color = '#b8bb26';
        setTimeout(() => {
          copyButton.innerHTML = originalText;
          copyButton.style.color = '';
        }, 1000);
      });

      pre.style.position = 'relative';
      pre.classList.add('group');
      pre.appendChild(copyButton);
    });

    // Cleanup function to remove event listeners when component unmounts
    return () => {
      const codeBlocks = contentRef.current?.querySelectorAll('pre');
      codeBlocks?.forEach((pre) => {
        const copyBtn = pre.querySelector('.code-copy-btn');
        if (copyBtn) {
          copyBtn.remove();
        }
      });
    };
  }, [sanitizedHtml, isLoading, actions]);

  if (isLoading) {
    return (
      <div className={`rich-message-content prose prose-invert max-w-none ${className}`}>
        <div className="text-gruv-medium animate-pulse">Processing...</div>
      </div>
    );
  }

  return (
    <div
      ref={contentRef}
      className={`rich-message-content prose prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

// CSS classes are applied via globals.css to maintain consistency with LexicalEditor styling