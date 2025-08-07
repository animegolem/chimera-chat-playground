import React, { useEffect, useRef } from 'react';
import { Message } from '@/shared/types';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RichMessageContent } from './RichMessageContent';

interface ChatHistoryProps {
  messages: Message[];
  className?: string;
}

export function ChatHistory({ messages, className = '' }: ChatHistoryProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages]);

  return (
    <ScrollArea ref={scrollAreaRef} className={`flex-1 p-4 custom-scrollbar ${className}`}>
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gruv-medium">
            <div className="text-center space-y-2">
              <div className="text-4xl">💬</div>
              <p className="text-sm">Start a conversation...</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        {/* Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  if (message.type === 'user') {
    return (
      <Card className="p-4 bg-secondary border-primary group relative">
        <div className="flex items-start gap-2">
          <span className="text-gruv-yellow-bright">👤 YOU</span>
        </div>
        {/* IAC-114: User messages from LexicalEditor should also support rich formatting */}
        <RichMessageContent 
          content={message.content} 
          className="mt-2 text-sm"
        />
        <div className="mt-2 flex justify-between text-xs text-gruv-medium">
          <span>{new Date(message.timestamp).toLocaleDateString()}</span>
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
        </div>

        {/* Hover UI for user messages */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            className="text-gruv-light hover:text-gruv-green-bright p-1 rounded bg-gruv-dark-soft hover:bg-gruv-medium transition-colors"
            title="Re-prompt with this message"
          >
            ↻
          </button>
          <button
            className="text-gruv-light hover:text-gruv-yellow-bright p-1 rounded bg-gruv-dark-soft hover:bg-gruv-medium transition-colors"
            title="Edit message"
          >
            ✎
          </button>
          <button
            className="text-gruv-light hover:text-gruv-blue-bright p-1 rounded bg-gruv-dark-soft hover:bg-gruv-medium transition-colors"
            title="Copy message"
          >
            ✂
          </button>
          <button
            className="text-gruv-light hover:text-gruv-red-bright p-1 rounded bg-gruv-dark-soft hover:bg-gruv-medium transition-colors"
            title="Delete message"
          >
            🗑
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="p-4 bg-secondary border group relative"
      style={{ borderColor: message.model?.color || '#8ec07c' }}
    >
      <div className="flex items-start gap-2">
        <span>{message.model?.emoji || '🤖'}</span>
        <span
          className="text-sm font-medium"
          style={{ color: message.model?.color || '#8ec07c' }}
        >
          [{message.model?.name || 'AI'}]
        </span>
      </div>
      {/* IAC-114: Use RichMessageContent for AI responses, plain text for user */}
      <RichMessageContent 
        content={message.content} 
        className="mt-2 text-sm"
      />
      <div className="mt-2 flex justify-between text-xs text-gruv-medium">
        <span>{new Date(message.timestamp).toLocaleDateString()}</span>
        <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
      </div>

      {/* Hover UI for AI messages */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          className="text-gruv-light hover:text-gruv-green-bright p-1 rounded bg-gruv-dark-soft hover:bg-gruv-medium transition-colors"
          title="Reload response"
        >
          ↻
        </button>
        <button
          className="text-gruv-light hover:text-gruv-blue-bright p-1 rounded bg-gruv-dark-soft hover:bg-gruv-medium transition-colors"
          title="Copy response"
        >
          ✂
        </button>
        <button
          className="text-gruv-light hover:text-gruv-red-bright p-1 rounded bg-gruv-dark-soft hover:bg-gruv-medium transition-colors"
          title="Delete response"
        >
          🗑
        </button>
      </div>
    </Card>
  );
}
