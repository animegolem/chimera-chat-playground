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

      // Extract language from various possible sources
      let languageAttr = 'text';
      
      // Debug: log element attributes and full HTML
      console.log('Pre element:', pre);
      console.log('Pre outerHTML:', pre.outerHTML);
      console.log('Pre className:', pre.className);
      console.log('Pre data-language:', pre.getAttribute('data-language'));
      console.log('Pre all attributes:', pre.getAttributeNames().map(name => `${name}="${pre.getAttribute(name)}"`));
      console.log('Code element:', codeElement);
      console.log('Code outerHTML:', codeElement.outerHTML);
      console.log('Code className:', codeElement.className);
      console.log('Code data-language:', codeElement.getAttribute('data-language'));
      console.log('Code all attributes:', codeElement.getAttributeNames().map(name => `${name}="${codeElement.getAttribute(name)}"`));
      
      // Enhanced detection methods - try everything possible
      if (pre.getAttribute('data-language')) {
        languageAttr = pre.getAttribute('data-language');
      } else if (codeElement.getAttribute('data-language')) {
        languageAttr = codeElement.getAttribute('data-language');
      } else if (pre.getAttribute('data-lang')) {
        languageAttr = pre.getAttribute('data-lang');
      } else if (codeElement.getAttribute('data-lang')) {
        languageAttr = codeElement.getAttribute('data-lang');
      } else if (codeElement.className.includes('language-')) {
        const match = codeElement.className.match(/language-(\w+)/);
        if (match) languageAttr = match[1];
      } else if (pre.className.includes('language-')) {
        const match = pre.className.match(/language-(\w+)/);
        if (match) languageAttr = match[1];
      } else if (codeElement.className.includes('hljs-')) {
        const match = codeElement.className.match(/hljs-(\w+)/);
        if (match) languageAttr = match[1];
      } else if (pre.className.includes('shiki')) {
        // Look for theme classes that might indicate language
        const match = pre.className.match(/lang-(\w+)/);
        if (match) languageAttr = match[1];
      }
      
      console.log('Final detected language:', languageAttr);
      
      // Create language label (non-interactable, positioned to the left of copy button)
      const languageLabel = document.createElement('span');
      languageLabel.className = 'absolute text-gruv-medium px-3 py-2 rounded bg-gruv-dark-soft opacity-0 group-hover:opacity-100 pointer-events-none';
      languageLabel.textContent = languageAttr;
      languageLabel.style.right = '80px'; // Position to the left of the copy button
      languageLabel.style.top = '14px'; // Fine-tune vertical alignment (top-3 = 12px, so 14px moves it down 2px)
      languageLabel.style.fontSize = '18px';
      languageLabel.style.lineHeight = '1';
      
      // Create copy button (standalone, much larger text)
      const copyButton = document.createElement('button');
      copyButton.className = 'code-copy-btn absolute top-3 right-3 text-gruv-medium hover:text-gruv-light px-3 py-2 rounded bg-gruv-dark-soft hover:bg-gruv-medium transition-colors opacity-0 group-hover:opacity-100';
      copyButton.innerHTML = '⧉';
      copyButton.title = `Copy ${languageAttr} code`;
      copyButton.style.fontSize = '24px';
      copyButton.style.lineHeight = '1';
      
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
      pre.appendChild(languageLabel);
      pre.appendChild(copyButton);
    });

    // Cleanup function to remove event listeners when component unmounts
    return () => {
      const codeBlocks = contentRef.current?.querySelectorAll('pre');
      codeBlocks?.forEach((pre) => {
        const copyBtn = pre.querySelector('.code-copy-btn');
        const langLabel = pre.querySelector('span[class*="pointer-events-none"]');
        if (copyBtn) copyBtn.remove();
        if (langLabel) langLabel.remove();
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