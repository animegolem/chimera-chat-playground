import React, { useCallback, useImperativeHandle, forwardRef, useEffect } from 'react';
import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { EditorState, $getRoot } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { MarkNode } from '@lexical/mark';
import { TRANSFORMERS } from '@lexical/markdown';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

interface LexicalEditorProps {
  content: string;
  onChange: (content: string) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
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

function MyCustomAutoFocusPlugin({ shouldFocus = true }: { shouldFocus?: boolean }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (shouldFocus) {
      editor.focus();
    }
  }, [editor, shouldFocus]);

  return null;
}

function KeyDownPlugin({ onKeyDown, onContentChange }: { 
  onKeyDown?: (event: KeyboardEvent) => void;
  onContentChange?: (content?: string) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onKeyDown && !onContentChange) return;

    let cleanup: (() => void) | null = null;
    
    console.log('[LexicalEditor] Registering KeyDown plugin', { 
      timestamp: Date.now(), 
      handlerRef: onKeyDown?.toString().substring(0, 50) + '...'
    });

    const removeListener = editor.registerRootListener((rootElement) => {
      // Clean up any existing listener first
      if (cleanup) {
        console.log('[LexicalEditor] Cleaning up previous listener');
        cleanup();
        cleanup = null;
      }

      if (rootElement !== null) {
        const cleanupFunctions: (() => void)[] = [];
        
        if (onKeyDown) {
          console.log('[LexicalEditor] Adding keydown listener to root element');
          rootElement.addEventListener('keydown', onKeyDown);
          cleanupFunctions.push(() => {
            console.log('[LexicalEditor] Removing keydown listener from root element');
            rootElement.removeEventListener('keydown', onKeyDown);
          });
        }
        
        if (onContentChange) {
          console.log('[LexicalEditor] Adding paste listener to root element');
          const handlePaste = () => {
            // Delay to allow paste content to be processed
            setTimeout(onContentChange, 50);
          };
          rootElement.addEventListener('paste', handlePaste);
          cleanupFunctions.push(() => {
            console.log('[LexicalEditor] Removing paste listener from root element');
            rootElement.removeEventListener('paste', handlePaste);
          });
        }
        
        cleanup = () => {
          cleanupFunctions.forEach(fn => fn());
        };
      }
    });

    return () => {
      console.log('[LexicalEditor] KeyDown plugin cleanup effect running');
      cleanup?.();
      removeListener();
    };
  }, [editor, onKeyDown, onContentChange]);

  return null;
}

// Removed custom CodeBlockPlugin - using stock Lexical code block behavior

function PlaceholderComponent({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-0 left-0 pointer-events-none text-gruv-dark-4 font-mono text-sm">
      {children}
    </div>
  );
}

function EditorRefPlugin({ 
  editorRef 
}: { 
  editorRef: React.MutableRefObject<{ focus: () => void; clear: () => void; getEditor: () => any; getText: () => string } | null> 
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
        MarkNode,
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
        code: 'bg-gruv-dark-0 border border-gruv-dark-4 rounded p-3 my-2 overflow-x-auto text-gruv-green font-mono text-xs',
        codeBlock: {
          backgroundColor: '#1d2021',
          border: '1px solid #504945',
          borderRadius: '6px',
          fontFamily: 'Courier New, monospace',
          fontSize: '12px',
          lineHeight: '1.4',
          margin: '8px 0',
          padding: '12px',
          position: 'relative',
          color: '#b8bb26',
          overflow: 'auto',
        },
        quote: 'border-l-3 border-gruv-yellow pl-3 my-2 text-gruv-light-2',
        link: 'text-gruv-blue underline hover:text-gruv-light cursor-pointer',
        mark: 'bg-gruv-yellow text-gruv-dark-0 px-1 rounded',
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
    const internalRef = React.useRef<{ focus: () => void; clear: () => void; getEditor: () => any; getText: () => string } | null>({
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
                  whiteSpace: 'pre-wrap'
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
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <OnChangePlugin onChange={handleChange} />
          <KeyDownPlugin onKeyDown={onKeyDown} onContentChange={onChange} />
          <EditorRefPlugin editorRef={internalRef} />
          <MyCustomAutoFocusPlugin />
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
        `}</style>
      </div>
    );
  }
);

LexicalEditor.displayName = 'LexicalEditor';