import React, { useCallback, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface TipTapEditorRef {
  focus: () => void;
  clear: () => void;
  getEditor: () => any;
}

export const TipTapEditor = forwardRef<TipTapEditorRef, TipTapEditorProps>(
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
    const editor = useEditor({
      extensions: [
        StarterKit,
        Typography,
        Highlight,
        Placeholder.configure({
          placeholder,
          emptyEditorClass: 'is-editor-empty',
        }),
      ],
      content,
      editable: !disabled,
      onCreate: ({ editor }) => {
        // Debug: Log available commands and schema
        console.log('TipTap Debug - Available commands:', Object.keys(editor.commands));
        console.log('TipTap Debug - Schema nodes:', Object.keys(editor.schema.nodes));
        console.log('TipTap Debug - Schema marks:', Object.keys(editor.schema.marks));
      },
      onUpdate: ({ editor }) => {
        // Get HTML content for rich user posts
        const html = editor.getHTML();
        onChange(html);
      },
      onFocus,
      onBlur,
      editorProps: {
        handleKeyDown: (_view, event) => {
          // Debug input rule triggers
          if (event.key === ' ' && _view.state.selection.$head.parent.textContent.match(/^[#>*`]/)) {
            const text = _view.state.selection.$head.parent.textContent;
            console.log('TipTap Debug - Potential markdown trigger:', {
              key: event.key,
              text: text,
              position: _view.state.selection.$head.pos,
              parentPos: _view.state.selection.$head.start(),
              nodeType: _view.state.selection.$head.parent.type.name
            });
            
            // Test command availability using our editor instance
            if (editor) {
              if (text.startsWith('#')) {
                console.log('TipTap Debug - Testing heading command:', {
                  canToggleHeading: editor.can().toggleHeading({ level: 1 }),
                  hasHeadingCommand: !!editor.commands.toggleHeading,
                  currentNode: _view.state.selection.$head.parent.type.name
                });
                
                // MANUAL FIX: Since input rules aren't working, manually trigger the transformation
                console.log('TipTap Debug - Manually triggering heading transformation');
                const from = _view.state.selection.$head.start();
                const to = _view.state.selection.$head.pos;
                editor.commands.deleteRange({ from, to });
                editor.commands.toggleHeading({ level: 1 });
                return true; // Prevent default to stop the space from being added
              }
              if (text.startsWith('>')) {
                console.log('TipTap Debug - Testing blockquote command:', {
                  canToggleBlockquote: editor.can().toggleBlockquote(),
                  hasBlockquoteCommand: !!editor.commands.toggleBlockquote,
                  currentNode: _view.state.selection.$head.parent.type.name
                });
                
                // MANUAL FIX: Manually trigger blockquote transformation  
                console.log('TipTap Debug - Manually triggering blockquote transformation');
                const from = _view.state.selection.$head.start();
                const to = _view.state.selection.$head.pos;
                editor.commands.deleteRange({ from, to });
                editor.commands.toggleBlockquote();
                return true; // Prevent default
              }
            } else {
              console.log('TipTap Debug - Editor not available yet');
            }
          }
          
          if (onKeyDown) {
            onKeyDown(event);
          }
          return false; // Don't prevent default
        },
        attributes: {
          class: `prose prose-sm max-w-none focus:outline-none ${className}`,
          style: 'font-family: Courier New, monospace; min-height: 60px;',
        },
      },
    });

    // Focus the editor
    const focus = useCallback(() => {
      if (editor) {
        editor.commands.focus();
      }
    }, [editor]);

    // Clear content
    const clear = useCallback(() => {
      if (editor) {
        editor.commands.clearContent();
      }
    }, [editor]);

    // Expose methods for parent component
    useImperativeHandle(ref, () => ({
      focus,
      clear,
      getEditor: () => editor,
    }));

    return (
      <div className="relative">
        <EditorContent
          editor={editor}
          className="min-h-[60px] bg-transparent text-gruv-light"
        />

        {/* Custom styling for TipTap */}
        <style>{`
        :global(.ProseMirror) {
          outline: none !important;
          padding: 0;
          margin: 0;
          color: #ebdbb2;
          background: transparent;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
          min-height: 60px;
        }
        
        :global(.ProseMirror.is-editor-empty:first-child::before) {
          content: attr(data-placeholder);
          float: left;
          color: #7c6f64;
          pointer-events: none;
          height: 0;
        }
        
        :global(.ProseMirror p) {
          margin: 0;
          padding: 0;
        }
        
        :global(.ProseMirror strong) {
          color: #fabd2f;
          font-weight: bold;
        }
        
        :global(.ProseMirror em) {
          color: #83a598;
          font-style: italic;
        }
        
        :global(.ProseMirror code) {
          background: #3c3836;
          color: #8ec07c;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Hack', monospace;
        }
        
        :global(.ProseMirror pre) {
          background: #1d2021;
          border: 1px solid #504945;
          border-radius: 6px;
          padding: 12px;
          margin: 8px 0;
          overflow-x: auto;
        }
        
        :global(.ProseMirror pre code) {
          background: none;
          padding: 0;
          color: #8ec07c;
        }
        
        :global(.ProseMirror blockquote) {
          border-left: 3px solid #d79921;
          padding-left: 12px;
          margin: 8px 0;
          color: #bdae93;
        }
        
        :global(.ProseMirror ul, .ProseMirror ol) {
          margin: 4px 0;
          padding-left: 20px;
        }
        
        :global(.ProseMirror li) {
          margin: 2px 0;
        }
        
        :global(.ProseMirror h1) {
          font-size: 1.5em;
          font-weight: bold;
          color: #fb4934;
          margin: 8px 0 4px 0;
          border-bottom: 2px solid #fb4934;
          padding-bottom: 2px;
        }
        
        :global(.ProseMirror h2) {
          font-size: 1.3em;
          font-weight: bold;
          color: #fabd2f;
          margin: 6px 0 3px 0;
        }
        
        :global(.ProseMirror h3) {
          font-size: 1.2em;
          font-weight: bold;
          color: #8ec07c;
          margin: 6px 0 3px 0;
        }
        
        :global(.ProseMirror h4) {
          font-size: 1.1em;
          font-weight: bold;
          color: #83a598;
          margin: 4px 0 2px 0;
        }
        
        :global(.ProseMirror h5) {
          font-size: 1.05em;
          font-weight: bold;
          color: #d3869b;
          margin: 4px 0 2px 0;
        }
        
        :global(.ProseMirror h6) {
          font-size: 1em;
          font-weight: bold;
          color: #fe8019;
          margin: 4px 0 2px 0;
        }
        
        :global(.ProseMirror hr) {
          border: none;
          border-top: 2px solid #504945;
          margin: 12px 0;
          height: 1px;
        }
        
        :global(.ProseMirror .bullet-list) {
          list-style-type: disc;
        }
        
        :global(.ProseMirror .ordered-list) {
          list-style-type: decimal;
        }
        
        :global(.ProseMirror mark) {
          background-color: #fabd2f;
          color: #1d2021;
          border-radius: 3px;
          padding: 1px 2px;
        }
      `}</style>
      </div>
    );
  }
);
