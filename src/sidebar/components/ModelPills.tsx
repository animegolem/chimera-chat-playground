import React, { useState } from 'react';
import { ModelInfo } from '@/shared/types';
import { useApp } from '@/sidebar/contexts/AppContext';
import { ModelSettingsModal } from './ModelSettingsModal';
import { logger } from '@/lib/logger';
import { Plus } from 'lucide-react';

interface ModelPillsProps {
  models: ModelInfo[];
  className?: string;
}

// Constants
const MAX_ACTIVE_MODELS = 3;

export function ModelPills({ models, className = '' }: ModelPillsProps) {
  const { actions } = useApp();
  const [settingsModal, setSettingsModal] = useState<ModelInfo | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [constraintWarning, setConstraintWarning] = useState<string | null>(null);

  // Get active and inactive models separately
  const activeModels = models.filter((m) => m.active);
  const inactiveModels = models.filter((m) => !m.active);
  const canAddMore = activeModels.length < MAX_ACTIVE_MODELS;

  logger.log(
    'ModelPills: Rendering with',
    models.length,
    'total models,',
    activeModels.length,
    'active models:',
    activeModels.map((m) => ({ id: m.id, name: m.name, active: m.active }))
  );

  // Handle model toggle with constraint checking
  const handleToggle = async (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    if (!model) return;

    // If trying to activate a model and we're at the limit
    if (!model.active && activeModels.length >= MAX_ACTIVE_MODELS) {
      const warning = `Maximum ${MAX_ACTIVE_MODELS} models can be active at once. Disable another model first.`;
      setConstraintWarning(warning);
      
      // Clear warning after 3 seconds
      setTimeout(() => setConstraintWarning(null), 3000);
      return;
    }

    // Clear any existing warning
    setConstraintWarning(null);
    
    // Proceed with toggle
    await actions.toggleModel(modelId);
  };

  // Handle add button click - opens settings modal for new model
  const handleAddModel = () => {
    setShowAddModal(true);
  };

  // No models case is now handled in the main return statement

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        {/* Active models section */}
        {activeModels.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center">
            {activeModels.map((model) => (
              <ModelPill
                key={model.id}
                model={model}
                isActive={true}
                onToggle={() => handleToggle(model.id)}
                onRightClick={() => setSettingsModal(model)}
              />
            ))}
            
            {/* Add button - only show if under the limit */}
            {canAddMore && <AddButton onClick={handleAddModel} />}
          </div>
        )}
        
        {/* Inactive models section - show as toggleable options */}
        {inactiveModels.length > 0 && (
          <div className="space-y-1">
            {activeModels.length > 0 && (
              <div className="text-xs text-gruv-medium font-medium">
                Available Models:
              </div>
            )}
            <div className="flex gap-2 flex-wrap items-center">
              {inactiveModels.map((model) => (
                <ModelPill
                  key={model.id}
                  model={model}
                  isActive={false}
                  onToggle={() => handleToggle(model.id)}
                  onRightClick={() => setSettingsModal(model)}
                />
              ))}
              
              {/* Show add button here if no active models */}
              {activeModels.length === 0 && <AddButton onClick={handleAddModel} />}
            </div>
          </div>
        )}
        
        {/* No models at all - show add button */}
        {models.length === 0 && (
          <div className="flex items-center gap-2">
            <div className="text-xs text-gruv-medium">
              No models configured
            </div>
            <AddButton onClick={handleAddModel} />
          </div>
        )}
      </div>

      {/* Constraint warning toast */}
      {constraintWarning && (
        <div className="mt-2 p-2 bg-gruv-red-dim border border-gruv-red text-gruv-red-bright text-xs rounded">
          ⚠️ {constraintWarning}
        </div>
      )}

      {/* Settings modal for existing model */}
      {settingsModal && (
        <ModelSettingsModal
          model={settingsModal}
          isOpen={true}
          onClose={() => setSettingsModal(null)}
        />
      )}

      {/* Settings modal for adding new model */}
      {showAddModal && (
        <ModelSettingsModal
          model={null} // null indicates "add new model" mode
          isOpen={true}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}

interface ModelPillProps {
  model: ModelInfo;
  isActive: boolean;
  onToggle: () => void;
  onRightClick: () => void;
}

function ModelPill({ model, isActive, onToggle, onRightClick }: ModelPillProps) {
  return (
    <button
      onClick={onToggle}
      onContextMenu={(e) => {
        e.preventDefault();
        onRightClick();
      }}
      className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 transition-all hover:scale-105 ${
        isActive
          ? 'bg-opacity-30 border border-solid'
          : 'bg-opacity-10 border border-dashed hover:bg-opacity-20'
      }`}
      style={{
        backgroundColor: model.color + (isActive ? '30' : '10'),
        borderColor: model.color,
        color: model.color,
      }}
      title={`${model.name} (${model.type}) - Click to ${isActive ? 'disable' : 'enable'}, right-click for settings`}
    >
      <span className={isActive ? '' : 'opacity-60'}>{model.emoji}</span>
      <span className={isActive ? '' : 'opacity-60'}>{model.name}</span>
      {model.type === 'api' && !model.settings?.apiKey && (
        <span className="text-gruv-red-bright text-xs">⚠</span>
      )}
      {!isActive && (
        <span className="text-xs opacity-60">+</span>
      )}
    </button>
  );
}

// Add Button Component
interface AddButtonProps {
  onClick: () => void;
}

function AddButton({ onClick }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-full text-xs flex items-center gap-1 transition-all hover:scale-105 bg-gruv-medium border border-dashed border-gruv-light text-gruv-light hover:bg-gruv-bright hover:text-gruv-dark"
      title="Add new model (max 3 active)"
    >
      <Plus className="h-3 w-3" />
      <span>Add</span>
    </button>
  );
}
