import React, { createContext, useContext, ReactNode } from 'react';
import { useApp as useAppHook } from '../hooks/useApp';

// Backward compatible interface that matches the old AppContext API
interface AppContextType {
  state: {
    currentSession: ReturnType<typeof useAppHook>['currentSession'];
    models: ReturnType<typeof useAppHook>['models'];
    activeModelIds: ReturnType<typeof useAppHook>['activeModelIds'];
    modelColors: ReturnType<typeof useAppHook>['modelColors'];
    activeModels: ReturnType<typeof useAppHook>['activeModelIds']; // Legacy compatibility
    currentSelection: ReturnType<typeof useAppHook>['currentSelection'];
    highlightedLines: ReturnType<typeof useAppHook>['highlightedLines'];
    sidebarOpen: ReturnType<typeof useAppHook>['sidebarOpen'];
    loading: ReturnType<typeof useAppHook>['loading'];
    sending: ReturnType<typeof useAppHook>['sending'];
    error:
      | ReturnType<typeof useAppHook>['modelsError']
      | ReturnType<typeof useAppHook>['chatError'];
  };
  actions: {
    toggleModel: ReturnType<typeof useAppHook>['toggleModel'];
    updateModel: ReturnType<typeof useAppHook>['updateModel'];
    addModel: ReturnType<typeof useAppHook>['addModel'];
    sendMessage: ReturnType<typeof useAppHook>['sendMessage'];
    deleteMessage: ReturnType<typeof useAppHook>['deleteMessage'];
    updateMessage: ReturnType<typeof useAppHook>['updateMessage'];
    copyMessage: ReturnType<typeof useAppHook>['copyMessage'];
    createNewSession: ReturnType<typeof useAppHook>['createNewSession'];
    loadSession: ReturnType<typeof useAppHook>['loadSession'];
  };
  modelHelpers: {
    getActiveModels: ReturnType<typeof useAppHook>['getActiveModels'];
    getModelById: ReturnType<typeof useAppHook>['getModelById'];
    getModelColor: ReturnType<typeof useAppHook>['getModelColor'];
    getAllModels: () => ReturnType<typeof useAppHook>['models'];
    isModelActive: ReturnType<typeof useAppHook>['isModelActive'];
  };
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const appState = useAppHook();

  // Create backward-compatible API
  const contextValue: AppContextType = {
    state: {
      currentSession: appState.currentSession,
      models: appState.models,
      activeModelIds: appState.activeModelIds,
      modelColors: appState.modelColors,
      activeModels: appState.activeModelIds, // Legacy compatibility
      currentSelection: appState.currentSelection,
      highlightedLines: appState.highlightedLines,
      sidebarOpen: appState.sidebarOpen,
      loading: appState.loading,
      sending: appState.sending,
      error: appState.modelsError || appState.chatError,
    },
    actions: {
      toggleModel: appState.toggleModel,
      updateModel: appState.updateModel,
      addModel: appState.addModel,
      sendMessage: appState.sendMessage,
      deleteMessage: appState.deleteMessage,
      updateMessage: appState.updateMessage,
      copyMessage: appState.copyMessage,
      createNewSession: appState.createNewSession,
      loadSession: appState.loadSession,
    },
    modelHelpers: {
      getActiveModels: appState.getActiveModels,
      getModelById: appState.getModelById,
      getModelColor: appState.getModelColor,
      getAllModels: () => appState.models,
      isModelActive: appState.isModelActive,
    },
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
