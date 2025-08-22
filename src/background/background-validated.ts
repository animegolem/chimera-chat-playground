// Zod v4.0.17 handles CSP gracefully without intervention
import { logger } from '@/lib/logger';
import {
  validateOllamaTagsResponse,
  validateOllamaChatResponse,
  validateSidebarMessage,
  ResponseMessage,
  ModelInfo,
  STORAGE_KEYS,
  safeStorageGet,
  safeStorageSet,
} from '@/lib/validation';
import {
  ConfiguredModel,
  ActiveModel,
  ModelStorage,
  validateModelStorage,
} from '@/shared/types-v2';
import {
  generateHashedModelId,
  extractBaseModelId,
} from '@/lib/model-id-generator';

// Simplified background script with Zod validation
logger.log('Firefox Bootstrap validated background script loaded');

// CPU Spike Detection
let messageCount = 0;
let lastLogTime = Date.now();

function logPerformanceMetrics(operation: string) {
  messageCount++;
  const now = Date.now();
  const timeSinceLastLog = now - lastLogTime;

  if (messageCount % 10 === 0 || timeSinceLastLog > 5000) {
    logger.log(
      `[PERF] ${operation} - Messages: ${messageCount}, Time since last: ${timeSinceLastLog}ms`
    );
    lastLogTime = now;
  }
}

// No default hardcoded models - discover actual models from Ollama

// Helper function to get separated model storage
async function getModelStorage(): Promise<ModelStorage> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEYS.MODELS_V2);
    const modelStorage = result[STORAGE_KEYS.MODELS_V2];

    if (modelStorage) {
      return validateModelStorage(modelStorage);
    }
    return { configured: [], active: [] };
  } catch (error) {
    logger.error('Failed to get model storage:', error);
    return { configured: [], active: [] };
  }
}

// Helper function to save separated model storage
async function saveModelStorage(modelStorage: ModelStorage): Promise<void> {
  try {
    const validated = validateModelStorage(modelStorage);
    await browser.storage.local.set({ [STORAGE_KEYS.MODELS_V2]: validated });
    logger.log('Saved model storage:', {
      configured: validated.configured.length,
      active: validated.active.length,
    });
  } catch (error) {
    logger.error('Failed to save model storage:', error);
    throw error;
  }
}

// Initialize extension
async function initialize() {
  try {
    // Check if we have separated storage
    const separatedStorage = await getModelStorage();
    if (
      separatedStorage.configured.length === 0 &&
      separatedStorage.active.length === 0
    ) {
      // Check legacy storage and migrate if needed
      const existingModels = await safeStorageGet(STORAGE_KEYS.MODELS);
      if (existingModels && existingModels.length > 0) {
        logger.log(
          'Migrating',
          existingModels.length,
          'legacy models to separated storage'
        );
        await migrateLegacyModels(existingModels);
      } else {
        // No existing models - start with empty storage
        // Models will be discovered when user opens the extension
        logger.log('No existing models found, starting with empty storage');
      }
    }
  } catch (error) {
    logger.error('Failed to initialize models:', error);
  }
}

// Migration function from legacy ModelInfo[] to separated storage
async function migrateLegacyModels(legacyModels: ModelInfo[]): Promise<void> {
  try {
    const modelStorage: ModelStorage = {
      configured: [],
      active: [],
    };

    for (const model of legacyModels) {
      if (model.active) {
        // Active models should already have hashed IDs and baseModelId
        if (!model.baseModelId) {
          // If missing baseModelId, extract from hashed ID or use current ID
          model.baseModelId = extractBaseModelId(model.id);
        }
        if (!model.id.includes(':') || model.id === model.baseModelId) {
          // If not hashed, generate hash
          model.id = generateHashedModelId(model.baseModelId);
        }
        modelStorage.active.push(model as ActiveModel);
      } else {
        // Inactive models should have original IDs only
        const { baseModelId, ...modelWithoutBaseId } = model; // Remove baseModelId property
        const configuredModel: ConfiguredModel = {
          ...modelWithoutBaseId,
          id: baseModelId || model.id, // Use original ID
          active: false,
        };
        modelStorage.configured.push(configuredModel);
      }
    }

    await saveModelStorage(modelStorage);
    logger.log('Migration completed:', {
      configured: modelStorage.configured.length,
      active: modelStorage.active.length,
    });
  } catch (error) {
    logger.error('Failed to migrate legacy models:', error);
    throw error;
  }
}

initialize();

// Extension installation handler
browser.runtime.onInstalled.addListener(async (details) => {
  logger.log('Firefox Bootstrap installed:', details.reason);

  try {
    await browser.contextMenus.create({
      id: 'send-to-assistant',
      title: 'Send to AI Assistant',
      contexts: ['selection'],
    });
  } catch (error) {
    logger.error('Failed to create context menu:', error);
  }

  broadcastMessage({
    type: 'EXTENSION_UPDATED',
    timestamp: Date.now(),
  });
});

// Context menu click handler
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'send-to-assistant' && info.selectionText) {
    broadcastMessage({
      type: 'CONTEXT_MENU_SELECTION',
      text: info.selectionText,
      url: tab?.url,
      title: tab?.title,
      timestamp: Date.now(),
    });
  }
});

// Message handler with validation
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  logPerformanceMetrics(`Message received: ${message.type}`);
  logger.log('Background received message:', message.type, message);

  // Validate and handle message
  handleValidatedMessage(message, sendResponse);
  return true; // Always return true for async responses
});

async function handleValidatedMessage(
  message: unknown,
  sendResponse: (response: ResponseMessage) => void
) {
  try {
    // Validate incoming message
    const validatedMessage = validateSidebarMessage(message);

    switch (validatedMessage.type) {
      case 'GET_TAB_GROUPS':
        await handleGetTabGroups(sendResponse);
        break;

      case 'RENAME_TAB_GROUP':
        if (validatedMessage.groupId && validatedMessage.name) {
          await handleRenameTabGroup(
            validatedMessage.groupId,
            validatedMessage.name,
            sendResponse
          );
        }
        break;

      case 'UPDATE_MODEL_SETTINGS':
        if (validatedMessage.modelId && validatedMessage.modelSettings) {
          await handleUpdateModelSettings(
            validatedMessage.modelId,
            validatedMessage.modelSettings,
            sendResponse
          );
        }
        break;

      case 'TOGGLE_MODEL':
        if (validatedMessage.modelId) {
          await handleToggleModel(validatedMessage.modelId, sendResponse);
        }
        break;

      case 'ADD_MODEL':
        if (validatedMessage.modelData) {
          await handleAddModel(validatedMessage.modelData, sendResponse);
        }
        break;

      case 'LLM_CHAT_REQUEST':
        if (validatedMessage.llmRequest) {
          await handleLLMChatRequest(validatedMessage.llmRequest, sendResponse);
        }
        break;

      case 'DISCOVER_OLLAMA_MODELS':
        await handleDiscoverOllamaModels(sendResponse);
        break;

      default:
        logger.warn('Unknown message type:', validatedMessage.type);
        sendResponse({
          success: false,
          error: `Unknown message type: ${validatedMessage.type}`,
        });
    }
  } catch (error) {
    logger.error('Message validation/handling error:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Message handlers
async function handleGetTabGroups(
  sendResponse: (response: ResponseMessage) => void
) {
  try {
    if (typeof browser.tabs.group === 'undefined') {
      sendResponse({ success: true, groups: [] });
      return;
    }
    sendResponse({ success: true, groups: [] });
  } catch (error) {
    sendResponse({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get tab groups',
    });
  }
}

async function handleRenameTabGroup(
  groupId: number,
  name: string,
  sendResponse: (response: ResponseMessage) => void
) {
  try {
    if (typeof browser.tabs.group === 'undefined') {
      sendResponse({
        success: false,
        error: 'Tab groups not available in this Firefox version',
      });
      return;
    }
    sendResponse({
      success: false,
      error: 'Tab group renaming not yet implemented',
    });
  } catch (error) {
    sendResponse({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to rename tab group',
    });
  }
}

async function handleUpdateModelSettings(
  modelId: string,
  updates: Partial<ModelInfo>,
  sendResponse: (response: ResponseMessage) => void
) {
  try {
    const models = await safeStorageGet(STORAGE_KEYS.MODELS);
    const modelIndex = models?.findIndex((m) => m.id === modelId) ?? -1;

    if (modelIndex === -1) {
      sendResponse({ success: false, error: 'Model not found' });
      return;
    }

    if (models) {
      const currentModel = models[modelIndex];

      // If switching to a different base model, generate new hashed ID
      if (updates.id && updates.id !== currentModel.baseModelId) {
        logger.log(
          'handleUpdateModelSettings: Switching to different base model:',
          {
            oldBaseModel: currentModel.baseModelId || currentModel.id,
            newBaseModel: updates.id,
            currentHashedId: currentModel.id,
          }
        );

        // Generate new hashed ID for the active model
        const newHashedId = generateHashedModelId(updates.id);

        // Update with new hashed ID and base model reference
        models[modelIndex] = {
          ...currentModel,
          ...updates,
          id: newHashedId, // New unique hashed ID
          baseModelId: updates.id, // Store original model ID for API calls
        };

        logger.log('handleUpdateModelSettings: Generated new hashed ID:', {
          newHashedId,
          baseModelId: updates.id,
        });
      } else {
        // Just updating settings, keep existing ID structure
        models[modelIndex] = { ...currentModel, ...updates };

        logger.log('handleUpdateModelSettings: Updated model settings:', {
          modelId: currentModel.id,
          updatedFields: Object.keys(updates),
        });
      }

      await safeStorageSet(STORAGE_KEYS.MODELS, models);
      logger.log('handleUpdateModelSettings: Model updated successfully');
    }
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update model',
    });
  }
}

async function handleAddModel(
  modelData: ModelInfo,
  sendResponse: (response: ResponseMessage) => void
) {
  try {
    logger.log('Background: Adding new model:', modelData);

    // Get separated model storage
    const modelStorage = await getModelStorage();

    // Check max-3-models limit for active models
    if (modelStorage.active.length >= 3) {
      logger.warn('handleAddModel: Maximum active models limit reached:', {
        currentActiveCount: modelStorage.active.length,
        attemptedModel: modelData.name,
      });
      sendResponse({
        success: false,
        error: `Cannot add '${modelData.name}' - maximum of 3 active models allowed. Please deactivate another model first.`,
      });
      return;
    }

    // Check if model already exists in configured models
    const existingConfigured = modelStorage.configured.find(
      (m) => m.id === modelData.id
    );
    if (existingConfigured) {
      // Reactivate existing configured model
      logger.log(
        'Background: Reactivating existing configured model:',
        modelData.id
      );
      const hashedId = generateHashedModelId(existingConfigured.id);

      const activeModel: ActiveModel = {
        ...existingConfigured,
        id: hashedId,
        baseModelId: existingConfigured.id,
        active: true,
        // Override with any new settings from modelData (except structural fields)
        name: modelData.name || existingConfigured.name,
        emoji: modelData.emoji || existingConfigured.emoji,
        color: modelData.color || existingConfigured.color,
        settings: { ...existingConfigured.settings, ...modelData.settings },
      };

      // Remove from configured, add to active
      const configuredIndex = modelStorage.configured.findIndex(
        (m) => m.id === modelData.id
      );
      modelStorage.configured.splice(configuredIndex, 1);
      modelStorage.active.push(activeModel);
    } else {
      // Add as new active model
      const baseModelId = modelData.id; // The original model ID (e.g., 'granite3.3:8b')
      const hashedId = generateHashedModelId(baseModelId);

      // Create new active model with hashed ID
      const newActiveModel: ActiveModel = {
        ...modelData,
        id: hashedId, // Unique hashed ID for storage
        baseModelId: baseModelId, // Original model ID for API calls
        active: true, // New models start as active
      };

      modelStorage.active.push(newActiveModel);
    }

    await saveModelStorage(modelStorage);

    // Also update legacy storage for backward compatibility
    const legacyModels = [...modelStorage.configured, ...modelStorage.active];
    await safeStorageSet(STORAGE_KEYS.MODELS, legacyModels);

    logger.log('Background: Model added successfully:', {
      activeCount: modelStorage.active.length,
      configuredCount: modelStorage.configured.length,
    });

    sendResponse({ success: true });
  } catch (error) {
    logger.error('Background: Error in handleAddModel:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add model',
    });
  }
}

function generateModelId(modelData: ModelInfo): string {
  const provider = modelData.provider || 'ollama';
  const modelName = modelData.name || 'unknown-model';

  // Create provider-based ID format for data model alignment
  if (provider === 'ollama') {
    // For Ollama, use the actual model identifier if available in settings
    const endpoint = modelData.settings.endpoint;
    if (endpoint && endpoint.includes('ollama')) {
      return `ollama/${modelName.toLowerCase().replace(/[^a-z0-9.-]/g, '-')}`;
    }
  }

  return `${provider}/${modelName.toLowerCase().replace(/[^a-z0-9.-]/g, '-')}`;
}

async function handleToggleModel(
  modelId: string,
  sendResponse: (response: ResponseMessage) => void
) {
  try {
    logger.log('Background: handleToggleModel called with modelId:', modelId);
    const modelStorage = await getModelStorage();

    logger.log('Background: Current model storage:', {
      configured: modelStorage.configured.length,
      active: modelStorage.active.length,
      activeIds: modelStorage.active.map(m => m.id),
      configuredIds: modelStorage.configured.map(m => m.id),
    });

    // Look for the model in active models first
    let activeModelIndex = modelStorage.active.findIndex(
      (m) => m.id === modelId
    );
    let configuredModelIndex = -1;

    if (activeModelIndex === -1) {
      // Look in configured models
      configuredModelIndex = modelStorage.configured.findIndex(
        (m) => m.id === modelId
      );
    }

    if (activeModelIndex === -1 && configuredModelIndex === -1) {
      logger.log('Background: Model not found in either active or configured');
      sendResponse({ success: false, error: 'Model not found' });
      return;
    }

    if (activeModelIndex >= 0) {
      // DEACTIVATING: ActiveModel → ConfiguredModel
      const activeModel = modelStorage.active[activeModelIndex];
      logger.log(
        'Background: Deactivating model:',
        activeModel.id,
        '→',
        activeModel.baseModelId
      );

      if (!activeModel.baseModelId) {
        logger.error(
          'Background: Active model missing baseModelId, cannot deactivate safely'
        );
        sendResponse({
          success: false,
          error: 'Cannot deactivate: missing baseModelId',
        });
        return;
      }

      // Convert to ConfiguredModel
      const { baseModelId, ...modelWithoutBaseId } = activeModel; // Remove baseModelId property
      const configuredModel: ConfiguredModel = {
        ...modelWithoutBaseId,
        id: baseModelId, // Restore original ID
        active: false,
      };

      // Remove from active, add to configured
      modelStorage.active.splice(activeModelIndex, 1);
      modelStorage.configured.push(configuredModel);

      logger.log('Background: Deactivated model:', {
        oldId: activeModel.id,
        newId: configuredModel.id,
        activeCount: modelStorage.active.length,
        configuredCount: modelStorage.configured.length,
      });
    } else {
      // ACTIVATING: ConfiguredModel → ActiveModel
      const configuredModel = modelStorage.configured[configuredModelIndex];
      logger.log('Background: Activating model:', configuredModel.id);

      // Check active model limit
      if (modelStorage.active.length >= 3) {
        sendResponse({
          success: false,
          error: 'Maximum 3 active models allowed',
        });
        return;
      }

      const hashedId = generateHashedModelId(configuredModel.id);

      // Convert to ActiveModel
      const activeModel: ActiveModel = {
        ...configuredModel,
        id: hashedId, // New hashed ID
        baseModelId: configuredModel.id, // Store original ID for API calls
        active: true,
      };

      // Remove from configured, add to active
      modelStorage.configured.splice(configuredModelIndex, 1);
      modelStorage.active.push(activeModel);

      logger.log('Background: Activated model:', {
        oldId: configuredModel.id,
        newId: activeModel.id,
        baseModelId: activeModel.baseModelId,
        activeCount: modelStorage.active.length,
        configuredCount: modelStorage.configured.length,
      });
    }

    await saveModelStorage(modelStorage);

    // Also update legacy storage for backward compatibility
    const legacyModels = [...modelStorage.configured, ...modelStorage.active];
    await safeStorageSet(STORAGE_KEYS.MODELS, legacyModels);

    logger.log('Background: Models saved to storage, sending success response');
    sendResponse({ success: true });
  } catch (error) {
    logger.error('Background: Error in handleToggleModel:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle model',
    });
  }
}

async function handleDiscoverOllamaModels(
  sendResponse: (response: ResponseMessage) => void
) {
  logPerformanceMetrics('Starting Ollama discovery');
  try {
    logger.log('Background: Discovering Ollama models via /api/tags');

    const response = await new Promise<{
      ok: boolean;
      status: number;
      json: () => Promise<unknown>;
    }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'http://127.0.0.1:11434/api/tags');
      xhr.setRequestHeader('Accept', 'application/json');

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          logger.log('Background: Discovery response status:', xhr.status);
          resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            json: () => {
              try {
                return Promise.resolve(JSON.parse(xhr.responseText || '{}'));
              } catch (parseError) {
                logger.error(
                  'Background: Failed to parse discovery response:',
                  parseError
                );
                return Promise.reject(new Error('Invalid JSON response'));
              }
            },
          });
        }
      };

      xhr.onerror = () => reject(new Error(`Discovery failed: ${xhr.status}`));
      xhr.ontimeout = () => reject(new Error('Discovery timeout'));
      xhr.timeout = 10000; // 10 second timeout for discovery
      xhr.send();
    });

    if (!response.ok) {
      sendResponse({
        success: false,
        error: `Ollama discovery failed: ${response.status}`,
      });
      return;
    }

    const rawData = await response.json();

    // Validate the response with Zod
    const data = validateOllamaTagsResponse(rawData);
    const discoveredModels: ModelInfo[] = [];

    logger.log(
      'Background: Validated Ollama response, found',
      data.models.length,
      'models'
    );

    for (const model of data.models) {
      const modelId = model.name || model.model || 'unknown';

      // Smart defaults based on model name
      let emoji = '🤖';
      let color = '#8ec07c'; // Default gruvbox green

      if (modelId.includes('gemma')) {
        emoji = '💎';
        color = '#83a598'; // gruvbox blue
      } else if (modelId.includes('llama')) {
        emoji = '🦙';
        color = '#b8bb26'; // gruvbox yellow
      } else if (modelId.includes('phi')) {
        emoji = '🔬';
        color = '#d3869b'; // gruvbox purple
      } else if (modelId.includes('mistral') || modelId.includes('mixtral')) {
        emoji = '⚡';
        color = '#fe8019'; // gruvbox orange
      }

      const modelInfo: ModelInfo = {
        id: modelId, // Inactive models keep original ID
        baseModelId: modelId, // Store base model ID for future reference
        name: modelId,
        emoji,
        color,
        type: 'local',
        active: false,
        settings: {
          temperature: 0.7,
          systemPrompt: 'You are a helpful AI assistant.',
          endpoint: 'http://localhost:11434',
          maxTokens: 2048,
        },
      };

      discoveredModels.push(modelInfo);
    }

    logger.log(
      'Background: Discovered models:',
      discoveredModels.length,
      discoveredModels.map((m) => m.id)
    );

    sendResponse({
      success: true,
      models: discoveredModels,
    });
  } catch (error) {
    logger.error('Background: Error in handleDiscoverOllamaModels:', error);
    sendResponse({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to discover models',
    });
  }
}

async function handleLLMChatRequest(
  llmRequest: {
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
      timestamp?: number;
    }>;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  },
  sendResponse: (response: ResponseMessage) => void
) {
  try {
    logger.log('Background: Making LLM request to Ollama', llmRequest);

    // Build messages array with system prompt if provided
    let messages = [...llmRequest.messages];
    if (llmRequest.systemPrompt && llmRequest.systemPrompt.trim()) {
      const hasSystemMessage = messages.some((msg) => msg.role === 'system');
      if (!hasSystemMessage) {
        messages.unshift({
          role: 'system',
          content: llmRequest.systemPrompt.trim(),
        });
      }
    }

    // Use base model ID for API calls, fallback to provided model or default
    const apiModelId = llmRequest.model || 'gemma3:4b';
    // If it's a hashed model ID, extract the base model ID
    const actualModelId = extractBaseModelId(apiModelId);

    const requestBody = {
      model: actualModelId,
      messages: messages,
      stream: false,
      options: {
        temperature: llmRequest.temperature || 0.7,
        num_predict: llmRequest.maxTokens || 2048,
      },
    };

    logger.log(
      'Background: Request body:',
      JSON.stringify(requestBody, null, 2)
    );

    // Helper function to make XHR request
    const makeRequest = () =>
      new Promise<{
        ok: boolean;
        status: number;
        statusText: string;
        json: () => Promise<unknown>;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://127.0.0.1:11434/api/chat');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Accept', 'application/json');

        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4) {
            logger.log(
              'Background: XHR Response status:',
              xhr.status,
              xhr.statusText
            );
            if (xhr.responseText) {
              logger.log(
                'Background: Response size:',
                xhr.responseText.length,
                'characters'
              );
              logger.log(
                'Background: Response preview:',
                xhr.responseText.substring(0, 200)
              );
            }
            resolve({
              ok: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              statusText: xhr.statusText,
              json: () => {
                try {
                  return Promise.resolve(JSON.parse(xhr.responseText || '{}'));
                } catch (parseError) {
                  logger.error(
                    'Background: Failed to parse JSON response:',
                    parseError
                  );
                  return Promise.reject(new Error('Invalid JSON response'));
                }
              },
            });
          }
        };

        xhr.onerror = function () {
          logger.log('Background: XHR Error:', xhr.status, xhr.statusText);
          reject(new Error(`XHR Error: ${xhr.status} ${xhr.statusText}`));
        };

        xhr.ontimeout = function () {
          logger.log('Background: XHR Timeout');
          reject(new Error('XHR Timeout'));
        };

        xhr.timeout = 60000; // 60 second timeout for model loading
        xhr.send(JSON.stringify(requestBody));
      });

    // First attempt
    let response;
    try {
      response = await makeRequest();
    } catch (error: unknown) {
      // Silent retry for status 0 errors (timeouts/connection issues)
      if (
        error instanceof Error &&
        (error.message.includes('XHR Error: 0') ||
          error.message.includes('XHR Timeout'))
      ) {
        logger.log(
          'Background: Status 0 error detected, attempting silent retry...'
        );
        try {
          response = await makeRequest();
        } catch (retryError) {
          logger.log('Background: Retry also failed, giving up');
          throw retryError;
        }
      } else {
        throw error;
      }
    }

    if (!response.ok) {
      sendResponse({
        success: false,
        error: `Ollama API error: ${response.status} ${response.statusText}`,
      });
      return;
    }

    const rawData = await response.json();
    logger.log('Background: Raw Ollama response:', rawData);

    // Validate response with Zod
    let data;
    try {
      data = validateOllamaChatResponse(rawData);
      logger.log('Background: Validation successful:', data);
    } catch (validationError) {
      logger.error('Background: Response validation failed:', validationError);
      logger.error(
        'Background: Raw response that failed validation:',
        JSON.stringify(rawData, null, 2)
      );

      // Try to extract content from unvalidated response as fallback
      if (
        rawData &&
        typeof rawData === 'object' &&
        'message' in rawData &&
        rawData.message &&
        typeof rawData.message === 'object' &&
        'content' in rawData.message
      ) {
        logger.log('Background: Using fallback response extraction');
        sendResponse({
          success: true,
          response: String(rawData.message.content),
          model: String(rawData.model || llmRequest.model || 'unknown'),
          tokenCount: Number(rawData.eval_count) || 0,
        });
        return;
      }

      sendResponse({
        success: false,
        error: `Response validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`,
      });
      return;
    }

    sendResponse({
      success: true,
      response: data.message.content,
      model: data.model,
      tokenCount: data.eval_count || 0,
    });
  } catch (error) {
    logger.error('Background: Error in handleLLMChatRequest:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to chat with LLM',
    });
  }
}

function broadcastMessage(message: Record<string, unknown>) {
  browser.runtime.sendMessage(message).catch(() => {
    logger.log('Message not delivered (sidebar closed):', message.type);
  });
}
