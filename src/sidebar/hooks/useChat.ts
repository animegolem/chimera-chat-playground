import { useState, useRef, useCallback } from 'react';
import { Message, ChatSession, ModelInfo } from '@/shared/types';
import { storage } from '@/lib/storage';
import { logger } from '@/lib/logger';

interface UseChatReturn {
  currentSession: ChatSession | null;
  sending: boolean;
  error: string | null;
  sendMessage: (content: string, models: ModelInfo[]) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  updateMessage: (messageId: string, content: string) => Promise<void>;
  copyMessage: (content: string) => Promise<void>;
  createNewSession: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  setCurrentSession: (session: ChatSession | null) => void;
}

export function useChat(models: ModelInfo[]): UseChatReturn {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track recent send attempts to prevent duplicates
  const sendDedupeMap = useRef(new Map<string, number>());

  const sendMessage = useCallback(
    async (content: string, availableModels: ModelInfo[]) => {
      if (!currentSession || sending) return;

      // Generate unique send ID based on content and timestamp
      const sendId = `${content.substring(0, 20)}-${Date.now()}`;
      const lastSend = sendDedupeMap.current.get(sendId) || 0;

      // Reject if same content sent within 500ms
      if (Date.now() - lastSend < 500) {
        logger.warn('useChat: Duplicate send rejected', {
          sendId,
          contentPreview: content.substring(0, 30) + '...',
          timeSinceLastSend: Date.now() - lastSend,
        });
        return;
      }

      sendDedupeMap.current.set(sendId, Date.now());

      try {
        setSending(true);
        setError(null);

        // Add user message
        const userMessage: Message = {
          id: `msg-${Date.now()}-user`,
          type: 'user',
          content,
          timestamp: Date.now(),
        };

        // Update current session with user message
        const updatedSession = {
          ...currentSession,
          messages: [...currentSession.messages, userMessage],
          updatedAt: Date.now(),
        };
        setCurrentSession(updatedSession);

        // Save session with user message immediately so it persists during loading
        await storage.saveSession(updatedSession);

        // Build conversation history for LLM
        const messages = updatedSession.messages.map((msg) => ({
          role:
            msg.type === 'user' ? ('user' as const) : ('assistant' as const),
          content: msg.content,
          timestamp: msg.timestamp,
        }));

        // Select the first active model, fallback to first available
        const activeModels = availableModels.filter((m) => m.active);
        const selectedModel =
          activeModels.length > 0
            ? activeModels[0]
            : availableModels[0] || {
                id: 'gemma3:4b',
                name: 'Gemma 3 4B',
                emoji: '💎',
                color: '#83a598',
                type: 'local' as const,
                active: false,
                settings: {
                  temperature: 0.7,
                  systemPrompt: 'You are a helpful AI assistant.',
                },
              };

        logger.log('useChat: Selected model for request:', selectedModel.id);

        const llmRequest = {
          messages,
          model: selectedModel.id,
          temperature: selectedModel.settings.temperature || 0.7,
          maxTokens: selectedModel.settings.maxTokens || 2048,
          systemPrompt:
            selectedModel.settings.systemPrompt ||
            'You are a helpful AI assistant.',
        };

        const response = await browser.runtime.sendMessage({
          type: 'LLM_CHAT_REQUEST',
          llmRequest,
        });

        if (!response) {
          throw new Error('No response from background script');
        }

        if (response.success) {
          const aiMessage: Message = {
            id: `msg-${Date.now()}-ai`,
            type: 'ai',
            content: response.response || 'No response from model',
            timestamp: Date.now(),
            model: {
              id: response.model || selectedModel.id,
              name: response.model || selectedModel.name,
              emoji: selectedModel.emoji,
              color: selectedModel.color,
              type: 'local',
              active: true,
              settings: selectedModel.settings,
            },
          };

          const finalSession = {
            ...updatedSession,
            messages: [...updatedSession.messages, aiMessage],
            updatedAt: Date.now(),
          };

          setCurrentSession(finalSession);
          await storage.saveSession(finalSession);
        } else {
          // Handle API error
          const errorMessage: Message = {
            id: `msg-${Date.now()}-ai-error`,
            type: 'ai',
            content: `Sorry, I encountered an error: ${response.error || 'Unknown error'}`,
            timestamp: Date.now(),
            model: {
              id: 'error',
              name: 'Error',
              emoji: '⚠️',
              color: '#fb4934',
              type: 'local',
              active: false,
              settings: { temperature: 0, systemPrompt: '' },
            },
          };

          const errorSession = {
            ...updatedSession,
            messages: [...updatedSession.messages, errorMessage],
            updatedAt: Date.now(),
          };

          setCurrentSession(errorSession);
          await storage.saveSession(errorSession);
        }
      } catch (err) {
        logger.error('useChat: Message send failed:', err);

        const errorMessage: Message = {
          id: `msg-${Date.now()}-ai-error`,
          type: 'ai',
          content: `Sorry, I encountered a communication error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          timestamp: Date.now(),
          model: {
            id: 'error',
            name: 'Error',
            emoji: '⚠️',
            color: '#fb4934',
            type: 'local',
            active: false,
            settings: { temperature: 0, systemPrompt: '' },
          },
        };

        if (currentSession) {
          const errorSession = {
            ...currentSession,
            messages: [...currentSession.messages, errorMessage],
            updatedAt: Date.now(),
          };

          setCurrentSession(errorSession);
          await storage.saveSession(errorSession);
        }

        setError('Failed to send message');
      } finally {
        setSending(false);
      }
    },
    [currentSession, sending]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!currentSession) return;

      try {
        const updatedSession = {
          ...currentSession,
          messages: currentSession.messages.filter(
            (msg) => msg.id !== messageId
          ),
          updatedAt: Date.now(),
        };

        setCurrentSession(updatedSession);
        await storage.saveSession(updatedSession);
      } catch (err) {
        logger.error('useChat: Failed to delete message:', err);
        setError('Failed to delete message');
      }
    },
    [currentSession]
  );

  const updateMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!currentSession) return;

      try {
        const updatedSession = {
          ...currentSession,
          messages: currentSession.messages.map((msg) =>
            msg.id === messageId
              ? { ...msg, content, updatedAt: Date.now() }
              : msg
          ),
          updatedAt: Date.now(),
        };

        setCurrentSession(updatedSession);
        await storage.saveSession(updatedSession);
      } catch (err) {
        logger.error('useChat: Failed to update message:', err);
        setError('Failed to update message');
      }
    },
    [currentSession]
  );

  const copyMessage = useCallback(async (content: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(content);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (err) {
      logger.error('useChat: Failed to copy message:', err);
      setError('Failed to copy message');
    }
  }, []);

  const createNewSession = useCallback(async () => {
    try {
      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        name: 'New Chat',
        messages: [],
        models,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await storage.saveSession(newSession);
      await storage.setCurrentSessionId(newSession.id);
      setCurrentSession(newSession);
    } catch (err) {
      logger.error('useChat: Failed to create session:', err);
      setError('Failed to create session');
    }
  }, [models]);

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const sessions = await storage.getSessions();
      const session = sessions.find((s) => s.id === sessionId);

      if (session) {
        await storage.setCurrentSessionId(sessionId);
        setCurrentSession(session);
      } else {
        setError('Session not found');
      }
    } catch (err) {
      logger.error('useChat: Failed to load session:', err);
      setError('Failed to load session');
    }
  }, []);

  return {
    currentSession,
    sending,
    error,
    sendMessage,
    deleteMessage,
    updateMessage,
    copyMessage,
    createNewSession,
    loadSession,
    setCurrentSession,
  };
}
