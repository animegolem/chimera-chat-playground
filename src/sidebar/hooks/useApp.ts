import { useEffect } from 'react';
import { useModels } from './useModels';
import { useChat } from './useChat';
import { useSelection } from './useSelection';
import { useStorage } from './useStorage';
import { logger } from '@/lib/logger';

interface UseAppReturn {
  // Models
  models: ReturnType<typeof useModels>['models'];
  activeModelIds: ReturnType<typeof useModels>['activeModelIds'];
  modelColors: ReturnType<typeof useModels>['modelColors'];
  modelsLoading: boolean;
  modelsError: string | null;
  toggleModel: ReturnType<typeof useModels>['toggleModel'];
  updateModel: ReturnType<typeof useModels>['updateModel'];
  addModel: ReturnType<typeof useModels>['addModel'];
  discoverModels: ReturnType<typeof useModels>['discoverModels'];
  getActiveModels: ReturnType<typeof useModels>['getActiveModels'];
  getModelById: ReturnType<typeof useModels>['getModelById'];
  getModelColor: ReturnType<typeof useModels>['getModelColor'];
  isModelActive: ReturnType<typeof useModels>['isModelActive'];

  // Chat
  currentSession: ReturnType<typeof useChat>['currentSession'];
  sending: ReturnType<typeof useChat>['sending'];
  chatError: string | null;
  sendMessage: (content: string) => Promise<void>;
  deleteMessage: ReturnType<typeof useChat>['deleteMessage'];
  updateMessage: ReturnType<typeof useChat>['updateMessage'];
  copyMessage: ReturnType<typeof useChat>['copyMessage'];
  createNewSession: ReturnType<typeof useChat>['createNewSession'];
  loadSession: ReturnType<typeof useChat>['loadSession'];

  // Selection
  currentSelection: ReturnType<typeof useSelection>['currentSelection'];
  highlightedLines: ReturnType<typeof useSelection>['highlightedLines'];

  // Overall state
  loading: boolean;
  sidebarOpen: boolean;
}

export function useApp(): UseAppReturn {
  const models = useModels();
  const chat = useChat(models.models);
  const selection = useSelection();
  const storage = useStorage();

  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.log('useApp: Starting app initialization...');

        // Load current session if it exists
        const currentSession = await storage.loadCurrentSession();
        if (currentSession) {
          chat.setCurrentSession(currentSession);
        } else {
          // Create new session if none exists
          await chat.createNewSession();
        }

        logger.log('useApp: App initialization complete');
      } catch (error) {
        logger.error('useApp: Failed to initialize app:', error);
      }
    };

    // Only initialize once models are loaded
    if (models.models.length > 0 && !models.loading) {
      initializeApp();
    }
  }, [models.models.length, models.loading, chat, storage]);

  // Simplified sendMessage that uses active models
  const sendMessage = async (content: string) => {
    await chat.sendMessage(content, models.models);
  };

  return {
    // Models
    models: models.models,
    activeModelIds: models.activeModelIds,
    modelColors: models.modelColors,
    modelsLoading: models.loading,
    modelsError: models.error,
    toggleModel: models.toggleModel,
    updateModel: models.updateModel,
    addModel: models.addModel,
    discoverModels: models.discoverModels,
    getActiveModels: models.getActiveModels,
    getModelById: models.getModelById,
    getModelColor: models.getModelColor,
    isModelActive: models.isModelActive,

    // Chat
    currentSession: chat.currentSession,
    sending: chat.sending,
    chatError: chat.error,
    sendMessage,
    deleteMessage: chat.deleteMessage,
    updateMessage: chat.updateMessage,
    copyMessage: chat.copyMessage,
    createNewSession: chat.createNewSession,
    loadSession: chat.loadSession,

    // Selection
    currentSelection: selection.currentSelection,
    highlightedLines: selection.highlightedLines,

    // Overall state
    loading: models.loading,
    sidebarOpen: true, // Simplified for now
  };
}
