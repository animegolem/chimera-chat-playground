import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ModelInfo } from '@/shared/types';
import { useApp } from '@/sidebar/contexts/AppContext';
import { logger } from '@/lib/logger';

interface ModelSettingsModalProps {
  model: ModelInfo | null; // null means "add new model" mode
  isOpen: boolean;
  onClose: () => void;
}

export function ModelSettingsModal({
  model,
  isOpen,
  onClose,
}: ModelSettingsModalProps) {
  const { actions, state } = useApp();
  const existingModels = state.models;
  const isAddMode = model === null;

  // Initialize state based on mode
  const [displayName, setDisplayName] = useState(model?.name || 'New Model');
  const [emoji, setEmoji] = useState(model?.emoji || '🤖');
  const [color, setColor] = useState(model?.color || '#8ec07c');
  const [provider, setProvider] = useState(model?.provider || 'ollama');
  const [modelId, setModelId] = useState(model?.id || '');
  const [availableModels, setAvailableModels] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [settings, setSettings] = useState(
    model?.settings || {
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
      endpoint: 'http://localhost:11434',
      maxTokens: 2048,
    }
  );

  const discoverAvailableModels = useCallback(async () => {
    try {
      setDiscoveryLoading(true);
      logger.log('ModelSettingsModal: Discovering available models...');

      const response = await browser.runtime.sendMessage({
        type: 'DISCOVER_OLLAMA_MODELS',
      });

      logger.log('ModelSettingsModal: Discovery response:', response);

      if (response && response.success && response.models) {
        let models = response.models.map((m: any) => ({
          id: m.id || m.name,
          name: m.name || m.id,
        }));

        // Enhanced filtering for new type system
        if (isAddMode) {
          // In add mode, show:
          // 1. Discovered models that aren't already configured or active
          // 2. Inactive configured models (can be reactivated)

          // Get base model IDs of all existing models (both active and inactive)
          const existingBaseModelIds = new Set(
            existingModels.map((m) => m.baseModelId || m.id)
          );

          // Filter out models that are already configured in some way
          const discoveredAvailable = models.filter(
            (m) => !existingBaseModelIds.has(m.id)
          );

          // Also include inactive configured models (can be reactivated)
          const inactiveConfigured = existingModels
            .filter((m) => m.active === false)
            .map((m) => ({
              id: m.id, // Use original ID, not hashed
              name: m.name, // No need for (configured) suffix with separated types
            }));

          // Combine discovered + inactive configured
          models = [...discoveredAvailable, ...inactiveConfigured];

          logger.log('ModelSettingsModal: Add mode - available models:', {
            discovered: discoveredAvailable.length,
            inactiveConfigured: inactiveConfigured.length,
            total: models.length,
          });
        } else {
          // In edit mode, show all models except those that would cause conflicts
          const conflictingBaseModelIds = existingModels
            .filter((m) => m.id !== model?.id && m.active === true) // Exclude current model being edited
            .map((m) => m.baseModelId || m.id);
          models = models.filter(
            (m) => !conflictingBaseModelIds.includes(m.id)
          );
          logger.log(
            'ModelSettingsModal: Edit mode - filtered out conflicting active models, available:',
            models.length
          );
        }

        setAvailableModels(models);
        logger.log('ModelSettingsModal: Available models:', models.length);
      } else {
        logger.error(
          'ModelSettingsModal: Failed to discover models:',
          response?.error
        );
      }
    } catch (error) {
      logger.error('ModelSettingsModal: Error discovering models:', error);
    } finally {
      setDiscoveryLoading(false);
    }
  }, []);

  // Discover available models when modal opens for any Ollama provider
  useEffect(() => {
    if (isOpen && provider === 'ollama') {
      discoverAvailableModels();
    }
  }, [isOpen, provider, discoverAvailableModels]);

  // Handle model selection from dropdown
  const handleModelSelect = (selectedId: string) => {
    setModelId(selectedId);
    const selectedModel = availableModels.find((m) => m.id === selectedId);
    if (selectedModel) {
      setDisplayName(selectedModel.name);
    }
  };

  if (!isOpen) return null;

  // Predefined color options
  const colorOptions = [
    '#8ec07c', // gruvbox green
    '#83a598', // gruvbox blue
    '#b8bb26', // gruvbox yellow
    '#d3869b', // gruvbox purple
    '#fe8019', // gruvbox orange
    '#fb4934', // gruvbox red
  ];

  const handleSave = async () => {
    try {
      logger.log(
        'ModelSettingsModal: handleSave called, isAddMode:',
        isAddMode
      );

      if (isAddMode) {
        // Validate required fields
        if (!modelId.trim()) {
          logger.error('ModelSettingsModal: Model ID is required');
          alert('Model ID is required. Please select or enter a model ID.');
          return;
        }

        if (!displayName.trim()) {
          logger.error('ModelSettingsModal: Display name is required');
          alert('Display name is required.');
          return;
        }

        // Create new model with provider-based ID and data model alignment
        const newModel: ModelInfo = {
          id: modelId.trim(),
          name: displayName.trim(),
          emoji,
          color,
          type: provider === 'ollama' ? 'local' : 'api',
          active: true, // New models start as active
          provider,
          settings,
        };

        logger.log('ModelSettingsModal: Adding new model:', newModel);
        console.log('ModelSettingsModal: Adding new model:', newModel);

        await actions.addModel(newModel);

        logger.log('ModelSettingsModal: addModel completed successfully');
        console.log('ModelSettingsModal: addModel completed successfully');
        onClose();
      } else {
        // Validate required fields for edit mode
        if (!modelId.trim()) {
          logger.error('ModelSettingsModal: Model ID is required');
          alert('Model ID is required. Please select a model ID.');
          return;
        }

        if (!displayName.trim()) {
          logger.error('ModelSettingsModal: Display name is required');
          alert('Display name is required.');
          return;
        }

        logger.log('ModelSettingsModal: Updating existing model:', model?.id);
        console.log('ModelSettingsModal: Updating existing model:', model?.id);
        logger.log(
          'ModelSettingsModal: Old model ID:',
          model?.id,
          '→ New model ID:',
          modelId.trim()
        );
        console.log(
          'ModelSettingsModal: Old model ID:',
          model?.id,
          '→ New model ID:',
          modelId.trim()
        );

        const updateData = {
          id: modelId.trim(), // Include the updated model ID
          name: displayName,
          emoji,
          color,
          provider,
          settings,
        };

        logger.log('ModelSettingsModal: Update payload:', updateData);
        console.log('ModelSettingsModal: Update payload:', updateData);

        await actions.updateModel(model.id, updateData);

        logger.log('ModelSettingsModal: updateModel completed successfully');
        console.log('ModelSettingsModal: updateModel completed successfully');
        onClose();
      }
    } catch (error) {
      logger.error('ModelSettingsModal: Failed to save model:', error);
      console.error('ModelSettingsModal: Failed to save model:', error);
      alert(
        `Failed to save model: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          background: #83a598;
          cursor: pointer;
          border-radius: 50%;
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          background: #83a598;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
      `}</style>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleOverlayClick}
      >
        <div className="bg-gruv-dark-soft border border-gruv-medium rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gruv-medium">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="text-gruv-medium hover:text-gruv-light transition-colors"
              >
                ←
              </button>
              <span className="text-lg">{emoji}</span>
              <div>
                <h2 className="text-lg font-semibold text-gruv-light">
                  {isAddMode ? 'Add New Model' : `Settings: ${displayName}`}
                </h2>
                <p className="text-sm text-gruv-medium">
                  {isAddMode
                    ? 'Configure your model'
                    : `${model?.type || 'unknown'} model`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gruv-medium hover:text-gruv-light transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gruv-light mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 bg-gruv-dark border border-gruv-medium rounded focus:outline-none focus:border-gruv-blue-bright text-gruv-light"
                placeholder="e.g., Claude-Opus"
              />
            </div>

            {/* Terminal Color */}
            <div>
              <label className="block text-sm font-medium text-gruv-light mb-1">
                Terminal Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption}
                    onClick={() => setColor(colorOption)}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      color === colorOption
                        ? 'border-gruv-light scale-110'
                        : 'border-gruv-medium'
                    }`}
                    style={{ backgroundColor: colorOption }}
                    title={colorOption}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded border border-gruv-medium bg-transparent cursor-pointer"
                  title="Custom color"
                />
              </div>
              <div className="text-xs text-gruv-medium mt-1">{color}</div>
            </div>

            {/* Emoji */}
            <div>
              <label className="block text-sm font-medium text-gruv-light mb-1">
                Emoji
              </label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
                className="w-20 px-3 py-2 bg-gruv-dark border border-gruv-medium rounded focus:outline-none focus:border-gruv-blue-bright text-gruv-light text-center"
                placeholder="🤖"
                maxLength={2}
              />
            </div>

            {/* Provider - Always visible in unified UI */}
            <div>
              <label className="block text-sm font-medium text-gruv-light mb-1">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 bg-gruv-dark border border-gruv-medium rounded focus:outline-none focus:border-gruv-blue-bright text-gruv-light"
              >
                <option value="ollama">Ollama (Local)</option>
                <option value="openrouter" disabled>
                  OpenRouter (Coming Soon)
                </option>
                <option value="openai" disabled>
                  OpenAI (Coming Soon)
                </option>
              </select>
            </div>

            {/* Model ID - Dropdown for Ollama, text input for other providers */}
            <div>
              <label className="block text-sm font-medium text-gruv-light mb-1">
                Model ID
                {provider === 'ollama' && discoveryLoading && (
                  <span className="ml-2 text-xs text-gruv-blue-bright">
                    Discovering...
                  </span>
                )}
              </label>

              {provider === 'ollama' ? (
                // Dropdown for Ollama models (both add and edit modes)
                <div className="space-y-2">
                  {availableModels.length > 0 ? (
                    <select
                      value={modelId}
                      onChange={(e) => handleModelSelect(e.target.value)}
                      className="w-full px-3 py-2 bg-gruv-dark border border-gruv-medium rounded focus:outline-none focus:border-gruv-blue-bright text-gruv-light"
                    >
                      <option value="">
                        {isAddMode ? 'Select a model...' : 'Change model...'}
                      </option>
                      {availableModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-gruv-medium">
                      {discoveryLoading
                        ? 'Discovering models...'
                        : 'No models found. Make sure Ollama is running and has models installed.'}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={discoverAvailableModels}
                    className="text-xs text-gruv-blue-bright hover:text-gruv-blue underline"
                  >
                    🔄 Refresh models
                  </button>

                  {/* Show current selection */}
                  {modelId && (
                    <div className="text-xs text-gruv-medium">
                      Selected:{' '}
                      <span className="text-gruv-light">{modelId}</span>
                    </div>
                  )}
                </div>
              ) : (
                // Text input for non-Ollama providers
                <>
                  <input
                    type="text"
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full px-3 py-2 bg-gruv-dark border border-gruv-medium rounded focus:outline-none focus:border-gruv-blue-bright text-gruv-light"
                    placeholder="e.g., gpt-4, claude-3-sonnet"
                  />
                  <div className="text-xs text-gruv-medium mt-1">
                    Enter the model ID for your API provider
                  </div>
                </>
              )}
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gruv-light mb-1">
                Temperature: {settings.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    temperature: parseFloat(e.target.value),
                  })
                }
                className="w-full h-2 bg-gruv-dark rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: '#1d2021',
                }}
              />
              <div className="flex justify-between text-xs text-gruv-medium mt-1">
                <span>Conservative</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium text-gruv-light mb-1">
                Max Tokens
              </label>
              <input
                type="number"
                min="1"
                max="8192"
                value={settings.maxTokens || 2048}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxTokens: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-gruv-dark border border-gruv-medium rounded focus:outline-none focus:border-gruv-blue-bright text-gruv-light"
              />
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-gruv-light mb-1">
                System Prompt
              </label>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) =>
                  setSettings({ ...settings, systemPrompt: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 bg-gruv-dark border border-gruv-medium rounded focus:outline-none focus:border-gruv-blue-bright text-gruv-light resize-none"
                placeholder="You are a helpful AI assistant..."
              />
            </div>

            {/* Endpoint - Always visible for unified UI */}
            <div>
              <label className="block text-sm font-medium text-gruv-light mb-1">
                Endpoint
              </label>
              <input
                type="url"
                value={settings.endpoint || 'http://localhost:11434'}
                onChange={(e) =>
                  setSettings({ ...settings, endpoint: e.target.value })
                }
                className="w-full px-3 py-2 bg-gruv-dark border border-gruv-medium rounded focus:outline-none focus:border-gruv-blue-bright text-gruv-light"
                placeholder="http://localhost:11434"
              />
              <div className="text-xs text-gruv-medium mt-1">
                For Ollama: http://localhost:11434 | For APIs: Use provider
                endpoint
              </div>
            </div>

            {/* API Key - Always visible for unified UI */}
            <div>
              <label className="block text-sm font-medium text-gruv-light mb-1">
                API Key (Optional)
              </label>
              <input
                type="password"
                value={settings.apiKey || ''}
                onChange={(e) =>
                  setSettings({ ...settings, apiKey: e.target.value })
                }
                className="w-full px-3 py-2 bg-gruv-dark border border-gruv-medium rounded focus:outline-none focus:border-gruv-blue-bright text-gruv-light"
                placeholder="Leave empty for Ollama, required for API providers"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gruv-medium">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gruv-medium hover:text-gruv-light transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gruv-blue-bright hover:bg-gruv-blue text-gruv-dark rounded transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
