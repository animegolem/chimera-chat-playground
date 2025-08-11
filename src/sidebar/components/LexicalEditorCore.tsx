import React, { useImperativeHandle, forwardRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $convertToMarkdownString } from '@lexical/markdown';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import {
  AutoLinkPlugin,
  createLinkMatcherWithRegExp,
} from '@lexical/react/LexicalAutoLinkPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { TRANSFORMERS, CODE } from '@lexical/markdown';
import { validateUrl } from '@/sidebar/utils/lexical-utils';
import { KeyboardShortcutPlugin } from '@/sidebar/plugins/KeyboardShortcutPlugin';
import { ContentChangePlugin } from '@/sidebar/plugins/ContentChangePlugin';
import { SmartPastePlugin } from '@/sidebar/plugins/SmartPastePlugin';

// Import our separated modules
import { LexicalEditorProps, LexicalEditorRef } from './LexicalTypes';
import {
  createLexicalConfig,
  EMAIL_REGEX,
  HR_TRANSFORMER,
  SHIKI_CODE_BLOCK_TRANSFORMER,
} from './LexicalEditorConfig';
import {
  CodeHighlightPlugin,
  CodeBlockEscapePlugin,
  SimpleDragDropPastePlugin,
  MarkdownDebugPlugin,
  LineNumberPlugin,
  PlaceholderComponent,
} from './LexicalPlugins';

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
    const initialConfig = createLexicalConfig(disabled);

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
              markdown = $convertToMarkdownString([
                HR_TRANSFORMER,
                SHIKI_CODE_BLOCK_TRANSFORMER,
                ...TRANSFORMERS.filter((t) => t !== CODE),
              ]);
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
            transformers={[
              HR_TRANSFORMER,
              SHIKI_CODE_BLOCK_TRANSFORMER,
              ...TRANSFORMERS.filter((t) => t !== CODE),
            ]}
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
