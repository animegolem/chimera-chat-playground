import React, {
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from 'react';
import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { EditorState, $getRoot, $getSelection } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import {
  CodeHighlightNode,
  CodeNode,
  registerCodeHighlighting,
} from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import {
  AutoLinkPlugin,
  createLinkMatcherWithRegExp,
} from '@lexical/react/LexicalAutoLinkPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { MarkNode } from '@lexical/mark';
import { TRANSFORMERS, ElementTransformer } from '@lexical/markdown';
import { $createHorizontalRuleNode, $isHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { DRAG_DROP_PASTE } from '@lexical/rich-text';
import { isMimeType, mediaFileReader } from '@lexical/utils';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { COMMAND_PRIORITY_LOW } from 'lexical';

// URL validation utility from Lexical playground
const validateUrl = (url: string): boolean => {
  const urlRegExp = new RegExp(
    /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/
  );
  return url === 'https://' || urlRegExp.test(url);
};

// Email regex for AutoLinkPlugin
const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

// Horizontal Rule transformer (missing from default TRANSFORMERS)
const HR_TRANSFORMER: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node) => {
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

// Combined transformers including HR
const EXTENDED_TRANSFORMERS = [HR_TRANSFORMER, ...TRANSFORMERS];

// Acceptable image types for drag-drop
const ACCEPTABLE_IMAGE_TYPES = [
  'image/',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/webp',
];

// Simple image resizing function to optimize for Claude API
const resizeImage = async (
  file: File,
  maxSize: number = 1568
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate dimensions
      let { width, height } = img;
      const maxDim = Math.max(width, height);

      if (maxDim > maxSize) {
        const scale = maxSize / maxDim;
        width *= scale;
        height *= scale;
      }

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw and convert to base64
      ctx?.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      resolve(base64);
    };

    img.src = URL.createObjectURL(file);
  });
};

interface LexicalEditorProps {
  content: string;
  onChange: (content: string) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onImageDrop?: (base64: string, fileName: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface LexicalEditorRef {
  focus: () => void;
  clear: () => void;
  getEditor: () => any;
  getText: () => string;
}

// Proper command-based plugin that doesn't interfere with CodeNode behavior
function CommandPlugin({
  onKeyDown,
  onContentChange,
}: {
  onKeyDown?: (event: KeyboardEvent) => void;
  onContentChange?: (content?: string) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onKeyDown && !onContentChange) return;

    const removeCommands: (() => void)[] = [];

    // Handle special key combinations that need custom behavior
    if (onKeyDown) {
      const removeKeyCommand = editor.registerCommand(
        'keydown' as any,
        (event: KeyboardEvent) => {
          // Only handle specific cases that need custom behavior
          // Let Lexical handle normal editing (including Enter in code blocks)
          if (event.ctrlKey || event.metaKey || event.altKey) {
            onKeyDown(event);
            // Don't prevent default - let other handlers run too
          }
          return false; // Always allow other handlers to process
        },
        COMMAND_PRIORITY_LOW // Low priority to not interfere with built-ins
      );
      removeCommands.push(removeKeyCommand);
    }

    // Handle paste events for content change detection
    if (onContentChange) {
      const removePasteCommand = editor.registerCommand(
        'paste' as any,
        () => {
          setTimeout(onContentChange, 50);
          return false; // Don't prevent default paste behavior
        },
        COMMAND_PRIORITY_LOW
      );
      removeCommands.push(removePasteCommand);
    }

    return () => {
      removeCommands.forEach((fn) => fn());
    };
  }, [editor, onKeyDown, onContentChange]);

  return null;
}

// Code highlighting plugin for proper code block support
function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return registerCodeHighlighting(editor);
  }, [editor]);

  return null;
}

// Simple drag-drop paste plugin for images
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

          for (const { file, result } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              console.log(
                '📸 Processing dropped image:',
                file.name,
                file.size,
                'bytes'
              );

              // Resize image for optimal Claude API usage
              const resizedBase64 = await resizeImage(file);

              if (onImageDrop) {
                onImageDrop(resizedBase64, file.name);
              } else {
                // Fallback: insert as text reference
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

// Line numbering plugin for code blocks
function LineNumberPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const updateLineNumbers = () => {
      const codeBlocks = document.querySelectorAll('.lexical-code-block');

      // Only log and process if there are actually code blocks
      if (codeBlocks.length === 0) return;

      console.log(
        `🔢 Updating line numbers for ${codeBlocks.length} code blocks`
      );

      codeBlocks.forEach((block, index) => {
        // Restore the working logic from bbdf77a commit
        const brTags = block.querySelectorAll('br').length;

        // Check if the last element is an empty BR (cursor on empty line)
        const lastChild = block.lastChild;
        const endsWithEmptyBR = lastChild && lastChild.nodeName === 'BR';

        // If it ends with empty BR, that line doesn't count until it has content
        const lineCount = endsWithEmptyBR ? Math.max(1, brTags) : brTags + 1;

        console.log(
          `Block ${index}: ${brTags} br tags, endsWithEmptyBR: ${endsWithEmptyBR} = ${lineCount} lines`
        );

        const numbers = Array.from({ length: lineCount }, (_, i) => i + 1).join(
          '\n'
        );
        console.log(`Setting gutter: "${numbers}"`);
        (block as HTMLElement).setAttribute('data-gutter', numbers);

        // Check if it was actually set
        const actualGutter = (block as HTMLElement).getAttribute('data-gutter');
        console.log(`Verification: actual gutter value: "${actualGutter}"`);
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

function EditorRefPlugin({
  editorRef,
}: {
  editorRef: React.MutableRefObject<{
    focus: () => void;
    clear: () => void;
    getEditor: () => any;
    getText: () => string;
  } | null>;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus = () => editor.focus();
      editorRef.current.clear = () => {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
        });
      };
      editorRef.current.getEditor = () => editor;
      editorRef.current.getText = () => {
        let text = '';
        editor.getEditorState().read(() => {
          const root = $getRoot();
          text = root.getTextContent();
        });
        return text;
      };
    }
  }, [editor, editorRef]);

  return null;
}

export const LexicalEditor = forwardRef<LexicalEditorRef, LexicalEditorProps>(
  (
    {
      content,
      onChange,
      onKeyDown,
      onFocus,
      onBlur,
      onImageDrop,
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
        code: 'lexical-code-block bg-gruv-dark-0 border border-gruv-dark-4 rounded my-2 overflow-x-auto text-gruv-green block whitespace-pre-wrap relative',
        quote: 'border-l-3 border-gruv-yellow pl-3 my-2 text-gruv-light-2',
        link: 'text-gruv-blue underline hover:text-gruv-light cursor-pointer',
        mark: 'bg-gruv-yellow text-gruv-dark-0 px-1 rounded',
        hr: 'border-0 border-t border-gruv-dark-4 my-4',
        hrSelected: 'outline outline-2 outline-gruv-blue',
      },
      editable: !disabled,
    };

    const handleChange = useCallback(
      (editorState: EditorState, editor: any) => {
        // Call onChange to notify parent of content changes
        // This enables proper button state and cursor management
        if (onChange) {
          onChange(''); // We don't need to pass actual content, just trigger the check
        }
      },
      [onChange]
    );

    // Create a ref object for the EditorRefPlugin
    const internalRef = React.useRef<{
      focus: () => void;
      clear: () => void;
      getEditor: () => any;
      getText: () => string;
    } | null>({
      focus: () => {},
      clear: () => {},
      getEditor: () => null,
      getText: () => '',
    });

    // Expose methods for parent component
    useImperativeHandle(ref, () => ({
      focus: () => internalRef.current?.focus(),
      clear: () => internalRef.current?.clear(),
      getEditor: () => internalRef.current?.getEditor(),
      getText: () => internalRef.current?.getText() || '',
    }));

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
          <LineNumberPlugin />
          <HorizontalRulePlugin />
          <SimpleDragDropPastePlugin onImageDrop={onImageDrop} />
          <MarkdownShortcutPlugin transformers={EXTENDED_TRANSFORMERS} />
          <OnChangePlugin onChange={handleChange} />
          <CommandPlugin onKeyDown={onKeyDown} onContentChange={onChange} />
          <EditorRefPlugin editorRef={internalRef} />
          <AutoFocusPlugin />
        </LexicalComposer>

        {/* Custom Gruvbox styling */}
        <style>{`
          .PlaygroundEditorTheme__ltr {
            text-align: left;
          }
          .PlaygroundEditorTheme__rtl {
            text-align: right;
          }
          .PlaygroundEditorTheme__paragraph {
            margin: 0;
            position: relative;
          }
          
          /* Code block with line numbers - playground style */
          .lexical-code-block {
            font-family: Menlo, Consolas, Monaco, monospace;
            display: block;
            padding: 8px 8px 8px 52px;
            line-height: 1.53;
            font-size: 13px;
            margin: 8px 0;
            overflow-x: auto;
            position: relative;
            tab-size: 2;
            white-space: pre;
          }
          
          .lexical-code-block::before {
            content: attr(data-gutter);
            position: absolute;
            background-color: #282828;
            left: 0;
            top: 0;
            bottom: 0;
            border-right: 1px solid #504945;
            padding: 8px;
            color: #665c54;
            white-space: pre-wrap;
            text-align: right;
            min-width: 36px;
            font-family: Menlo, Consolas, Monaco, monospace;
            font-size: 13px;
            line-height: 1.53;
            box-sizing: border-box;
          }
          
          /* Ensure consistent blockquote styling */
          .border-l-3 {
            border-left-width: 3px !important;
            border-left-style: solid !important;
          }
          
          /* Fix potential outline issues in extension */
          .lexical-code-block {
            outline: none !important;
            border: 1px solid #504945 !important;
          }
        `}</style>
      </div>
    );
  }
);

LexicalEditor.displayName = 'LexicalEditor';
