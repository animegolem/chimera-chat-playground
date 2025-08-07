import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip } from 'lucide-react';
import { useApp } from '@/sidebar/contexts/AppContext';
import { LexicalEditor, LexicalEditorRef } from './LexicalEditor';
import {
  $getSelection,
  $createTextNode,
  $getRoot,
  $createParagraphNode,
} from 'lexical';

interface InputAreaProps {
  className?: string;
}

export function InputArea({ className = '' }: InputAreaProps) {
  const { state, actions } = useApp();
  const [isComposing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const [estimatedTokens, setEstimatedTokens] = useState(0);
  const editorRef = useRef<LexicalEditorRef>(null);

  // Auto-focus the input
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  // Check content on focus/blur and key events
  const checkContent = useCallback(() => {
    const currentText = editorRef.current?.getText() || '';
    const hasTextContent = currentText.trim().length > 0;
    setHasContent(hasTextContent);
    return hasTextContent;
  }, []);

  const handleSend = useCallback(async () => {
    console.log('DEBUG: handleSend called');

    // Get current markdown from editor instead of plain text
    const currentMarkdown = editorRef.current?.getMarkdown() || '';
    console.log('DEBUG: currentMarkdown:', currentMarkdown);
    console.log(
      'DEBUG: state.loading:',
      state.loading,
      'state.sending:',
      state.sending
    );

    if (!currentMarkdown.trim() || state.loading || state.sending) {
      console.log('DEBUG: Early return - no content or loading/sending');
      return;
    }

    const activeModelIds = state.activeModels;
    if (activeModelIds.length === 0) {
      alert('Please select at least one model');
      return;
    }

    await actions.sendMessage(currentMarkdown.trim(), activeModelIds);

    // Clear and refocus the editor
    if (editorRef.current) {
      editorRef.current.clear();
      editorRef.current.focus();
    }

    // Reset all states after clearing
    setHasContent(false);
    setFileCount(0);
    setEstimatedTokens(0);
  }, [state.loading, state.sending, state.activeModels, actions]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey && !isComposing) {
        e.preventDefault();
        handleSend();
      }

      // Check content on key events (debounced via setTimeout)
      setTimeout(checkContent, 0);
    },
    [isComposing, handleSend, checkContent]
  );

  // Handle paste events and other content changes
  const handleContentChange = useCallback(() => {
    // Debounce content checking for performance
    setTimeout(() => {
      checkContent();

      // Check for image deletions by counting [Image: xxx] patterns
      const currentText = editorRef.current?.getText() || '';
      const imageMatches = currentText.match(/\[Image: [^\]]+\]/g) || [];
      const currentImageCount = imageMatches.length;

      if (currentImageCount < fileCount) {
        console.log('DEBUG: Image(s) deleted, updating counter');
        // Rough estimate: assume deleted images were average size
        const avgTokensPerImage = estimatedTokens / fileCount;
        const removedImages = fileCount - currentImageCount;
        setFileCount(currentImageCount);
        setEstimatedTokens((prev) =>
          Math.max(0, prev - avgTokensPerImage * removedImages)
        );
      }
    }, 10);
  }, [checkContent, fileCount, estimatedTokens]);

  // Handle image drops - insert text indicator like debug page
  const handleImageDrop = useCallback(
    (_base64: string, fileName: string) => {
      console.log('DEBUG: Image dropped:', fileName);

      // Estimate tokens (rough approximation based on typical image sizes)
      const tokenEstimate = Math.round(Math.random() * 500 + 100); // 100-600 tokens estimate

      // Update file counters
      setFileCount((prev) => prev + 1);
      setEstimatedTokens((prev) => prev + tokenEstimate);

      // Insert [Image: filename.png] text into the editor
      if (editorRef.current) {
        console.log('DEBUG: Editor ref exists');
        const editor = editorRef.current.getEditor();

        editor.update(() => {
          const selection = $getSelection();
          console.log('DEBUG: Selection:', selection);

          if (selection) {
            const imageText = `[Image: ${fileName}] `;
            console.log('DEBUG: Inserting text:', imageText);
            selection.insertText(imageText);
          } else {
            console.log('DEBUG: No selection, trying to insert at end');
            // If no selection, insert at the root
            const textNode = $createTextNode(`[Image: ${fileName}] `);
            const root = $getRoot();
            const paragraph = $createParagraphNode();
            paragraph.append(textNode);
            root.append(paragraph);
          }
        });

        // Update content state
        setTimeout(checkContent, 10);
      } else {
        console.log('DEBUG: No editor ref');
      }
    },
    [checkContent]
  );

  const handleFocus = useCallback(() => {
    console.log('DEBUG: Focus event');
    setIsFocused(true);
    checkContent();
  }, [checkContent]);

  const handleBlur = useCallback(() => {
    console.log('DEBUG: Blur event');
    setIsFocused(false);
    checkContent();
  }, [checkContent]);

  return (
    <div className={`border-t border-primary p-4 space-y-3 ${className}`}>
      {/* Rich Text Input */}
      <div className="relative">
        <div
          className="bg-gruv-dark-soft border border-gruv-medium rounded-md p-3 max-h-96 overflow-y-auto overflow-x-hidden"
          style={{ contain: 'layout style' }}
        >
          {/* Bash-style prompt when empty and unfocused */}
          {!isFocused && !hasContent && (
            <div className="absolute top-3 left-3 text-gruv-medium pointer-events-none flex items-center gap-1">
              <span className="text-gruv-light-soft">$</span>
              <div className="w-0.5 h-4 bg-gruv-aqua-bright terminal-cursor ml-1" />
            </div>
          )}
          <LexicalEditor
            ref={editorRef}
            content=""
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onImageDrop={handleImageDrop}
            onContentChange={handleContentChange}
            placeholder=""
            disabled={state.loading}
            className="bg-transparent text-gruv-light"
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-3 gap-2 text-xs text-gruv-light-soft items-center">
        {/* Left: Files */}
        <div className="flex items-center gap-1">
          {fileCount > 0 ? (
            <span className="flex items-center gap-1 text-gruv-aqua-bright">
              <Paperclip className="h-3 w-3" />
              Files ({estimatedTokens} tokens est)
            </span>
          ) : (
            <span className="flex items-center gap-1 opacity-50">
              <Paperclip className="h-3 w-3" />
              Files
            </span>
          )}
        </div>

        {/* Center: Selection/Errors */}
        <div className="flex items-center justify-center">
          {state.currentSelection ? (
            <span className="text-gruv-aqua-bright">
              ✂️ {state.highlightedLines} lines selected
            </span>
          ) : state.activeModels.length === 0 ? (
            <span className="text-gruv-red-bright">⚠ No models selected</span>
          ) : null}
        </div>

        {/* Right: Run Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            size="sm"
            disabled={
              state.loading ||
              state.sending ||
              state.activeModels.length === 0 ||
              !hasContent
            }
            className="bg-gruv-medium hover:bg-gruv-green text-gruv-light hover:text-gruv-aqua-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.loading ? (
              <span className="hourglass-loading text-sm"></span>
            ) : (
              <div className="flex flex-col items-center text-xs leading-tight">
                <span>CTRL+</span>
                <span>ENTER</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
