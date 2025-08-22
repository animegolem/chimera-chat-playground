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
  const [constraintWarning, setConstraintWarning] = useState<string | null>(
    null
  );

  // Show all models, sorted by active first, then alphabetically
  const activeModels = models
    .filter((m) => m.active)
    .sort((a, b) => a.name.localeCompare(b.name));
    
  const inactiveModels = models
    .filter((m) => !m.active)
    .sort((a, b) => a.name.localeCompare(b.name));

  const canAddMore = activeModels.length < MAX_ACTIVE_MODELS;

  logger.log(
    'ModelPills: Rendering with',
    activeModels.length,
    'active models out of',
    models.length,
    'total discovered'
  );

  // Handle model toggle with constraint checking
  const handleToggle = async (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    if (!model) return;

    // If trying to activate a model and we're at the limit
    if (!model.active && activeModels.length >= MAX_ACTIVE_MODELS) {
      const warning = `Maximum ${MAX_ACTIVE_MODELS} models can be active at once. Remove another model first.`;
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
      <div className={`${className}`}>
        {/* Active and inactive models */}
        <div className="flex gap-2 flex-wrap items-center">
          {/* Active models first */}
          {activeModels.map((model) => (
            <ModelPill
              key={model.id}
              model={model}
              isActive={true}
              onToggle={() => handleToggle(model.id)}
              onRightClick={() => setSettingsModal(model)}
              showRemove={activeModels.length > 1}
            />
          ))}

          {/* Inactive models - greyed out */}
          {inactiveModels.map((model) => (
            <ModelPill
              key={model.id}
              model={model}
              isActive={false}
              onToggle={() => handleToggle(model.id)}
              onRightClick={() => setSettingsModal(model)}
              showRemove={false}
            />
          ))}

          {/* Add button - always show if under 3 model limit */}
          {canAddMore && <AddButton onClick={handleAddModel} />}
        </div>

        {/* No active models - show message with add button */}
        {activeModels.length === 0 && (
          <div className="flex items-center gap-2">
            <div className="text-xs text-gruv-medium">No models active</div>
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
  showRemove?: boolean;
}

function ModelPill({
  model,
  isActive,
  onToggle,
  onRightClick,
  showRemove = false,
}: ModelPillProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onToggle}
        onContextMenu={(e) => {
          e.preventDefault();
          onRightClick();
        }}
        className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 transition-all hover:scale-105 border border-solid ${
          isActive ? 'bg-opacity-30' : 'bg-opacity-10 opacity-50'
        }`}
        style={{
          backgroundColor: model.color + (isActive ? '30' : '10'),
          borderColor: model.color + (isActive ? '' : '80'),
          color: isActive ? model.color : model.color + '80',
        }}
        title={`${model.name} (${model.type}) - ${isActive ? 'Active' : 'Inactive'} - Left-click to toggle, Right-click for settings`}
      >
        <span>{model.emoji}</span>
        <span>{model.baseModelId || model.id}</span>
        {model.type === 'api' && !model.settings?.apiKey && (
          <span className="text-gruv-red-bright text-xs">⚠</span>
        )}
      </button>
      {showRemove && (
        <button
          onClick={onToggle}
          className="w-4 h-4 rounded-full bg-gruv-red-dim border border-gruv-red text-gruv-red-bright hover:bg-gruv-red hover:text-gruv-dark text-xs flex items-center justify-center transition-all"
          title={`Remove ${model.name}`}
        >
          ×
        </button>
      )}
    </div>
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
      className="px-2 py-1 rounded-full text-xs flex items-center justify-center transition-all hover:scale-105 bg-gruv-medium border border-dashed border-gruv-light text-gruv-light hover:bg-gruv-bright hover:text-gruv-dark"
      title="Add new model (max 3 active)"
    >
      <Plus className="h-3 w-3" />
    </button>
  );
}
