import React, { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  ParagraphNode,
} from 'lexical';
import { registerCodeHighlighting, ShikiTokenizer } from '@lexical/code-shiki';
import { CodeNode, $isCodeNode } from '@lexical/code';
import { DRAG_DROP_PASTE } from '@lexical/rich-text';
import { isMimeType, mediaFileReader } from '@lexical/utils';
import { TRANSFORMERS, CODE } from '@lexical/markdown';
import {
  resizeImage,
  ACCEPTABLE_IMAGE_TYPES,
} from '@/sidebar/utils/image-utils';
import { logger } from '@/lib/logger';

// Code highlighting plugin for proper code block support with Shiki
export function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    logger.log('IAC-120: Registering Shiki code highlighting');

    try {
      logger.log(
        'Shiki tokenizer default language:',
        ShikiTokenizer.defaultLanguage
      );
      logger.log('Shiki tokenizer default theme:', ShikiTokenizer.defaultTheme);

      // Create a customized tokenizer with gruvbox-friendly settings
      const customTokenizer = {
        ...ShikiTokenizer,
        defaultTheme: 'gruvbox-dark-medium', // Use a dark theme compatible with our gruvbox styling
        defaultLanguage: 'javascript',
      };

      // All packages are now on stable version 0.34.0
      // This should resolve version compatibility issues
      return registerCodeHighlighting(editor, customTokenizer);
    } catch (error) {
      logger.error('Failed to register Shiki code highlighting:', error);
      // Fallback: continue without syntax highlighting
      return () => {};
    }
  }, [editor]);

  return null;
}

// Smart code block escape plugin - exits on 3+ empty lines
export function CodeBlockEscapePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }

        // Find if we're in a code block
        let node = selection.anchor.getNode();
        let codeBlock: CodeNode | null = null;

        // Walk up the tree to find a CodeNode
        while (node) {
          if ($isCodeNode(node)) {
            codeBlock = node;
            break;
          }
          node = node.getParent();
        }

        if (!codeBlock) {
          return false;
        }

        // Get all children of the code block
        const children = codeBlock.getChildren();
        if (children.length < 3) {
          return false;
        }

        // Count trailing whitespace-only lines
        let emptyLineCount = 0;
        for (let i = children.length - 1; i >= 0; i--) {
          const child = children[i];
          const text = child.getTextContent();
          if (text.trim() === '') {
            emptyLineCount++;
          } else {
            break;
          }
        }

        // Exit code block on 3+ empty lines
        if (emptyLineCount >= 3) {
          // Remove the empty trailing lines
          for (let i = 0; i < emptyLineCount; i++) {
            const lastChild = codeBlock.getLastChild();
            if (lastChild) {
              lastChild.remove();
            }
          }

          // Create a new paragraph after the code block
          const paragraph = $createParagraphNode();
          codeBlock.insertAfter(paragraph);
          paragraph.selectStart();

          return true; // Prevent default enter behavior
        }

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}

// Drag and drop plugin for image handling
export function SimpleDragDropPastePlugin({
  onImageDrop,
}: {
  onImageDrop?: (base64: string, fileName: string) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onImageDrop) return;

    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          const filesResult = await mediaFileReader(
            files,
            [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => Object.values(x))
          );

          for (const { file } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              const resizedBase64 = await resizeImage(file);
              onImageDrop(resizedBase64, file.name);

              // Optional: insert a visual indicator at cursor position
              editor.update(() => {
                const selection = $getSelection();
                if (selection) {
                  selection.insertText(`[Image: ${file.name}] `);
                }
              });
            }
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, onImageDrop]);

  return null;
}

// Debug plugin for markdown transformation (can be disabled in production)
export function MarkdownDebugPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    logger.log('IAC-120: Available markdown transformers:');

    // Filter out the original CODE transformer since we use our custom one
    const filteredTransformers = TRANSFORMERS.filter((t) => t !== CODE);

    filteredTransformers.forEach((transformer, index) => {
      logger.log(
        `  ${index + 1}. ${transformer.type} - ${
          (transformer as any).regExp?.source || 'N/A'
        }`
      );
    });
    logger.log(
      `  Custom HR_TRANSFORMER - ${/^(---|\*\*\*|___)\s?$/.source || 'N/A'}`
    );
    logger.log(
      `  Custom SHIKI_CODE_BLOCK_TRANSFORMER - ${
        /^```([a-z]*)?\s$/.source || 'N/A'
      }`
    );

    // Listen for paragraph transformations
    const unregister = editor.registerNodeTransform(ParagraphNode, (node) => {
      const textContent = node.getTextContent();
      if (textContent.match(/^(#|>|\*|-|\+|1\.|\d+\.|\[\]|\[x\])/)) {
        // logger.log('IAC-120: Potential markdown pattern detected:', textContent.substring(0, 20) + '...');
      }
    });

    return unregister;
  }, [editor]);

  return null;
}

// Plugin to add line numbers to code blocks
export function LineNumberPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const updateLineNumbers = () => {
      const codeBlocks = document.querySelectorAll('.editor-code');

      codeBlocks.forEach((block) => {
        // Count BR tags to determine line numbers
        const brTags = block.querySelectorAll('br').length;

        // Check if the last character is a BR tag (empty line at end)
        const lastChild = block.lastChild;
        const endsWithEmptyBR = lastChild && lastChild.nodeName === 'BR';

        // Line count is BR count + 1, unless ending with empty BR
        const lineCount = endsWithEmptyBR ? Math.max(1, brTags) : brTags + 1;

        const numbers = Array.from({ length: lineCount }, (_, i) => i + 1).join(
          '\n'
        );

        // Apply line numbers via CSS counter or data attribute
        block.setAttribute('data-line-numbers', numbers);
      });
    };

    // Update line numbers on editor changes
    const unregister = editor.registerUpdateListener(() => {
      // Use setTimeout to ensure DOM updates are complete
      setTimeout(updateLineNumbers, 0);
    });

    // Initial update
    updateLineNumbers();

    return unregister;
  }, [editor]);

  return null;
}

// Placeholder component for empty editor state
export function PlaceholderComponent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute top-0 left-0 text-gruv-medium pointer-events-none">
      {children}
    </div>
  );
}
