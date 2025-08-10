// Simplified background script for Firefox Bootstrap extension
// Self-contained script without module imports

console.log('Firefox Bootstrap background script loaded');

// Simple storage implementation
const simpleStorage = {
  async get(key) {
    const result = await browser.storage.local.get(key);
    return result[key] || null;
  },

  async set(key, value) {
    await browser.storage.local.set({ [key]: value });
  },

  async getModels() {
    const models = await this.get('models');
    return models || [];
  },

  async saveModels(models) {
    await this.set('models', models);
  },

  async updateModel(modelId, updates) {
    const models = await this.getModels();
    const index = models.findIndex(m => m.id === modelId);
    if (index !== -1) {
      models[index] = { ...models[index], ...updates };
      await this.saveModels(models);
    }
  }
};

// Default models
const DEFAULT_MODELS = {
  'gemma3:4b': {
    id: 'gemma3:4b',
    name: 'Gemma 3 4B',
    type: 'local',
    provider: 'ollama',
    active: true,
    emoji: '💎',
    color: '#83a598',
    settings: {
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
    },
  },
  'llama3.2:7b': {
    id: 'llama3.2:7b', 
    name: 'Llama 3.2 7B',
    type: 'local',
    provider: 'ollama',
    active: false,
    emoji: '🦙',
    color: '#b8bb26',
    settings: {
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
    },
  }
};

// Initialize extension
async function initialize() {
  const existingModels = await simpleStorage.getModels();
  if (existingModels.length === 0) {
    const defaultModels = Object.values(DEFAULT_MODELS);
    await simpleStorage.saveModels(defaultModels);
  }
}

initialize();

// Extension installation handler
browser.runtime.onInstalled.addListener(async (details) => {
  console.log('Firefox Bootstrap installed:', details.reason);

  // Create context menu items
  try {
    await browser.contextMenus.create({
      id: 'send-to-assistant',
      title: 'Send to AI Assistant',
      contexts: ['selection'],
    });
  } catch (error) {
    console.error('Failed to create context menu:', error);
  }

  // Notify sidebar of installation
  broadcastMessage({
    type: 'EXTENSION_UPDATED',
    timestamp: Date.now(),
  });
});

// Context menu click handler
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'send-to-assistant' && info.selectionText) {
    // Send selected text to sidebar
    broadcastMessage({
      type: 'CONTEXT_MENU_SELECTION',
      text: info.selectionText,
      url: tab?.url,
      title: tab?.title,
      timestamp: Date.now(),
    });
  }
});

// Message handler for communication with sidebar/content scripts
browser.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    console.log('Background received message:', message.type, message);
    
    // Handle async messages
    handleMessage(message, sendResponse);
    return true; // Always return true for async responses
  }
);

async function handleMessage(message, sendResponse) {
  try {
    switch (message.type) {
      case 'GET_TAB_GROUPS':
        await handleGetTabGroups(sendResponse);
        break;

      case 'RENAME_TAB_GROUP':
        await handleRenameTabGroup(
          message.groupId,
          message.name,
          sendResponse
        );
        break;

      case 'UPDATE_MODEL_SETTINGS':
        await handleUpdateModelSettings(
          message.modelId,
          message.modelSettings,
          sendResponse
        );
        break;

      case 'TOGGLE_MODEL':
        await handleToggleModel(message.modelId, sendResponse);
        break;

      case 'LLM_CHAT_REQUEST':
        await handleLLMChatRequest(message.llmRequest, sendResponse);
        break;

      case 'DISCOVER_OLLAMA_MODELS':
        await handleDiscoverOllamaModels(sendResponse);
        break;

      default:
        console.warn('Unknown message type:', message.type);
        sendResponse({
          success: false,
          error: `Unknown message type: ${message.type}`,
        });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Message handlers
async function handleGetTabGroups(sendResponse) {
  try {
    if (typeof browser.tabs.group === 'undefined') {
      sendResponse({ success: true, groups: [] });
      return;
    }
    sendResponse({ success: true, groups: [] });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tab groups',
    });
  }
}

async function handleRenameTabGroup(groupId, name, sendResponse) {
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
      error: error instanceof Error ? error.message : 'Failed to rename tab group',
    });
  }
}

async function handleUpdateModelSettings(modelId, updates, sendResponse) {
  try {
    // Use the same storage key as the frontend discovery system
    const result = await browser.storage.local.get('firefox-bootstrap-models');
    const models = result['firefox-bootstrap-models'] || [];
    const modelIndex = models.findIndex((m) => m.id === modelId);

    if (modelIndex === -1) {
      sendResponse({ success: false, error: 'Model not found' });
      return;
    }

    // Update the model settings
    models[modelIndex] = { ...models[modelIndex], ...updates };
    await browser.storage.local.set({ 'firefox-bootstrap-models': models });
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update model',
    });
  }
}

async function handleToggleModel(modelId, sendResponse) {
  try {
    console.log('Background: handleToggleModel called with modelId:', modelId);
    // Use the same storage key as the frontend discovery system
    const result = await browser.storage.local.get('firefox-bootstrap-models');
    const models = result['firefox-bootstrap-models'] || [];
    console.log('Background: Current models in storage:', models.length, models.map(m => ({id: m.id, active: m.active})));
    
    const model = models.find((m) => m.id === modelId);
    console.log('Background: Found model:', model ? {id: model.id, active: model.active} : 'NOT FOUND');

    if (!model) {
      console.log('Background: Model not found, sending error response');
      sendResponse({ success: false, error: 'Model not found' });
      return;
    }

    // Toggle the model and save back
    const oldActive = model.active;
    model.active = !model.active;
    console.log('Background: Toggling model from', oldActive, 'to', model.active);
    
    await browser.storage.local.set({ 'firefox-bootstrap-models': models });
    console.log('Background: Models saved to storage, sending success response');
    sendResponse({ success: true });
  } catch (error) {
    console.error('Background: Error in handleToggleModel:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle model',
    });
  }
}

async function handleDiscoverOllamaModels(sendResponse) {
  try {
    console.log('Background: Discovering Ollama models via /api/tags');
    
    const response = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'http://127.0.0.1:11434/api/tags');
      xhr.setRequestHeader('Accept', 'application/json');
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          console.log('Background: Discovery response status:', xhr.status);
          resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            json: () => Promise.resolve(JSON.parse(xhr.responseText || '{}'))
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
        error: `Ollama discovery failed: ${response.status}`
      });
      return;
    }

    const data = await response.json();
    const discoveredModels = [];
    
    console.log('Background: Raw Ollama response:', JSON.stringify(data, null, 2));

    if (data.models && Array.isArray(data.models)) {
      for (const model of data.models) {
        console.log('Background: Processing model:', JSON.stringify(model, null, 2));
        // Extract model info
        const modelId = model.name || model.model;
        const modelSize = model.size ? `${Math.round(model.size / 1e9)}B` : '';
        
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

        const modelInfo = {
          id: modelId, // Keep exact model ID from Ollama for API calls
          name: modelId, // Use the exact model name from Ollama (don't modify)
          emoji,
          color,
          type: 'local',
          active: false, // Default to inactive, user can toggle
          settings: {
            temperature: 0.7,
            systemPrompt: 'You are a helpful AI assistant.',
            endpoint: 'http://localhost:11434',
            maxTokens: 2048,
          }
        };

        discoveredModels.push(modelInfo);
      }
    }

    console.log('Background: Discovered models:', discoveredModels.length, discoveredModels.map(m => m.id));

    sendResponse({
      success: true,
      models: discoveredModels
    });

  } catch (error) {
    console.error('Background: Error in handleDiscoverOllamaModels:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to discover models'
    });
  }
}

async function handleLLMChatRequest(llmRequest, sendResponse) {
  try {
    console.log('Background: Making LLM request to Ollama', llmRequest);
    
    // Build messages array with system prompt if provided
    let messages = [...llmRequest.messages];
    if (llmRequest.systemPrompt && llmRequest.systemPrompt.trim()) {
      // Add system message at the beginning if not already present
      const hasSystemMessage = messages.some(msg => msg.role === 'system');
      if (!hasSystemMessage) {
        messages.unshift({
          role: 'system',
          content: llmRequest.systemPrompt.trim()
        });
      }
    }

    const requestBody = {
      model: llmRequest.model || 'gemma3:4b',
      messages: messages,
      stream: false,
      options: {
        temperature: llmRequest.temperature || 0.7,
        num_predict: llmRequest.maxTokens || 2048
      }
    };
    
    console.log('Background: Request body:', JSON.stringify(requestBody, null, 2));
    
    // Helper function to make XHR request
    const makeRequest = () => new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://127.0.0.1:11434/api/chat');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'application/json');
      // Don't set Origin header - let it be omitted
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          console.log('Background: XHR Response status:', xhr.status, xhr.statusText);
          if (xhr.responseText) {
            console.log('Background: Response body:', xhr.responseText.substring(0, 200));
          }
          resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            json: () => Promise.resolve(JSON.parse(xhr.responseText))
          });
        }
      };
      
      xhr.onerror = function() {
        console.log('Background: XHR Error:', xhr.status, xhr.statusText);
        reject(new Error(`XHR Error: ${xhr.status} ${xhr.statusText}`));
      };
      
      xhr.ontimeout = function() {
        console.log('Background: XHR Timeout');
        reject(new Error('XHR Timeout'));
      };
      
      xhr.timeout = 60000; // 60 second timeout for model loading
      xhr.send(JSON.stringify(requestBody));
    });
    
    // First attempt
    let response;
    try {
      response = await makeRequest();
    } catch (error) {
      // Silent retry for status 0 errors (timeouts/connection issues)
      if (error.message.includes('XHR Error: 0') || error.message.includes('XHR Timeout')) {
        console.log('Background: Status 0 error detected, attempting silent retry...');
        try {
          response = await makeRequest();
        } catch (retryError) {
          console.log('Background: Retry also failed, giving up');
          throw retryError;
        }
      } else {
        throw error;
      }
    }

    if (!response.ok) {
      sendResponse({
        success: false,
        error: `Ollama API error: ${response.status} ${response.statusText}`
      });
      return;
    }

    const data = await response.json();
    
    sendResponse({
      success: true,
      response: data.message.content,
      model: data.model,
      tokenCount: data.eval_count || 0
    });

  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to chat with LLM'
    });
  }
}

function broadcastMessage(message) {
  browser.runtime.sendMessage(message).catch(() => {
    console.log('Message not delivered (sidebar closed):', message.type);
  });
}