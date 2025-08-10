import React, { useState } from 'react';
import { ModelInfo } from '@/shared/types';
import { useApp } from '@/sidebar/contexts/AppContext';

interface ModelSettingsModalProps {
  model: ModelInfo;
  isOpen: boolean;
  onClose: () => void;
}

export function ModelSettingsModal({ model, isOpen, onClose }: ModelSettingsModalProps) {
  const { actions } = useApp();
  const [settings, setSettings] = useState(model.settings);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      await actions.updateModel(model.id, { settings });
      onClose();
    } catch (error) {
      console.error('Failed to update model settings:', error);
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
            <span className="text-lg">{model.emoji}</span>
            <div>
              <h2 className="text-lg font-semibold text-gruv-light">{model.name}</h2>
              <p className="text-sm text-gruv-medium">{model.type} model</p>
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
              onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
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
              onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
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
              onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 bg-gruv-dark border border-gruv-medium rounded focus:outline-none focus:border-gruv-blue-bright text-gruv-light resize-none"
              placeholder="You are a helpful AI assistant..."
            />
          </div>

          {/* API Key for API models */}
          {model.type === 'api' && (
            <div>
              <label className="block text-sm font-medium text-gruv-light mb-1">
                API Key
              </label>
              <input
                type="password"
                value={settings.apiKey || ''}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                className="w-full px-3 py-2 bg-gruv-dark border border-gruv-medium rounded focus:outline-none focus:border-gruv-blue-bright text-gruv-light"
                placeholder="Enter your API key..."
              />
            </div>
          )}

          {/* Endpoint for local models */}
          {model.type === 'local' && (
            <div>
              <label className="block text-sm font-medium text-gruv-light mb-1">
                Endpoint
              </label>
              <input
                type="url"
                value={settings.endpoint || 'http://localhost:11434'}
                onChange={(e) => setSettings({ ...settings, endpoint: e.target.value })}
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