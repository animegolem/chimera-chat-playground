import React from 'react';
import { Message } from '@/shared/types';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatHistoryProps {
  messages: Message[];
  className?: string;
}

export function ChatHistory({ messages, className = '' }: ChatHistoryProps) {
  return (
    <ScrollArea className={`flex-1 p-4 custom-scrollbar ${className}`}>
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
      <Card className="p-4 bg-secondary border-primary">
        <div className="flex items-start gap-2">
          <span className="text-gruv-yellow-bright">👤 YOU</span>
        </div>
        <div className="mt-2 text-sm whitespace-pre-wrap">
          {message.content}
        </div>
        <div className="mt-2 text-xs text-gruv-medium">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="p-4 bg-secondary border-l-2"
      style={{ borderLeftColor: message.model?.color || '#8ec07c' }}
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
      <div className="mt-2 text-sm whitespace-pre-wrap">
        {message.content}
      </div>
      <div className="mt-2 text-xs text-gruv-medium">
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
    </Card>
  );
}