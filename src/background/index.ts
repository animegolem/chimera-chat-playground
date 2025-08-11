// Background script for Firefox Bootstrap extension
// Handles always-on tab group naming and extension lifecycle

import { storage } from '@/lib/storage';
import {
  BackgroundMessage,
  SidebarMessage,
  ResponseMessage,
  ExtensionMessage,
} from '@/shared/messages';
import {
  DEFAULT_MODELS,
  FEATURE_FLAGS,
  EXTENSION_INFO,
} from '@/shared/constants';
import { ModelInfo } from '@/shared/types';
import { logger } from '@/lib/logger';

logger.log(
  `${EXTENSION_INFO.NAME} ${EXTENSION_INFO.VERSION} background script loaded`
);

// Initialize extension on startup
initialize();

async function initialize() {
  // Initialize default models if not exist
  const existingModels = await storage.getModels();
  if (existingModels.length === 0) {
    const defaultModels = Object.values(DEFAULT_MODELS);
    await storage.saveModels(defaultModels);
  }
}

// Extension installation handler
browser.runtime.onInstalled.addListener(async (details) => {
  logger.log('Firefox Bootstrap installed:', details.reason);

  if (FEATURE_FLAGS.ENABLE_CONTEXT_MENU) {
    // Create context menu items
    try {
      await browser.contextMenus.create({
        id: 'send-to-assistant',
        title: 'Send to AI Assistant',
        contexts: ['selection'],
      });
    } catch (error) {
      logger.error('Failed to create context menu:', error);
    }
  }

  // Notify sidebar of installation
  broadcastMessage({
    type: 'EXTENSION_UPDATED',
    timestamp: Date.now(),
  });
});

// Tab group creation listener for auto-naming (Firefox 137+)
if (
  FEATURE_FLAGS.ENABLE_TAB_NAMING &&
  typeof browser.tabs.group !== 'undefined'
) {
  // Note: Firefox tab groups API is experimental (137+)
  logger.log('Tab groups API detected - tab naming feature available');

  // TODO: Implement tab group listeners when API is stable in Firefox
  // For now, focusing on chat interface functionality
} else {
  logger.log(
    'Tab groups API not available - extension will work without auto-naming'
  );
}

// Context menu click handler
if (FEATURE_FLAGS.ENABLE_CONTEXT_MENU) {
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
}

// Message handler for communication with sidebar/content scripts
browser.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender,
    sendResponse: (response: ResponseMessage) => void
  ) => {
    if (FEATURE_FLAGS.DEBUG_MESSAGES) {
      logger.log(
        'Background received message:',
(message as { type?: string })?.type || 'unknown',
        message
      );
    }

    // Handle async messages
    handleMessage(message as SidebarMessage, sendResponse);
    return true; // Always return true for async responses
  }
);

async function handleMessage(
  message: SidebarMessage,
  sendResponse: (response: ResponseMessage) => void
) {
  try {
    switch (message.type) {
      case 'GET_TAB_GROUPS':
        await handleGetTabGroups(sendResponse);
        break;

      case 'RENAME_TAB_GROUP':
        await handleRenameTabGroup(
          message.groupId!,
          message.name!,
          sendResponse
        );
        break;

      case 'UPDATE_MODEL_SETTINGS':
        await handleUpdateModelSettings(
          message.modelId!,
          message.modelSettings!,
          sendResponse
        );
        break;

      case 'TOGGLE_MODEL':
        await handleToggleModel(message.modelId!, sendResponse);
        break;

      case 'LLM_CHAT_REQUEST':
        await handleLLMChatRequest(message.llmRequest!, sendResponse);
        break;

      default:
        logger.warn('Unknown message type:', message.type);
        sendResponse({
          success: false,
          error: `Unknown message type: ${message.type}`,
        });
    }
  } catch (error) {
    logger.error('Error handling message:', error);
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
      sendResponse({ success: true, groups: [] }); // Return empty array if not supported
      return;
    }

    // TODO: Implement when tab groups API is stable in Firefox
    // For now, return empty groups array
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

    // TODO: Implement when tab groups API is stable in Firefox
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
    await storage.updateModel(modelId, updates);
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
    const models = await storage.getModels();
    const model = models.find((m) => m.id === modelId);

    if (!model) {
      sendResponse({ success: false, error: 'Model not found' });
      return;
    }

    await storage.updateModel(modelId, { active: !model.active });
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle model',
    });
  }
}

async function handleLLMChatRequest(
  llmRequest: Record<string, unknown>,
  sendResponse: (response: ResponseMessage) => void
) {
  try {
    // Make direct fetch request to Ollama from background script (bypasses CORS)
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: llmRequest.model || 'gemma3:4b',
        messages: llmRequest.messages,
        stream: false,
        options: {
          temperature: llmRequest.temperature || 0.7,
          num_predict: llmRequest.maxTokens || 2048,
        },
      }),
    });

    if (!response.ok) {
      sendResponse({
        success: false,
        error: `Ollama API error: ${response.status} ${response.statusText}`,
      });
      return;
    }

    const data = await response.json();

    sendResponse({
      success: true,
      response: data.message.content,
      model: data.model,
      tokenCount: data.eval_count || 0,
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to chat with LLM',
    });
  }
}

// Helper functions
async function generateTabGroupName(
  tabData: Array<{ title: string; url: string }>
): Promise<string> {
  if (tabData.length === 0) return 'New Group';

  // Extract common domains
  const domains = tabData.map((t) => t.url).filter(Boolean);
  const uniqueDomains = [...new Set(domains)];

  if (uniqueDomains.length === 1 && uniqueDomains[0] !== 'unknown') {
    return uniqueDomains[0];
  }

  // Look for common keywords in titles
  const titles = tabData
    .map((t) => t.title)
    .join(' ')
    .toLowerCase();

  // Development patterns
  if (
    titles.includes('github') ||
    titles.includes('gitlab') ||
    titles.includes('bitbucket')
  ) {
    return 'Development';
  }

  // Documentation patterns
  if (
    titles.includes('docs') ||
    titles.includes('documentation') ||
    titles.includes('api')
  ) {
    return 'Documentation';
  }

  // Learning patterns
  if (
    titles.includes('tutorial') ||
    titles.includes('learn') ||
    titles.includes('course')
  ) {
    return 'Learning';
  }

  // Shopping patterns
  if (
    titles.includes('shop') ||
    titles.includes('buy') ||
    titles.includes('cart')
  ) {
    return 'Shopping';
  }

  // Social media patterns
  if (
    titles.includes('twitter') ||
    titles.includes('linkedin') ||
    titles.includes('facebook')
  ) {
    return 'Social';
  }

  // News patterns
  if (
    titles.includes('news') ||
    titles.includes('article') ||
    titles.includes('blog')
  ) {
    return 'News';
  }

  // Fallback to tab count
  return `${tabData.length} Tabs`;
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

function broadcastMessage(message: BackgroundMessage) {
  browser.runtime.sendMessage(message).catch(() => {
    // Sidebar might not be open, ignore error
    if (FEATURE_FLAGS.DEBUG_MESSAGES) {
      logger.log('Message not delivered (sidebar closed):', message.type);
    }
  });
}
