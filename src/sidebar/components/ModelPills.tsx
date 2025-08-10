import React, { useState } from 'react';
import { ModelInfo } from '@/shared/types';
import { useApp } from '@/sidebar/contexts/AppContext';
import { ModelSettingsModal } from './ModelSettingsModal';

interface ModelPillsProps {
  models: ModelInfo[];
  className?: string;
}

export function ModelPills({ models, className = '' }: ModelPillsProps) {
  const { actions } = useApp();
  const [settingsModal, setSettingsModal] = useState<ModelInfo | null>(null);

  console.log('ModelPills: Rendering with', models.length, 'models:', models.map(m => ({id: m.id, name: m.name, active: m.active})));

  if (models.length === 0) {
    return (
      <div className={`text-xs text-gruv-medium ${className}`}>
        No models configured
      </div>
    );
  }

  return (
    <>
      <div className={`flex gap-2 flex-wrap ${className}`}>
        {models.map((model) => (
          <ModelPill
            key={model.id}
            model={model}
            onToggle={() => actions.toggleModel(model.id)}
            onRightClick={() => setSettingsModal(model)}
          />
        ))}
      </div>
      
      {settingsModal && (
        <ModelSettingsModal
          model={settingsModal}
          isOpen={true}
          onClose={() => setSettingsModal(null)}
        />
      )}
    </>
  );
}

interface ModelPillProps {
  model: ModelInfo;
  onToggle: () => void;
  onRightClick: () => void;
}

function ModelPill({ model, onToggle, onRightClick }: ModelPillProps) {
  return (
    <button
      onClick={onToggle}
      onContextMenu={(e) => {
        e.preventDefault();
        onRightClick();
      }}
      className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 transition-all hover:scale-105 ${
        model.active
          ? 'bg-opacity-30 border'
          : 'bg-secondary text-gruv-medium border border-primary'
      }`}
      style={
        model.active
          ? {
              backgroundColor: model.color + '30',
              borderColor: model.color,
              color: model.color,
            }
          : {}
      }
      title={`${model.name} (${model.type})`}
    >
      <span>{model.emoji}</span>
      <span>{model.name}</span>
      {model.type === 'api' && !model.settings.apiKey && (
        <span className="text-gruv-red-bright text-xs">⚠</span>
      )}
    </button>
  );
}
