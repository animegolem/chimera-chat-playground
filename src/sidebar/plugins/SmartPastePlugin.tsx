/**
 * SmartPastePlugin - Context-aware paste formatting for markdown and code
 * IAC-111: Intelligent routing based on paste location (general editor vs code blocks)
 */
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  PASTE_COMMAND,
  COMMAND_PRIORITY_HIGH,
  PasteCommandType,
} from 'lexical';
import { $isCodeNode } from '@lexical/code';
import { $convertFromMarkdownString, TRANSFORMERS, ElementTransformer } from '@lexical/markdown';
import { $createHorizontalRuleNode, $isHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';

// Horizontal Rule transformer for --- markdown shortcut (same as in LexicalEditor)
const HR_TRANSFORMER: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node: any) => {
    return $isHorizontalRuleNode(node) ? '***' : null;
  },
  regExp: /^(---|\\*\\*\\*|___)\\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = $createHorizontalRuleNode();

    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }

    line.selectNext();
  },
  type: 'element',
};

interface SmartPastePluginProps {
  enabled?: boolean;
}

export function SmartPastePlugin({
  enabled = true,
}: SmartPastePluginProps): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!enabled) return;

    console.log('SmartPastePlugin: Registered for paste events');

    const removePasteListener = editor.registerCommand<PasteCommandType>(
      PASTE_COMMAND,
      (payload) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false; // Let default paste handler take over
        }

        // Determine context: Are we inside a code block?
        const anchorNode = selection.anchor.getNode();
        const isInCodeBlock = $isInCodeContext(anchorNode);

        // Get pasted content - PasteCommandType can be ClipboardEvent or DragEvent
        let text = '';
        if (payload instanceof ClipboardEvent && payload.clipboardData) {
          text = payload.clipboardData.getData('text/plain');
        } else if (payload instanceof DragEvent && payload.dataTransfer) {
          text = payload.dataTransfer.getData('text/plain');
        } else {
          return false; // Unsupported paste event type
        }
        if (!text || text.trim().length === 0) {
          return false; // No text content to process
        }

        console.log('SmartPastePlugin: Detected paste', {
          isInCodeBlock,
          textLength: text.length,
          preview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        });

        if (isInCodeBlock) {
          // Inside code block: Preserve raw text, no markdown parsing
          console.log('SmartPastePlugin: Raw text paste (code context)');
          selection.insertText(text);
          return true; // Prevent default paste behavior
        } else {
          // General editor: Apply markdown formatting
          return handleMarkdownPaste(editor, text, selection);
        }
      },
      COMMAND_PRIORITY_HIGH // High priority to intercept before default handlers
    );

    return removePasteListener;
  }, [editor, enabled]);

  return null;
}

/**
 * Determine if we're currently inside a code block context
 */
function $isInCodeContext(node: any): boolean {
  let current = node;

  // Walk up the tree to find a CodeNode ancestor
  while (current) {
    if ($isCodeNode(current)) {
      return true;
    }
    current = current.getParent();
  }

  return false;
}

/**
 * Handle markdown-formatted paste content in general editor
 */
function handleMarkdownPaste(
  editor: any,
  text: string,
  selection: any
): boolean {
  try {
    // Check if content looks like markdown
    const hasMarkdownPatterns =
      /(\*\*.*\*\*|\*.*\*|`.*`|^#{1,6}\s|^>\s|^\d+\.\s|^[-*]\s)/m.test(text);

    if (!hasMarkdownPatterns) {
      // Plain text, let default handler process
      console.log('SmartPastePlugin: Plain text, using default handler');
      return false;
    }

    console.log(
      'SmartPastePlugin: Markdown detected, converting to rich nodes'
    );

    // Use editor.update to ensure we're in the right context
    editor.update(() => {
      // Clear the current selection
      selection.removeText();
      
      // Convert markdown to Lexical nodes using full transformer set
      $convertFromMarkdownString(text, [HR_TRANSFORMER, ...TRANSFORMERS]);
    });

    return true; // Prevent default paste behavior
  } catch (error) {
    console.error('SmartPastePlugin: Error processing markdown paste', error);
    return false; // Fall back to default paste
  }
}
