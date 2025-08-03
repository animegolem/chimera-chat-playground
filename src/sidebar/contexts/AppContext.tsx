import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import {
  AppState,
  Message,
  ModelInfo,
  ChatSession,
  SelectionInfo,
} from '@/shared/types';
import { DEFAULT_MODELS } from '@/shared/constants';
import { storage } from '@/lib/storage';
import { BackgroundMessage, ContentMessage } from '@/shared/messages';

// Action types
type AppAction =
  | { type: 'SET_MODELS'; models: ModelInfo[] }
  | { type: 'TOGGLE_MODEL'; modelId: string }
  | { type: 'UPDATE_MODEL'; modelId: string; updates: Partial<ModelInfo> }
  | { type: 'SET_CURRENT_SESSION'; session: ChatSession | null }
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'SET_SELECTION'; selection: SelectionInfo | null }
  | { type: 'SET_HIGHLIGHTED_LINES'; count: number }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null };

// Initial state
const initialState: AppState & { loading: boolean; error: string | null } = {
  currentSession: null,
  sessions: [],
  activeModels: [],
  currentSelection: null,
  highlightedLines: 0,
  sidebarOpen: true,
  loading: false,
  error: null,
};

// Reducer
function appReducer(
  state: typeof initialState,
  action: AppAction
): typeof initialState {
  switch (action.type) {
    case 'SET_MODELS':
      return {
        ...state,
        activeModels: action.models.filter((m) => m.active).map((m) => m.id),
      };

    case 'TOGGLE_MODEL':
      // This will be handled by background script and reflected in SET_MODELS
      return state;

    case 'UPDATE_MODEL':
      // This will be handled by background script and reflected in SET_MODELS
      return state;

    case 'SET_CURRENT_SESSION':
      return {
        ...state,
        currentSession: action.session,
      };

    case 'ADD_MESSAGE':
      if (!state.currentSession) return state;

      const updatedSession = {
        ...state.currentSession,
        messages: [...state.currentSession.messages, action.message],
        updatedAt: Date.now(),
      };

      return {
        ...state,
        currentSession: updatedSession,
      };

    case 'SET_SELECTION':
      return {
        ...state,
        currentSelection: action.selection,
        highlightedLines: action.selection
          ? action.selection.text.split('\n').length
          : 0,
      };

    case 'SET_HIGHLIGHTED_LINES':
      return {
        ...state,
        highlightedLines: action.count,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.loading,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
      };

    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: typeof initialState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    toggleModel: (modelId: string) => Promise<void>;
    updateModel: (
      modelId: string,
      updates: Partial<ModelInfo>
    ) => Promise<void>;
    sendMessage: (content: string, modelIds: string[]) => Promise<void>;
    createNewSession: () => Promise<void>;
    loadSession: (sessionId: string) => Promise<void>;
  };
}

const AppContext = createContext<AppContextType | null>(null);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
    setupMessageListeners();
  }, []);

  async function initializeApp() {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });

      // Load models from storage
      const models = await storage.getModels();
      if (models.length > 0) {
        dispatch({ type: 'SET_MODELS', models });
      } else {
        // Initialize with defaults
        const defaultModels = Object.values(DEFAULT_MODELS);
        await storage.saveModels(defaultModels);
        dispatch({ type: 'SET_MODELS', models: defaultModels });
      }

      // Load current session
      const currentSessionId = await storage.getCurrentSessionId();
      if (currentSessionId) {
        const sessions = await storage.getSessions();
        const session = sessions.find((s) => s.id === currentSessionId);
        if (session) {
          dispatch({ type: 'SET_CURRENT_SESSION', session });
        }
      }

      // If no session, create one
      if (!currentSessionId) {
        await createNewSession();
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      dispatch({ type: 'SET_ERROR', error: 'Failed to initialize app' });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }

  function setupMessageListeners() {
    // Listen for messages from background and content scripts
    browser.runtime.onMessage.addListener(
      (message: BackgroundMessage | ContentMessage) => {
        switch (message.type) {
          case 'TAB_GROUP_NAMED':
            // Could show a notification or update UI
            console.log('Tab group named:', message.name);
            break;

          case 'CONTEXT_MENU_SELECTION':
            if (message.text) {
              dispatch({
                type: 'SET_SELECTION',
                selection: {
                  text: message.text,
                  url: message.url || '',
                  title: message.title || '',
                  timestamp: message.timestamp || Date.now(),
                },
              });
            }
            break;

          case 'TEXT_SELECTED':
            if (message.text) {
              dispatch({
                type: 'SET_SELECTION',
                selection: {
                  text: message.text,
                  url: message.url || '',
                  title: message.title || '',
                  timestamp: message.timestamp || Date.now(),
                },
              });
            }
            break;

          case 'TEXT_SELECTION_CLEARED':
            dispatch({ type: 'SET_SELECTION', selection: null });
            break;
        }
      }
    );
  }

  // Action implementations
  async function toggleModel(modelId: string) {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'TOGGLE_MODEL',
        modelId,
      });

      if (response.success) {
        // Reload models to reflect change
        const models = await storage.getModels();
        dispatch({ type: 'SET_MODELS', models });
      } else {
        dispatch({ type: 'SET_ERROR', error: response.error });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to toggle model' });
    }
  }

  async function updateModel(modelId: string, updates: Partial<ModelInfo>) {
    try {
      const response = await browser.runtime.sendMessage({
        type: 'UPDATE_MODEL_SETTINGS',
        modelId,
        modelSettings: updates,
      });

      if (response.success) {
        // Reload models to reflect change
        const models = await storage.getModels();
        dispatch({ type: 'SET_MODELS', models });
      } else {
        dispatch({ type: 'SET_ERROR', error: response.error });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to update model' });
    }
  }

  async function sendMessage(content: string, modelIds: string[]) {
    if (!state.currentSession) return;

    try {
      // Add user message
      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        type: 'user',
        content,
        timestamp: Date.now(),
      };

      dispatch({ type: 'ADD_MESSAGE', message: userMessage });

      // TODO: Send to LLM service and handle response
      // For now, add a placeholder AI response
      setTimeout(() => {
        const aiMessage: Message = {
          id: `msg-${Date.now()}-ai`,
          type: 'ai',
          content:
            'This is a placeholder response. LLM integration coming in Phase 4!',
          timestamp: Date.now(),
          model: {
            id: modelIds[0],
            name: 'Placeholder',
            emoji: '🤖',
            color: '#8ec07c',
            type: 'local',
            active: true,
            settings: { temperature: 0.7, systemPrompt: '' },
          },
        };

        dispatch({ type: 'ADD_MESSAGE', message: aiMessage });
      }, 1000);

      // Save session
      const updatedSession = {
        ...state.currentSession,
        messages: [...state.currentSession.messages, userMessage],
        updatedAt: Date.now(),
      };

      await storage.saveSession(updatedSession);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to send message' });
    }
  }

  async function createNewSession() {
    try {
      const models = await storage.getModels();
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
      dispatch({ type: 'SET_CURRENT_SESSION', session: newSession });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to create session' });
    }
  }

  async function loadSession(sessionId: string) {
    try {
      const sessions = await storage.getSessions();
      const session = sessions.find((s) => s.id === sessionId);

      if (session) {
        await storage.setCurrentSessionId(sessionId);
        dispatch({ type: 'SET_CURRENT_SESSION', session });
      } else {
        dispatch({ type: 'SET_ERROR', error: 'Session not found' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to load session' });
    }
  }

  const contextValue: AppContextType = {
    state,
    dispatch,
    actions: {
      toggleModel,
      updateModel,
      sendMessage,
      createNewSession,
      loadSession,
    },
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
