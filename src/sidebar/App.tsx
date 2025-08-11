import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { ChatHistory } from './components/ChatHistory';
import { ModelPills } from './components/ModelPills';
import { InputArea } from './components/InputArea';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { EXTENSION_INFO } from '@/shared/constants';
import { logger } from '@/lib/logger';

function AppContent() {
  const { state } = useApp();

  logger.log('App: Rendering with state:', {
    models: state.models?.length || 0,
    modelDetails: state.models?.map((m) => ({
      id: m.id,
      name: m.name,
      active: m.active,
    })),
    loading: state.loading,
    error: state.error,
  });

  if (state.loading) {
    return (
      <div className="flex flex-col h-screen bg-gruv-dark text-gruv-light font-mono">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-4xl animate-pulse">🤖</div>
            <p className="text-sm text-gruv-light-soft">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex flex-col h-screen bg-gruv-dark text-gruv-light font-mono">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <p className="text-sm text-gruv-red-bright">{state.error}</p>
            <Button
              onClick={() => window.location.reload()}
              size="sm"
              className="bg-gruv-blue hover:bg-gruv-blue-bright"
            >
              Reload
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const allModels = state.models || [];
  logger.log(
    'App: allModels for rendering:',
    allModels.length,
    allModels.map((m) => ({ id: m.id, name: m.name, active: m.active }))
  );

  return (
    <div className="flex flex-col h-screen bg-gruv-dark text-gruv-light font-mono">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gruv-medium">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gruv-light hover:bg-gruv-medium"
            title="Back to chat history"
          >
            ←
          </Button>
          <button
            className="text-sm hover:text-gruv-yellow-bright transition-colors"
            title="Click to rename chat"
          >
            🗣️ {state.currentSession?.name || 'New Chat'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gruv-light-soft">
            {EXTENSION_INFO.VERSION}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gruv-light hover:bg-gruv-medium"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Model Pills */}
      {allModels.length > 0 && (
        <div className="p-3 border-b border-gruv-medium">
          <ModelPills models={allModels} />
        </div>
      )}

      {/* Chat History */}
      <ChatHistory
        messages={state.currentSession?.messages || []}
        className="flex-1"
      />

      {/* Input Area */}
      <InputArea />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
