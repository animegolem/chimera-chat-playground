import { useCallback } from 'react';
import { ChatSession } from '@/shared/types';
import { storage } from '@/lib/storage';
import { logger } from '@/lib/logger';

interface UseStorageReturn {
  loadCurrentSession: () => Promise<ChatSession | null>;
  saveSessions: (sessions: ChatSession[]) => Promise<void>;
  getCurrentSessionId: () => Promise<string | null>;
  setCurrentSessionId: (sessionId: string) => Promise<void>;
}

export function useStorage(): UseStorageReturn {
  const loadCurrentSession =
    useCallback(async (): Promise<ChatSession | null> => {
      try {
        const currentSessionId = await storage.getCurrentSessionId();
        if (!currentSessionId) {
          return null;
        }

        const sessions = await storage.getSessions();
        const session = sessions.find((s) => s.id === currentSessionId);

        if (session) {
          logger.log('useStorage: Loaded current session:', session.id);
          return session;
        }

        logger.warn('useStorage: Current session not found:', currentSessionId);
        return null;
      } catch (error) {
        logger.error('useStorage: Failed to load current session:', error);
        return null;
      }
    }, []);

  const saveSessions = useCallback(
    async (sessions: ChatSession[]): Promise<void> => {
      try {
        await Promise.all(
          sessions.map((session) => storage.saveSession(session))
        );
        logger.log('useStorage: Saved', sessions.length, 'sessions');
      } catch (error) {
        logger.error('useStorage: Failed to save sessions:', error);
        throw error;
      }
    },
    []
  );

  const getCurrentSessionId = useCallback(async (): Promise<string | null> => {
    try {
      return await storage.getCurrentSessionId();
    } catch (error) {
      logger.error('useStorage: Failed to get current session ID:', error);
      return null;
    }
  }, []);

  const setCurrentSessionId = useCallback(
    async (sessionId: string): Promise<void> => {
      try {
        await storage.setCurrentSessionId(sessionId);
        logger.log('useStorage: Set current session ID:', sessionId);
      } catch (error) {
        logger.error('useStorage: Failed to set current session ID:', error);
        throw error;
      }
    },
    []
  );

  return {
    loadCurrentSession,
    saveSessions,
    getCurrentSessionId,
    setCurrentSessionId,
  };
}
