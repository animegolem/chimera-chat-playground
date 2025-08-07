import React, { useImperativeHandle, forwardRef, useEffect } from 'react';
import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_HIGH,
} from 'lexical';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import {
  CodeHighlightNode,
  CodeNode,
  $isCodeNode,
  $createCodeNode,
} from '@lexical/code';
import { 
  registerCodeHighlighting, 
  ShikiTokenizer
} from '@lexical/code-shiki';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import {
  AutoLinkPlugin,
  createLinkMatcherWithRegExp,
} from '@lexical/react/LexicalAutoLinkPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { MarkNode } from '@lexical/mark';
import {
  TRANSFORMERS,
  ElementTransformer,
  TextMatchTransformer,
  $convertToMarkdownString,
} from '@lexical/markdown';
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { DRAG_DROP_PASTE } from '@lexical/rich-text';
import { isMimeType, mediaFileReader } from '@lexical/utils';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { COMMAND_PRIORITY_LOW, ParagraphNode } from 'lexical';
import { validateUrl } from '@/sidebar/utils/lexical-utils';
import {
  resizeImage,
  ACCEPTABLE_IMAGE_TYPES,
} from '@/sidebar/utils/image-utils';
import { KeyboardShortcutPlugin } from '@/sidebar/plugins/KeyboardShortcutPlugin';
import { ContentChangePlugin } from '@/sidebar/plugins/ContentChangePlugin';
import { SmartPastePlugin } from '@/sidebar/plugins/SmartPastePlugin';

// Email regex for AutoLinkPlugin
const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

// Horizontal Rule transformer for --- markdown shortcut
const HR_TRANSFORMER: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node: any) => {
    return $isHorizontalRuleNode(node) ? '***' : null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
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

// Custom Shiki-compatible code block transformer for ``` markdown shortcut
const SHIKI_CODE_BLOCK_TRANSFORMER: TextMatchTransformer = {
  dependencies: [CodeNode],
  export: (node: any) => {
    if (!$isCodeNode(node)) {
      return null;
    }
    const textContent = node.getTextContent();
    const language = node.getLanguage() || '';
    return '```' + language + '\n' + textContent + '\n```';
  },
  importRegExp: /```([a-z]*)\n/,
  regExp: /^```([a-z]*)$/,
  replace: (textNode, match) => {
    const language = match[1] || '';
    
    // Get the parent paragraph
    const paragraph = textNode.getParent();
    if (!paragraph) return;
    
    // Create a new code node
    const codeNode = $createCodeNode(language);
    
    // Replace the paragraph with the code node
    paragraph.replace(codeNode);
    
    // Focus the code node
    codeNode.selectStart();
  },
  trigger: '```',
  type: 'text-match',
};

interface LexicalEditorProps {
  content: string;
  onKeyDown?: (event: KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onImageDrop?: (base64: string, fileName: string) => void;
  onContentChange?: (content?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface LexicalEditorRef {
  focus: () => void;
  clear: () => void;
  getEditor: () => any;
  getText: () => string;
  getMarkdown: () => string;
}

// Code highlighting plugin for proper code block support with Shiki
function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    console.log('IAC-120: Registering Shiki code highlighting');
    console.log('Shiki tokenizer default language:', ShikiTokenizer.defaultLanguage);
    console.log('Shiki tokenizer default theme:', ShikiTokenizer.defaultTheme);
    
    // Shiki will handle theme and language loading dynamically
    // The nightly build includes support for 100+ languages
    // Cast to any to bypass version mismatch between lexical and @lexical/code-shiki
    return registerCodeHighlighting(editor as any, ShikiTokenizer);
  }, [editor]);

  return null;
}

// Smart code block escape plugin - exits on 3+ empty lines
function CodeBlockEscapePlugin() {
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

          // Check if this line is only whitespace
          if (text.trim() === '' && text.length > 0) {
            emptyLineCount++;
          } else if (text.length === 0) {
            // Empty text nodes also count
            emptyLineCount++;
          } else {
            // Found non-empty content, stop counting
            break;
          }
        }

        // If we have 2+ trailing empty lines, trigger escape
        if (emptyLineCount >= 2) {
          event?.preventDefault();

          // Remove the trailing empty nodes
          for (let i = 0; i < emptyLineCount; i++) {
            const lastChild = codeBlock.getLastChild();
            if (lastChild) {
              lastChild.remove();
            }
          }

          // Create new paragraph after code block
          const paragraph = $createParagraphNode();
          codeBlock.insertAfter(paragraph);

          // Focus the new paragraph
          paragraph.selectStart();

          return true; // Prevent default Enter behavior
        }

        return false; // Let normal Enter handling proceed
      },
      COMMAND_PRIORITY_HIGH // High priority to intercept before default handlers
    );
  }, [editor]);

  return null;
}

// Simple drag-drop paste plugin for images - command pattern
function SimpleDragDropPastePlugin({
  onImageDrop,
}: {
  onImageDrop?: (base64: string, fileName: string) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          const filesResult = await mediaFileReader(
            files,
            [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x)
          );

          for (const { file } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              const resizedBase64 = await resizeImage(file);

              if (onImageDrop) {
                onImageDrop(resizedBase64, file.name);
              } else {
                editor.update(() => {
                  const selection = $getSelection();
                  if (selection) {
                    selection.insertText(`[Image: ${file.name}]`);
                  }
                });
              }
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

// Debug plugin for markdown shortcut issues and transformer research
function MarkdownDebugPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    console.log('IAC-119: Migrated to Shiki from Prism.js');
    console.log('IAC-112 Complete: Using TRANSFORMERS + HR_TRANSFORMER');
    console.log('Active transformer count:', TRANSFORMERS.length + 2);
    console.log('NOTE: Using custom SHIKI_CODE_BLOCK_TRANSFORMER for code blocks');

    // List what transformers are active
    console.log('Active transformers:');
    console.log('- HR_TRANSFORMER (---)');
    console.log('- SHIKI_CODE_BLOCK_TRANSFORMER (```)');
    TRANSFORMERS.forEach((transformer) => {
      // Some transformers don't have regExp (like multiline transformers)
      const regex = (transformer as any).regExp?.source || 'N/A';
      console.log(`- ${transformer.type}: ${regex}`);
    });

    console.log('\nTesting plan:');
    console.log('✓ Headers: # ## ###');
    console.log('✓ Blockquotes: >');
    console.log('✓ Lists: 1. * -');
    console.log('✓ Code: ``` and `code`');
    console.log('✓ Text format: **bold** *italic*');
    console.log('✓ Horizontal rules: ---');
    console.log('✓ Links: [text](url)');

    // Monitor for node changes that might indicate markdown transformations
    const unregister = editor.registerNodeTransform(ParagraphNode, (node) => {
      const textContent = node.getTextContent();

      // Log when we see markdown patterns that should transform
      if (textContent.match(/^\d+\.\s/)) {
        console.log('DEBUG: Numbered list pattern detected:', textContent);
      }
      if (textContent.match(/^#{1,6}\s/)) {
        console.log('DEBUG: Header pattern detected:', textContent);
      }
      if (textContent.match(/^-\s|^\*\s/)) {
        console.log('DEBUG: Bullet list pattern detected:', textContent);
      }
    });

    return unregister;
  }, [editor]);

  return null;
}

// Line numbering plugin for code blocks
function LineNumberPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const updateLineNumbers = () => {
      const codeBlocks = document.querySelectorAll('.editor-code');

      codeBlocks.forEach((block) => {
        // Restore the working logic from bbdf77a commit
        const brTags = block.querySelectorAll('br').length;

        // Check if the last element is an empty BR (cursor on empty line)
        const lastChild = block.lastChild;
        const endsWithEmptyBR = lastChild && lastChild.nodeName === 'BR';

        // If it ends with empty BR, that line doesn't count until it has content
        const lineCount = endsWithEmptyBR ? Math.max(1, brTags) : brTags + 1;

        const numbers = Array.from({ length: lineCount }, (_, i) => i + 1).join(
          '\n'
        );
        (block as HTMLElement).setAttribute('data-gutter', numbers);
      });
    };

    const unregister = editor.registerUpdateListener(() => {
      setTimeout(updateLineNumbers, 0);
    });

    // Initial update
    setTimeout(updateLineNumbers, 0);

    return unregister;
  }, [editor]);

  return null;
}

function PlaceholderComponent({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-0 left-0 pointer-events-none text-gruv-dark-4 font-mono text-sm">
      {children}
    </div>
  );
}

export const LexicalEditor = forwardRef<LexicalEditorRef, LexicalEditorProps>(
  (
    {
      content,
      onKeyDown,
      onFocus,
      onBlur,
      onImageDrop,
      onContentChange,
      placeholder = '',
      disabled = false,
      className = '',
    },
    ref
  ) => {
    const initialConfig: InitialConfigType = {
      namespace: 'ChimeraEditor',
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        CodeHighlightNode,
        LinkNode,
        AutoLinkNode,
        MarkNode,
        HorizontalRuleNode,
      ],
      onError: (error: Error) => {
        console.error('Lexical Error:', error);
      },
      theme: {
        root: 'relative min-h-[60px] bg-transparent text-gruv-light font-mono text-sm leading-relaxed',
        paragraph: 'm-0 p-0',
        heading: {
          h1: 'text-lg font-bold text-gruv-red mb-1',
          h2: 'text-base font-bold text-gruv-yellow mb-1',
          h3: 'text-sm font-bold text-gruv-green mb-1',
          h4: 'text-sm font-bold text-gruv-blue mb-1',
          h5: 'text-sm font-bold text-gruv-purple mb-1',
          h6: 'text-sm font-bold text-gruv-orange mb-1',
        },
        list: {
          nested: {
            listitem: 'list-none',
          },
          ol: 'list-decimal ml-5 my-1',
          ul: 'list-disc ml-5 my-1',
          listitem: 'my-0.5',
        },
        text: {
          bold: 'font-bold text-gruv-yellow',
          italic: 'italic text-gruv-blue',
          underline: 'underline',
          strikethrough: 'line-through',
          code: 'bg-gruv-dark-2 text-gruv-green px-1 py-0.5 rounded font-mono text-xs',
        },
        code: 'editor-code',
        quote: 'editor-quote',
        link: 'text-gruv-blue underline hover:text-gruv-light cursor-pointer',
        mark: 'bg-gruv-yellow text-gruv-dark-0 px-1 rounded',
        hr: 'border-0 border-t border-gruv-dark-4 my-4',
        hrSelected: 'outline outline-2 outline-gruv-blue',
      },
      editable: !disabled,
    };

    // Internal component to handle ref methods using standard patterns
    const RefHandler = () => {
      const [editor] = useLexicalComposerContext();

      useImperativeHandle(
        ref,
        () => ({
          focus: () => editor.focus(),
          clear: () => {
            editor.update(() => {
              const root = $getRoot();
              root.clear();
            });
          },
          getEditor: () => editor,
          getText: () => {
            let text = '';
            editor.getEditorState().read(() => {
              const root = $getRoot();
              text = root.getTextContent();
            });
            return text;
          },
          getMarkdown: () => {
            let markdown = '';
            editor.getEditorState().read(() => {
              markdown = $convertToMarkdownString([HR_TRANSFORMER, SHIKI_CODE_BLOCK_TRANSFORMER, ...TRANSFORMERS]);
            });
            return markdown;
          },
        }),
        [editor]
      );

      return null;
    };

    return (
      <div className={`relative ${className}`}>
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="min-h-[60px] outline-none bg-transparent text-gruv-light font-mono text-sm p-0 m-0 break-words leading-relaxed"
                style={{
                  fontFamily: 'Courier New, monospace',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            }
            placeholder={
              placeholder ? (
                <PlaceholderComponent>{placeholder}</PlaceholderComponent>
              ) : null
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LexicalLinkPlugin
            validateUrl={validateUrl}
            attributes={{
              rel: 'noopener noreferrer',
              target: '_blank',
            }}
          />
          <AutoLinkPlugin
            matchers={[
              createLinkMatcherWithRegExp(
                /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(?<![-.+():%])/,
                (text) => (text.startsWith('http') ? text : `https://${text}`)
              ),
              createLinkMatcherWithRegExp(
                EMAIL_REGEX,
                (text) => `mailto:${text}`
              ),
            ]}
          />
          <ClickableLinkPlugin disabled={disabled} />
          <CodeHighlightPlugin />
          <CodeBlockEscapePlugin />
          <LineNumberPlugin />
          <HorizontalRulePlugin />
          <SimpleDragDropPastePlugin onImageDrop={onImageDrop} />
          <MarkdownShortcutPlugin
            transformers={[HR_TRANSFORMER, SHIKI_CODE_BLOCK_TRANSFORMER, ...TRANSFORMERS]}
          />
          <MarkdownDebugPlugin />
          <KeyboardShortcutPlugin onKeyDown={onKeyDown} />
          <ContentChangePlugin onContentChange={onContentChange} />
          <SmartPastePlugin enabled={true} />
          <AutoFocusPlugin />
          <RefHandler />
        </LexicalComposer>
      </div>
    );
  }
);

LexicalEditor.displayName = 'LexicalEditor';
