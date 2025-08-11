import React, { useState } from 'react';
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
  const { actions } = useApp();
  const isAddMode = model === null;
  
  // Initialize state based on mode
  const [displayName, setDisplayName] = useState(model?.name || 'New Model');
  const [emoji, setEmoji] = useState(model?.emoji || '🤖');
  const [color, setColor] = useState(model?.color || '#8ec07c');
  const [provider, setProvider] = useState(model?.provider || 'ollama');
  const [modelId, setModelId] = useState(model?.id || '');
  const [settings, setSettings] = useState(
    model?.settings || {
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
      endpoint: 'http://localhost:11434',
      maxTokens: 2048,
    }
  );

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
      if (isAddMode) {
        // TODO: Implement addModel action when we add multi-provider support
        logger.log('Add new model:', { displayName, emoji, color, provider, modelId, settings });
        // For now, just close the modal
        onClose();
      } else {
        await actions.updateModel(model.id, {
          name: displayName,
          emoji,
          color,
          settings,
        });
        onClose();
      }
    } catch (error) {
      logger.error('Failed to save model:', error);
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
                  {isAddMode ? 'Configure your model' : `${model?.type || 'unknown'} model`}
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
                      color === colorOption ? 'border-gruv-light scale-110' : 'border-gruv-medium'
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

            {isAddMode && (
              <>
                {/* Provider */}
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
                    <option value="openrouter" disabled>OpenRouter (Coming Soon)</option>
                    <option value="openai" disabled>OpenAI (Coming Soon)</option>
                  </select>
                </div>

                {/* Model ID */}
                <div>
                  <label className="block text-sm font-medium text-gruv-light mb-1">
                    Model ID
                  </label>
                  <input
                    type="text"
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full px-3 py-2 bg-gruv-dark border border-gruv-medium rounded focus:outline-none focus:border-gruv-blue-bright text-gruv-light"
                    placeholder="e.g., llama3.2:7b"
                  />
                  <div className="text-xs text-gruv-medium mt-1">
                    For Ollama models, use format: model:tag (e.g., llama3.2:7b)
                  </div>
                </div>
              </>
            )}

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

            {/* API Key for API models */}
            {!isAddMode && model?.type === 'api' && (
              <div>
                <label className="block text-sm font-medium text-gruv-light mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={settings.apiKey || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, apiKey: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gruv-dark border border-gruv-medium rounded focus:outline-none focus:border-gruv-blue-bright text-gruv-light"
                  placeholder="Enter your API key..."
                />
              </div>
            )}

            {/* Endpoint for local models */}
            {(isAddMode || model?.type === 'local') && (
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
              </div>
            )}
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
