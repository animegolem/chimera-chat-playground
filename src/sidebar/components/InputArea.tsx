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
        <Textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleComposition}
          onCompositionEnd={handleComposition}
          placeholder="Write your prompt..."
          className="min-h-[80px] bg-secondary border-primary text-primary placeholder-gruv-medium resize-none pr-2"
          style={{ fontFamily: 'Hack, monospace' }}
          disabled={state.loading}
        />
        {/* Terminal cursor */}
        <div
          className="absolute top-2 right-2 w-0.5 h-5 bg-gruv-green-bright terminal-cursor"
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-gruv-light-soft">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 opacity-50">
            <Paperclip className="h-3 w-3" />
            Files (coming soon)
          </span>
          {state.currentSelection && (
            <span className="text-gruv-aqua-bright">
              📄 {state.highlightedLines} lines highlighted
            </span>
          )}
          {state.activeModels.length === 0 && (
            <span className="text-gruv-red-bright">
              ⚠ No models selected
            </span>
          )}
        </div>
        <Button
          onClick={handleSend}
          size="sm"
          disabled={!inputValue.trim() || state.loading || state.activeModels.length === 0}
          className="bg-gruv-blue hover:bg-gruv-blue-bright text-gruv-dark"
        >
          <Zap className="h-3 w-3 mr-1" />
          {state.loading ? 'Sending...' : 'Send (Ctrl+Enter)'}
        </Button>
      </div>
    </div>
  );
}