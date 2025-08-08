import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
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
// LLM requests now go through background script to bypass CORS

// Action types
type AppAction =
  | { type: 'SET_MODELS'; models: ModelInfo[] }
  | { type: 'TOGGLE_MODEL'; modelId: string }
  | { type: 'UPDATE_MODEL'; modelId: string; updates: Partial<ModelInfo> }
  | { type: 'SET_CURRENT_SESSION'; session: ChatSession | null }
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'DELETE_MESSAGE'; messageId: string }
  | { type: 'UPDATE_MESSAGE'; messageId: string; content: string }
  | { type: 'SET_SELECTION'; selection: SelectionInfo | null }
  | { type: 'SET_HIGHLIGHTED_LINES'; count: number }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SENDING'; sending: boolean }
  | { type: 'SET_ERROR'; error: string | null };

// Initial state
const initialState: AppState & {
  loading: boolean;
  error: string | null;
  sending: boolean;
} = {
  currentSession: null,
  sessions: [],
  activeModels: [],
  currentSelection: null,
  highlightedLines: 0,
  sidebarOpen: true,
  loading: false,
  sending: false,
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

    case 'DELETE_MESSAGE':
      if (!state.currentSession) return state;

      const sessionWithDeletedMessage = {
        ...state.currentSession,
        messages: state.currentSession.messages.filter(
          (msg) => msg.id !== action.messageId
        ),
        updatedAt: Date.now(),
      };

      return {
        ...state,
        currentSession: sessionWithDeletedMessage,
      };

    case 'UPDATE_MESSAGE':
      if (!state.currentSession) return state;

      const sessionWithUpdatedMessage = {
        ...state.currentSession,
        messages: state.currentSession.messages.map((msg) =>
          msg.id === action.messageId
            ? { ...msg, content: action.content, updatedAt: Date.now() }
            : msg
        ),
        updatedAt: Date.now(),
      };

      return {
        ...state,
        currentSession: sessionWithUpdatedMessage,
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

    case 'SET_SENDING':
      return {
        ...state,
        sending: action.sending,
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
    deleteMessage: (messageId: string) => Promise<void>;
    updateMessage: (messageId: string, content: string) => Promise<void>;
    copyMessage: (content: string) => Promise<void>;
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

  // LLM service now handled by background script - no initialization needed

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

      // LLM service handled by background script
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

      // Handle case where response is undefined (background script not responding)
      if (!response) {
        dispatch({ type: 'SET_ERROR', error: 'No response from background script' });
        return;
      }

      if (response.success) {
        // Reload models to reflect change
        const models = await storage.getModels();
        dispatch({ type: 'SET_MODELS', models });
      } else {
        dispatch({ type: 'SET_ERROR', error: response.error || 'Unknown error' });
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

      // Handle case where response is undefined (background script not responding)
      if (!response) {
        dispatch({ type: 'SET_ERROR', error: 'No response from background script' });
        return;
      }

      if (response.success) {
        // Reload models to reflect change
        const models = await storage.getModels();
        dispatch({ type: 'SET_MODELS', models });
      } else {
        dispatch({ type: 'SET_ERROR', error: response.error || 'Unknown error' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to update model' });
    }
  }

  // Track recent send attempts to prevent duplicates
  const sendDedupeMap = useRef(new Map<string, number>());

  async function sendMessage(content: string, modelIds: string[]) {
    if (!state.currentSession || state.sending) return;

    // Generate unique send ID based on content and timestamp
    const sendId = `${content.substring(0, 20)}-${Date.now()}`;
    const lastSend = sendDedupeMap.current.get(sendId) || 0;

    // Reject if same content sent within 500ms
    if (Date.now() - lastSend < 500) {
      console.warn('[AppContext] Duplicate send rejected', {
        sendId,
        contentPreview: content.substring(0, 30) + '...',
        timeSinceLastSend: Date.now() - lastSend,
      });
      return;
    }

    sendDedupeMap.current.set(sendId, Date.now());

    try {
      dispatch({ type: 'SET_SENDING', sending: true });

      // Add user message
      const userMessage: Message = {
        id: `msg-${Date.now()}-user`,
        type: 'user',
        content,
        timestamp: Date.now(),
      };

      dispatch({ type: 'ADD_MESSAGE', message: userMessage });

      // Send LLM request through background script (bypasses CORS)
      // Build conversation history
      const messages = state.currentSession.messages.map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
        timestamp: msg.timestamp
      }));

      // Add current message
      messages.push({
        role: 'user' as const,
        content,
        timestamp: Date.now()
      });

      const llmRequest = {
        messages,
        model: 'gemma3:4b', // Use a reliable model
        temperature: 0.7,
        maxTokens: 2048,
      };

      const response = await browser.runtime.sendMessage({
        type: 'LLM_CHAT_REQUEST',
        llmRequest,
      });

      // Handle case where response is undefined
      if (!response) {
        throw new Error('No response from background script');
      }

      try {
        if (response.success) {
          const aiMessage: Message = {
            id: `msg-${Date.now()}-ai`,
            type: 'ai',
            content: response.response || 'No response from model',
            timestamp: Date.now(),
            model: {
              id: response.model || 'gemma3:4b',
              name: response.model || 'Gemma 3 4B',
              emoji: '💎', // Gemma emoji
              color: '#83a598',
              type: 'local',
              active: true,
              settings: { temperature: 0.7, systemPrompt: '' },
            },
          };

        dispatch({ type: 'ADD_MESSAGE', message: aiMessage });
        
        // Update and save session with both messages
        const updatedSession = {
          ...state.currentSession,
          messages: [...state.currentSession.messages, userMessage, aiMessage],
          updatedAt: Date.now(),
        };
          await storage.saveSession(updatedSession);
        } else {
          // Handle API error from background script
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
          
          dispatch({ type: 'ADD_MESSAGE', message: errorMessage });
          
          // Save session with both user message and error
          const updatedSession = {
            ...state.currentSession,
            messages: [...state.currentSession.messages, userMessage, errorMessage],
            updatedAt: Date.now(),
          };
          await storage.saveSession(updatedSession);
        }
      } catch (error) {
        console.error('LLM request failed:', error);
        
        // Add error message for network/communication errors
        const errorMessage: Message = {
          id: `msg-${Date.now()}-ai-error`,
          type: 'ai',
          content: `Sorry, I encountered a communication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
        
        dispatch({ type: 'ADD_MESSAGE', message: errorMessage });
        
        // Save session with user message and error
        const updatedSession = {
          ...state.currentSession,
          messages: [...state.currentSession.messages, userMessage, errorMessage],
          updatedAt: Date.now(),
        };
        await storage.saveSession(updatedSession);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to send message' });
    } finally {
      dispatch({ type: 'SET_SENDING', sending: false });
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

  async function deleteMessage(messageId: string) {
    try {
      dispatch({ type: 'DELETE_MESSAGE', messageId });
      
      // Save updated session to storage
      if (state.currentSession) {
        const updatedSession = {
          ...state.currentSession,
          messages: state.currentSession.messages.filter(
            (msg) => msg.id !== messageId
          ),
          updatedAt: Date.now(),
        };
        await storage.saveSession(updatedSession);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to delete message' });
    }
  }

  async function updateMessage(messageId: string, content: string) {
    try {
      dispatch({ type: 'UPDATE_MESSAGE', messageId, content });
      
      // Save updated session to storage
      if (state.currentSession) {
        const updatedSession = {
          ...state.currentSession,
          messages: state.currentSession.messages.map((msg) =>
            msg.id === messageId
              ? { ...msg, content, updatedAt: Date.now() }
              : msg
          ),
          updatedAt: Date.now(),
        };
        await storage.saveSession(updatedSession);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to update message' });
    }
  }

  async function copyMessage(content: string) {
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
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: 'Failed to copy message' });
    }
  }

  const contextValue: AppContextType = {
    state,
    dispatch,
    actions: {
      toggleModel,
      updateModel,
      sendMessage,
      deleteMessage,
      updateMessage,
      copyMessage,
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
