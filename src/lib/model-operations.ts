// Model lifecycle operations implementing the new type-safe abstractions
import {
  DiscoveredModel,
  ConfiguredModel,
  ActiveModel,
  ModelSettings,
  ModelOperations,
  validateConfiguredModel,
  validateActiveModel,
} from '@/shared/types-v2';
import {
  generateHashedModelId,
  extractBaseModelId,
} from './model-id-generator';

export class ModelLifecycleManager implements ModelOperations {
  /**
   * Convert discovered model to configured model with user settings
   */
  configureModel(
    discovered: DiscoveredModel,
    settings: Partial<ModelSettings> = {}
  ): ConfiguredModel {
    const defaultSettings: ModelSettings = {
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
      endpoint: 'http://localhost:11434',
      maxTokens: 2048,
      ...settings,
    };

    const configured: ConfiguredModel = {
      id: discovered.id, // Keep original ID
      name: discovered.name,
      emoji: this.getDefaultEmoji(discovered.name),
      color: this.getDefaultColor(),
      type: 'local',
      active: false, // Always false for configured models
      settings: defaultSettings,
    };

    return validateConfiguredModel(configured);
  }

  /**
   * Activate a configured model (generates hashed ID)
   */
  activateModel(configured: ConfiguredModel): ActiveModel {
    const hashedId = generateHashedModelId(configured.id);

    const active: ActiveModel = {
      ...configured,
      id: hashedId, // New hashed ID
      baseModelId: configured.id, // Store original ID for API calls
      active: true, // Always true for active models
    };

    return validateActiveModel(active);
  }

  /**
   * Deactivate an active model (removes hash, returns to configured)
   */
  deactivateModel(active: ActiveModel): ConfiguredModel {
    const configured: ConfiguredModel = {
      id: active.baseModelId, // Restore original ID
      name: active.name,
      emoji: active.emoji,
      color: active.color,
      type: active.type,
      active: false, // Always false for configured models
      provider: active.provider,
      settings: active.settings,
    };

    return validateConfiguredModel(configured);
  }

  /**
   * Update settings for any model type
   */
  updateModelSettings<T extends ConfiguredModel | ActiveModel>(
    model: T,
    updates: Partial<ModelSettings>
  ): T {
    const updatedModel = {
      ...model,
      settings: {
        ...model.settings,
        ...updates,
      },
    };

    // Validate based on model type
    if (model.active) {
      return validateActiveModel(updatedModel) as T;
    } else {
      return validateConfiguredModel(updatedModel) as T;
    }
  }

  /**
   * Check if model ID is valid for its type
   */
  validateModelIdType(model: ConfiguredModel | ActiveModel): boolean {
    if (model.active) {
      // Active models must have hashed IDs
      const parts = model.id.split(':');
      if (parts.length <= 2) return false;
      const lastPart = parts[parts.length - 1];
      return /^[a-z0-9]{8}$/.test(lastPart);
    } else {
      // Configured models must NOT have hashed IDs
      const parts = model.id.split(':');
      if (parts.length <= 2) return true;
      const lastPart = parts[parts.length - 1];
      return !/^[a-z0-9]{8}$/.test(lastPart);
    }
  }

  private getDefaultEmoji(modelName: string): string {
    const name = modelName.toLowerCase();
    if (name.includes('gemma')) return '💎';
    if (name.includes('llama')) return '🦙';
    if (name.includes('phi')) return 'φ';
    if (name.includes('mistral')) return '⚡';
    return '🤖';
  }

  private colorIndex = 0;
  private colors = [
    '#83a598',
    '#b8bb26',
    '#d3869b',
    '#fabd2f',
    '#fe8019',
    '#fb4934',
    '#8ec07c',
  ];

  private getDefaultColor(): string {
    const color = this.colors[this.colorIndex % this.colors.length];
    this.colorIndex++;
    return color;
  }
}

// Singleton instance
export const modelLifecycle = new ModelLifecycleManager();
