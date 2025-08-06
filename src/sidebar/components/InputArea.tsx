import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip } from 'lucide-react';
import { useApp } from '@/sidebar/contexts/AppContext';
import { LexicalEditor, LexicalEditorRef } from './LexicalEditor';

interface InputAreaProps {
  className?: string;
}

export function InputArea({ className = '' }: InputAreaProps) {
  const { state, actions } = useApp();
  const [isComposing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasContent, setHasContent] = useState(false);
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

    // Get current text from editor instead of state
    const currentText = editorRef.current?.getText() || '';
    if (!currentText.trim() || state.loading || state.sending) return;

    const activeModelIds = state.activeModels;
    if (activeModelIds.length === 0) {
      alert('Please select at least one model');
      return;
    }

    await actions.sendMessage(currentText.trim(), activeModelIds);

    // Clear and refocus the editor
    if (editorRef.current) {
      editorRef.current.clear();
      editorRef.current.focus();
    }

    // Update content state after clearing
    setHasContent(false);
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
    setTimeout(checkContent, 10);
  }, [checkContent]);

  // Handle image drops - for now, just show a notification
  const handleImageDrop = useCallback((base64: string, fileName: string) => {

    // Calculate approximate token usage (width * height / 750)
    // For now, we'll estimate based on base64 size
    const estimatedTokens = Math.round(base64.length / 1000); // rough estimate

    // TODO: In next phase, integrate with chat backend to send images
    alert(
      `Image '${fileName}' processed successfully!\nEstimated tokens: ~${estimatedTokens}\n\nNext: Backend integration to send to Claude API`
    );
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    checkContent();
  }, [checkContent]);

  const handleBlur = useCallback(() => {
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
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onImageDrop={handleImageDrop}
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
          <span className="flex items-center gap-1 opacity-50">
            <Paperclip className="h-3 w-3" />
            Files (coming soon)
          </span>
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
            className="bg-gruv-medium hover:bg-gruv-green text-gruv-light hover:text-gruv-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
