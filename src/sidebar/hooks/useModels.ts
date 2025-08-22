import { useState, useEffect, useCallback } from 'react';
import { ModelInfo } from '@/shared/types';
import { ModelStorage } from '@/shared/types-v2';
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
  addModel: (modelData: ModelInfo) => Promise<void>;
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

  // Load models from new separated storage, fallback to legacy format for backward compatibility
  const loadModels = useCallback(async (): Promise<ModelInfo[]> => {
    try {
      // Try new separated storage first
      const modelStorage = await storage.getModelStorage();
      if (
        modelStorage.configured.length > 0 ||
        modelStorage.active.length > 0
      ) {
        // Combine configured and active models into legacy format for backward compatibility
        return [...modelStorage.configured, ...modelStorage.active];
      }

      // Fallback to legacy storage
      return await storage.getModels();
    } catch (error) {
      logger.error('Failed to load models:', error);
      return await storage.getModels(); // Always fallback to legacy
    }
  }, []);

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

        // First try to load existing models from storage
        const existingModels = await loadModels();
        if (existingModels.length > 0) {
          setModels(existingModels);
          logger.log(
            'useModels: Loaded',
            existingModels.length,
            'existing models'
          );
        } else {
          // If no models exist, discover new ones
          const discoveredModels = await discoverAndSyncModels();
          setModels(discoveredModels);
        }
      } catch (err) {
        const errorMessage = 'Failed to initialize models';
        logger.error('useModels:', errorMessage, err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initializeModels();
  }, [loadModels, discoverAndSyncModels]);

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
        logger.log('useModels: Toggle successful, reloading models from separated storage');

        // Reload models using the loadModels function that handles separated storage
        const updatedModels = await loadModels();
        setModels(updatedModels);
        logger.log('useModels: Reloaded', updatedModels.length, 'models after toggle');
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (err) {
      const errorMessage = 'Failed to toggle model';
      logger.error('useModels:', errorMessage, err);
      setError(errorMessage);
    }
  }, [loadModels]);

  // Update model settings
  const updateModel = useCallback(
    async (modelId: string, updates: Partial<ModelInfo>) => {
      try {
        logger.log('useModels: updateModel called with:', { modelId, updates });

        const message = {
          type: 'UPDATE_MODEL_SETTINGS',
          modelId,
          modelSettings: updates,
        };

        logger.log('useModels: Sending message to background:', message);
        const response = await browser.runtime.sendMessage(message);

        logger.log('useModels: Received response from background:', response);

        if (!response) {
          logger.error('useModels: No response from background script');
          throw new Error('No response from background script');
        }

        if (response.success) {
          logger.log(
            'useModels: Background update successful, reloading models from separated storage'
          );
          // Reload models using the loadModels function that handles separated storage
          const updatedModels = await loadModels();
          logger.log(
            'useModels: Loaded updated models from storage:',
            updatedModels.length
          );
          setModels(updatedModels);
          logger.log('useModels: updateModel completed successfully');
        } else {
          logger.error('useModels: Background update failed:', response.error);
          throw new Error(response.error || 'Unknown error');
        }
      } catch (err) {
        const errorMessage = 'Failed to update model';
        logger.error('useModels: updateModel error:', errorMessage, err);
        console.error('useModels: updateModel error:', errorMessage, err);
        setError(errorMessage);
        throw err; // Re-throw so modal can show specific error
      }
    },
    [loadModels]
  );

  // Add model function
  const addModel = useCallback(
    async (modelData: ModelInfo) => {
      try {
        logger.log('useModels: Adding model:', modelData);

        const response = await browser.runtime.sendMessage({
          type: 'ADD_MODEL',
          modelData,
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to add model');
        }

        // Refresh models after successful add
        const updatedModels = await discoverAndSyncModels();
        setModels(updatedModels);
      } catch (err) {
        const errorMessage = 'Failed to add model';
        logger.error('useModels:', errorMessage, err);
        setError(errorMessage);
        throw err; // Re-throw for UI handling
      }
    },
    [discoverAndSyncModels]
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
    addModel,
    discoverModels,
    getActiveModels,
    getModelById,
    getModelColor,
    isModelActive,
  };
}
