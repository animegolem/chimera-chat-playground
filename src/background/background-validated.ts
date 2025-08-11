import { logger } from '@/lib/logger';
import {
  validateOllamaTagsResponse,
  validateOllamaChatResponse,
  validateSidebarMessage,
  ResponseMessage,
  ModelInfo,
  validateModelsArray,
  STORAGE_KEYS,
  safeStorageGet,
  safeStorageSet,
} from '@/lib/validation';

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
    logger.log(`[PERF] ${operation} - Messages: ${messageCount}, Time since last: ${timeSinceLastLog}ms`);
    lastLogTime = now;
  }
}

// Default models
const DEFAULT_MODELS: Record<string, ModelInfo> = {
  'gemma3:4b': {
    id: 'gemma3:4b',
    name: 'Gemma 3 4B',
    type: 'local',
    active: true,
    emoji: '💎',
    color: '#83a598',
    settings: {
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
      endpoint: 'http://localhost:11434',
      maxTokens: 2048,
    },
  },
  'llama3.2:7b': {
    id: 'llama3.2:7b',
    name: 'Llama 3.2 7B',
    type: 'local',
    active: false,
    emoji: '🦙',
    color: '#b8bb26',
    settings: {
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
      endpoint: 'http://localhost:11434',
      maxTokens: 2048,
    },
  },
};

// Initialize extension
async function initialize() {
  try {
    const existingModels = await safeStorageGet(STORAGE_KEYS.MODELS);
    if (!existingModels || existingModels.length === 0) {
      const defaultModels = Object.values(DEFAULT_MODELS);
      await safeStorageSet(STORAGE_KEYS.MODELS, defaultModels);
    }
  } catch (error) {
    logger.error('Failed to initialize models:', error);
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
      models[modelIndex] = { ...models[modelIndex], ...updates };
      await safeStorageSet(STORAGE_KEYS.MODELS, models);
    }
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update model',
    });
  }
}

async function handleToggleModel(
  modelId: string,
  sendResponse: (response: ResponseMessage) => void
) {
  try {
    logger.log('Background: handleToggleModel called with modelId:', modelId);
    const models = await safeStorageGet(STORAGE_KEYS.MODELS);

    if (!models) {
      sendResponse({ success: false, error: 'No models found' });
      return;
    }

    logger.log(
      'Background: Current models in storage:',
      models.length,
      models.map((m) => ({ id: m.id, active: m.active }))
    );

    const model = models.find((m) => m.id === modelId);
    logger.log(
      'Background: Found model:',
      model ? { id: model.id, active: model.active } : 'NOT FOUND'
    );

    if (!model) {
      logger.log('Background: Model not found, sending error response');
      sendResponse({ success: false, error: 'Model not found' });
      return;
    }

    // Toggle the model and save back
    const oldActive = model.active;
    model.active = !model.active;
    logger.log(
      'Background: Toggling model from',
      oldActive,
      'to',
      model.active
    );

    await safeStorageSet(STORAGE_KEYS.MODELS, models);
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
        id: modelId,
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

    const requestBody = {
      model: llmRequest.model || 'gemma3:4b',
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
        error instanceof Error && (
          error.message.includes('XHR Error: 0') ||
          error.message.includes('XHR Timeout')
        )
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
      logger.error('Background: Raw response that failed validation:', JSON.stringify(rawData, null, 2));
      
      // Try to extract content from unvalidated response as fallback
      if (rawData && typeof rawData === 'object' && 'message' in rawData && rawData.message && typeof rawData.message === 'object' && 'content' in rawData.message) {
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
