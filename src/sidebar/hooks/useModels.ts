import { useState, useEffect, useCallback } from 'react';
import { ModelInfo } from '@/shared/types';
import { DEFAULT_MODELS } from '@/shared/constants';
import { storage } from '@/lib/storage';
import { ModelDiscoveryService } from '@/lib/model-discovery';
import { logger } from '@/lib/logger';

interface UseModelsReturn {
  models: ModelInfo[];
  activeModelIds: string[];
  modelColors: Record<string, string>;
  loading: boolean;
  error: string | null;
  toggleModel: (modelId: string) => Promise<void>;
  updateModel: (modelId: string, updates: Partial<ModelInfo>) => Promise<void>;
  discoverModels: () => Promise<void>;
  getActiveModels: () => ModelInfo[];
  getModelById: (id: string) => ModelInfo | undefined;
  getModelColor: (id: string) => string;
  isModelActive: (id: string) => boolean;
}

export function useModels(): UseModelsReturn {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const activeModelIds = models.filter((m) => m.active).map((m) => m.id);
  const modelColors = models.reduce(
    (acc, model) => ({ ...acc, [model.id]: model.color }),
    {} as Record<string, string>
  );

  // Model helper functions
  const getActiveModels = useCallback(
    (): ModelInfo[] => models.filter((m) => activeModelIds.includes(m.id)),
    [models, activeModelIds]
  );

  const getModelById = useCallback(
    (id: string): ModelInfo | undefined => models.find((m) => m.id === id),
    [models]
  );

  const getModelColor = useCallback(
    (id: string): string => modelColors[id] || '#8ec07c',
    [modelColors]
  );

  const isModelActive = useCallback(
    (id: string): boolean => activeModelIds.includes(id),
    [activeModelIds]
  );

  // Discover and sync models from Ollama
  const discoverAndSyncModels = useCallback(async (): Promise<ModelInfo[]> => {
    try {
      logger.log('useModels: Starting model discovery...');

      const response = await browser.runtime.sendMessage({
        type: 'DISCOVER_OLLAMA_MODELS',
      });

      logger.log('useModels: Discovery response:', response);
      if (response && response.success) {
        logger.log(
          'useModels: Discovered Ollama models:',
          response.models.length
        );

        // Load existing user configurations
        const existingModels = await storage.getModels();
        logger.log('useModels: Existing stored models:', existingModels.length);

        // Sync discovered models with user configurations
        const syncedModels = ModelDiscoveryService.syncWithUserConfig(
          response.models,
          existingModels
        );
        logger.log('useModels: Synced models:', syncedModels.length);

        // Save the updated model list
        await storage.saveModels(syncedModels);
        logger.log('useModels: Models saved to storage');

        return syncedModels;
      } else {
        logger.error(
          'useModels: Failed to discover Ollama models:',
          response?.error
        );

        // Fallback to existing models or defaults
        const existingModels = await storage.getModels();
        if (existingModels.length > 0) {
          return existingModels;
        }

        // Last resort: use hardcoded defaults
        const defaultModels = Object.values(DEFAULT_MODELS);
        await storage.saveModels(defaultModels);
        return defaultModels;
      }
    } catch (error) {
      logger.error('useModels: Exception during model discovery:', error);

      // Fallback to stored models or defaults
      const existingModels = await storage.getModels();
      if (existingModels.length > 0) {
        return existingModels;
      }

      const defaultModels = Object.values(DEFAULT_MODELS);
      await storage.saveModels(defaultModels);
      return defaultModels;
    }
  }, []);

  // Initialize models on mount
  useEffect(() => {
    const initializeModels = async () => {
      try {
        logger.log('useModels: Initializing models...');
        setLoading(true);
        setError(null);

        const discoveredModels = await discoverAndSyncModels();
        setModels(discoveredModels);
      } catch (err) {
        const errorMessage = 'Failed to initialize models';
        logger.error('useModels:', errorMessage, err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initializeModels();
  }, [discoverAndSyncModels]);

  // Toggle model active state
  const toggleModel = useCallback(async (modelId: string) => {
    try {
      logger.log('useModels: Toggling model:', modelId);

      const response = await browser.runtime.sendMessage({
        type: 'TOGGLE_MODEL',
        modelId,
      });

      if (!response) {
        throw new Error('No response from background script');
      }

      if (response.success) {
        logger.log('useModels: Toggle successful, reloading models');

        // Reload models from storage
        const result = await browser.storage.local.get(
          'firefox-bootstrap-models'
        );
        const updatedModels = result['firefox-bootstrap-models'] || [];
        setModels(updatedModels);
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (err) {
      const errorMessage = 'Failed to toggle model';
      logger.error('useModels:', errorMessage, err);
      setError(errorMessage);
    }
  }, []);

  // Update model settings
  const updateModel = useCallback(
    async (modelId: string, updates: Partial<ModelInfo>) => {
      try {
        const response = await browser.runtime.sendMessage({
          type: 'UPDATE_MODEL_SETTINGS',
          modelId,
          modelSettings: updates,
        });

        if (!response) {
          throw new Error('No response from background script');
        }

        if (response.success) {
          // Reload models from storage
          const result = await browser.storage.local.get(
            'firefox-bootstrap-models'
          );
          const updatedModels = result['firefox-bootstrap-models'] || [];
          setModels(updatedModels);
        } else {
          throw new Error(response.error || 'Unknown error');
        }
      } catch (err) {
        const errorMessage = 'Failed to update model';
        logger.error('useModels:', errorMessage, err);
        setError(errorMessage);
      }
    },
    []
  );

  // Manual discovery trigger
  const discoverModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const discoveredModels = await discoverAndSyncModels();
      setModels(discoveredModels);
    } catch (err) {
      const errorMessage = 'Failed to discover models';
      logger.error('useModels:', errorMessage, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [discoverAndSyncModels]);

  return {
    models,
    activeModelIds,
    modelColors,
    loading,
    error,
    toggleModel,
    updateModel,
    discoverModels,
    getActiveModels,
    getModelById,
    getModelColor,
    isModelActive,
  };
}
