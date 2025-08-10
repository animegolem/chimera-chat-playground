import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Message } from '@/shared/types';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RichMessageContent } from './RichMessageContent';
import { useApp } from '@/sidebar/contexts/AppContext';

interface ChatHistoryProps {
  messages: Message[];
  className?: string;
}

export function ChatHistory({ messages, className = '' }: ChatHistoryProps) {
  const { state, modelHelpers } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or when thinking state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [messages, state.sending]);

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

        {/* Thinking indicator when sending */}
        {state.sending &&
          (() => {
            const firstActiveModelId = state.activeModelIds[0];
            const thinkingColor = firstActiveModelId
              ? modelHelpers.getModelColor(firstActiveModelId)
              : '#8ec07c';

            return (
              <Card
                className="p-4 bg-secondary border"
                style={{ borderColor: thinkingColor }}
              >
                <div className="flex items-center justify-center">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: thinkingColor,
                        animationDelay: '0ms',
                      }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: thinkingColor,
                        animationDelay: '150ms',
                      }}
                    ></div>
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{
                        backgroundColor: thinkingColor,
                        animationDelay: '300ms',
                      }}
                    ></div>
                  </div>
                </div>
              </Card>
            );
          })()}

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
  const { actions } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 450) + 'px';
    }
  }, []);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      adjustTextareaHeight();
      textareaRef.current.focus();
    }
  }, [isEditing, adjustTextareaHeight]);

  const handleCopy = async () => {
    await actions.copyMessage(message.content);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1000);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(message.content);
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() !== message.content) {
      await actions.updateMessage(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    await actions.deleteMessage(message.id);
    setShowDeleteConfirm(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };
  if (message.type === 'user') {
    return (
      <Card className="p-4 bg-secondary border-primary group relative">
        <div className="flex items-start gap-2">
          <span className="text-gruv-yellow-bright">👤 YOU</span>
        </div>

        {isEditing ? (
          <div className="mt-2">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                adjustTextareaHeight();
              }}
              className="w-full p-2 bg-gruv-dark border border-gruv-medium rounded text-gruv-light font-mono text-sm resize-none min-h-[60px] max-h-[450px] overflow-y-auto"
              placeholder="Edit your message..."
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="px-2 py-1 bg-gruv-green-bright text-gruv-dark text-xs rounded hover:bg-gruv-green-bright-hover transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-2 py-1 bg-gruv-medium text-gruv-light text-xs rounded hover:bg-gruv-medium-soft transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <RichMessageContent
            content={message.content}
            className="mt-2 text-sm"
          />
        )}

        <div className="mt-2 flex justify-between text-xs text-gruv-medium">
          <span>{new Date(message.timestamp).toLocaleDateString()}</span>
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
        </div>

        {/* Hover UI for user messages */}
        {!isEditing && !showDeleteConfirm && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              className="text-gruv-light hover:text-gruv-green-bright p-1 rounded bg-gruv-dark-soft hover:bg-gruv-medium transition-colors"
              title="Re-prompt with this message"
            >
              ↻
            </button>
            <button
              onClick={handleEdit}
              className="text-gruv-light hover:text-gruv-yellow-bright p-1 rounded bg-gruv-dark-soft hover:bg-gruv-medium transition-colors"
              title="Edit message"
            >
              ✎
            </button>
            <button
              onClick={handleCopy}
              className="text-gruv-light hover:text-gruv-blue-bright p-1 rounded bg-gruv-dark-soft hover:bg-gruv-medium transition-colors"
              title="Copy message"
              style={copyFeedback ? { color: '#b8bb26' } : {}}
            >
              {copyFeedback ? '✓' : '✂'}
            </button>
            <button
              onClick={handleDeleteClick}
              className="text-gruv-light hover:text-gruv-red-bright p-1 rounded bg-gruv-dark-soft hover:bg-gruv-medium transition-colors"
              title="Delete message"
            >
              🗑
            </button>
          </div>
        )}

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="absolute top-2 right-2 bg-gruv-dark border border-gruv-medium rounded-md p-2 shadow-lg z-10">
            <div className="text-xs text-gruv-light mb-2">
              Delete this message?
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleDelete}
                className="px-2 py-1 bg-gruv-red-bright text-gruv-dark text-xs rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={handleDeleteCancel}
                className="px-2 py-1 bg-gruv-medium text-gruv-light text-xs rounded hover:bg-gruv-medium-soft transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
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
      <RichMessageContent content={message.content} className="mt-2 text-sm" />
      <div className="mt-2 flex justify-between text-xs text-gruv-medium">
        <span>{new Date(message.timestamp).toLocaleDateString()}</span>
        <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
      </div>

      {/* Hover UI for AI messages */}
      {!showDeleteConfirm && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            className="text-gruv-light hover:text-gruv-green-bright p-1 rounded bg-gruv-dark-soft hover:bg-gruv-medium transition-colors"
            title="Reload response"
          >
            ↻
          </button>
          <button
            onClick={handleCopy}
            className="text-gruv-light hover:text-gruv-blue-bright p-1 rounded bg-gruv-dark-soft hover:bg-gruv-medium transition-colors"
            title="Copy response"
            style={copyFeedback ? { color: '#b8bb26' } : {}}
          >
            {copyFeedback ? '✓' : '✂'}
          </button>
          <button
            onClick={handleDeleteClick}
            className="text-gruv-light hover:text-gruv-red-bright p-1 rounded bg-gruv-dark-soft hover:bg-gruv-medium transition-colors"
            title="Delete response"
          >
            🗑
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="absolute top-2 right-2 bg-gruv-dark border border-gruv-medium rounded-md p-2 shadow-lg z-10">
          <div className="text-xs text-gruv-light mb-2">
            Delete this response?
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleDelete}
              className="px-2 py-1 bg-gruv-red-bright text-gruv-dark text-xs rounded hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={handleDeleteCancel}
              className="px-2 py-1 bg-gruv-medium text-gruv-light text-xs rounded hover:bg-gruv-medium-soft transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
