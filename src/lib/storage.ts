// Browser storage wrapper for Firefox Bootstrap extension

import { STORAGE_KEYS } from '@/shared/constants';
import { ChatSession, ModelInfo, AppState } from '@/shared/types';

interface StorageData {
  [STORAGE_KEYS.SESSIONS]: ChatSession[];
  [STORAGE_KEYS.MODELS]: ModelInfo[];
  [STORAGE_KEYS.SETTINGS]: Partial<AppState>;
  [STORAGE_KEYS.API_KEYS]: Record<string, string>;
  [STORAGE_KEYS.CURRENT_SESSION]: string | null;
}

class Storage {
  // Generic get/set methods
  async get<K extends keyof StorageData>(key: K): Promise<StorageData[K] | null> {
    try {
      const result = await browser.storage.local.get(key);
      return result[key] || null;
    } catch (error) {
      console.error(`Storage get error for key ${key}:`, error);
      return null;
    }
  }

  async set<K extends keyof StorageData>(key: K, value: StorageData[K]): Promise<void> {
    try {
      await browser.storage.local.set({ [key]: value });
    } catch (error) {
      console.error(`Storage set error for key ${key}:`, error);
      throw error;
    }
  }

  async remove(key: keyof StorageData): Promise<void> {
    try {
      await browser.storage.local.remove(key);
    } catch (error) {
      console.error(`Storage remove error for key ${key}:`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await browser.storage.local.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  }

  // Specific methods for common operations
  async getSessions(): Promise<ChatSession[]> {
    const sessions = await this.get(STORAGE_KEYS.SESSIONS);
    return sessions || [];
  }

  async saveSession(session: ChatSession): Promise<void> {
    const sessions = await this.getSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    
    await this.set(STORAGE_KEYS.SESSIONS, sessions);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = await this.getSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    await this.set(STORAGE_KEYS.SESSIONS, filtered);
  }

  async getModels(): Promise<ModelInfo[]> {
    const models = await this.get(STORAGE_KEYS.MODELS);
    return models || [];
  }

  async saveModels(models: ModelInfo[]): Promise<void> {
    await this.set(STORAGE_KEYS.MODELS, models);
  }

  async updateModel(modelId: string, updates: Partial<ModelInfo>): Promise<void> {
    const models = await this.getModels();
    const modelIndex = models.findIndex(m => m.id === modelId);
    
    if (modelIndex >= 0) {
      models[modelIndex] = { ...models[modelIndex], ...updates };
      await this.saveModels(models);
    } else {
      throw new Error(`Model ${modelId} not found`);
    }
  }

  async getApiKey(modelId: string): Promise<string | null> {
    const apiKeys = await this.get(STORAGE_KEYS.API_KEYS);
    return apiKeys?.[modelId] || null;
  }

  async setApiKey(modelId: string, apiKey: string): Promise<void> {
    const apiKeys = await this.get(STORAGE_KEYS.API_KEYS) || {};
    apiKeys[modelId] = apiKey;
    await this.set(STORAGE_KEYS.API_KEYS, apiKeys);
  }

  async removeApiKey(modelId: string): Promise<void> {
    const apiKeys = await this.get(STORAGE_KEYS.API_KEYS) || {};
    delete apiKeys[modelId];
    await this.set(STORAGE_KEYS.API_KEYS, apiKeys);
  }

  async getCurrentSessionId(): Promise<string | null> {
    return await this.get(STORAGE_KEYS.CURRENT_SESSION);
  }

  async setCurrentSessionId(sessionId: string | null): Promise<void> {
    await this.set(STORAGE_KEYS.CURRENT_SESSION, sessionId);
  }

  async getSettings(): Promise<Partial<AppState>> {
    const settings = await this.get(STORAGE_KEYS.SETTINGS);
    return settings || {};
  }

  async updateSettings(updates: Partial<AppState>): Promise<void> {
    const current = await this.getSettings();
    const merged = { ...current, ...updates };
    await this.set(STORAGE_KEYS.SETTINGS, merged);
  }

  // Utility methods
  async getStorageSize(): Promise<number> {
    try {
      const all = await browser.storage.local.get();
      return JSON.stringify(all).length;
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }

  async exportData(): Promise<StorageData> {
    try {
      const data = await browser.storage.local.get();
      return data as StorageData;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  async importData(data: Partial<StorageData>): Promise<void> {
    try {
      await browser.storage.local.set(data);
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storage = new Storage();