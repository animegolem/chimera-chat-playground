import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Paperclip, Zap } from 'lucide-react';
import { useApp } from '@/sidebar/contexts/AppContext';

interface InputAreaProps {
  className?: string;
}

export function InputArea({ className = '' }: InputAreaProps) {
  const { state, actions } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the input
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() || state.loading) return;
    
    const activeModelIds = state.activeModels;
    if (activeModelIds.length === 0) {
      alert('Please select at least one model');
      return;
    }

    await actions.sendMessage(inputValue.trim(), activeModelIds);
    setInputValue('');
    
    // Refocus the input
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleComposition = (e: React.CompositionEvent) => {
    setIsComposing(e.type === 'compositionstart');
  };

  return (
    <div className={`border-t border-primary p-4 space-y-3 ${className}`}>
      {/* Text Input */}
      <div className="relative">
        <div className="bg-gruv-dark-soft border border-gruv-medium rounded-md p-3">
          {/* Bash-style prompt */}
          {!inputValue && !isFocused && (
            <div className="absolute top-3 left-3 text-gruv-medium pointer-events-none flex items-center gap-1">
              <span className="text-gruv-light-soft">$</span>
              <div className="w-0.5 h-4 bg-gruv-aqua-bright terminal-cursor ml-1" />
            </div>
          )}
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleComposition}
            onCompositionEnd={handleComposition}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder=""
            className="min-h-[60px] bg-transparent border-none text-primary placeholder-transparent resize-none p-0 focus:ring-0 focus:outline-none"
            style={{ fontFamily: 'Courier New, monospace' }}
            disabled={state.loading}
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
            <span className="text-gruv-red-bright">
              ⚠ No models selected
            </span>
          ) : null}
        </div>
        
        {/* Right: Run Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            size="sm"
            disabled={!inputValue.trim() || state.loading || state.activeModels.length === 0}
            className="bg-gruv-medium hover:bg-gruv-aqua text-gruv-light hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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