import React, { useCallback, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

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
        StarterKit.configure({
          // Disable heading levels for chat input
          heading: false,
          // Keep basic formatting
          bold: {},
          italic: {},
          code: {},
          codeBlock: {},
          blockquote: {},
          bulletList: {},
          orderedList: {},
          horizontalRule: false,
          // Enable paragraph and line breaks
          paragraph: {},
          hardBreak: {},
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: 'is-editor-empty',
        }),
      ],
      content,
      editable: !disabled,
      onUpdate: ({ editor }) => {
        // Get plain text content for now, could be HTML later
        const text = editor.getText();
        onChange(text);
      },
      onFocus,
      onBlur,
      editorProps: {
        handleKeyDown: (_view, event) => {
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
      `}</style>
      </div>
    );
  }
);
