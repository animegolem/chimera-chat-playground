// Message passing interfaces for Firefox Bootstrap extension

import {
  TabGroupInfo,
  SelectionInfo,
  PageContent,
  ModelInfo,
  Message,
} from './types';

// Messages from Background Script
export interface BackgroundMessage {
  type:
    | 'TAB_GROUP_NAMED'
    | 'TAB_GROUP_CREATED'
    | 'CONTEXT_MENU_SELECTION'
    | 'EXTENSION_UPDATED'
    | 'LLM_RESPONSE';

  // Tab group events
  groupId?: number;
  name?: string;
  tabCount?: number;

  // Context menu
  text?: string;
  url?: string;
  title?: string;

  // Generic
  timestamp?: number;
}

// Messages from Content Script
export interface ContentMessage {
  type:
    | 'TEXT_SELECTED'
    | 'TEXT_SELECTION_CLEARED'
    | 'PAGE_CONTENT_READY'
    | 'HIGHLIGHT_UPDATED';

  // Text selection
  text?: string;
  url?: string;
  title?: string;
  timestamp?: number;

  // Page content
  content?: PageContent;

  // Highlighting
  highlightCount?: number;
}

// Messages from Sidebar
export interface SidebarMessage {
  type:
    | 'GET_TAB_GROUPS'
    | 'RENAME_TAB_GROUP'
    | 'GET_PAGE_CONTENT'
    | 'GET_SELECTION'
    | 'HIGHLIGHT_TEXT'
    | 'SEND_TO_LLM'
    | 'LLM_CHAT_REQUEST'
    | 'UPDATE_MODEL_SETTINGS'
    | 'TOGGLE_MODEL'
    | 'ADD_MODEL'
    | 'DISCOVER_OLLAMA_MODELS';

  // Tab management
  groupId?: number;
  name?: string;

  // Content requests
  tabId?: number;
  searchText?: string;

  // LLM interaction
  prompt?: string;
  models?: string[]; // Model IDs to use
  includeSelection?: boolean;
  includePageContent?: boolean;

  // LLM Chat Request
  llmRequest?: {
    messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
      timestamp?: number;
    }>;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };

  // Model management
  modelId?: string;
  modelSettings?: Partial<ModelInfo>;
  modelData?: ModelInfo; // For ADD_MODEL: complete model object
}

// Response messages
export interface ResponseMessage {
  success: boolean;
  error?: string;

  // Tab group responses
  groups?: TabGroupInfo[];

  // Content responses
  selection?: SelectionInfo;
  content?: PageContent;
  highlightCount?: number;

  // LLM responses
  response?: string;
  model?: string;
  tokenCount?: number;

  // Response data (varies by message type)
  data?: Record<string, unknown>;
}

// Union of all message types
export type ExtensionMessage =
  | BackgroundMessage
  | ContentMessage
  | SidebarMessage
  | ResponseMessage;

// Message sending helpers
export interface MessageSender {
  sendToBackground: (message: SidebarMessage) => Promise<ResponseMessage>;
  sendToContent: (
    message: SidebarMessage,
    tabId?: number
  ) => Promise<ResponseMessage>;
  sendToSidebar: (message: BackgroundMessage | ContentMessage) => void;
}

// Error types
export interface ExtensionError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

export const ERROR_CODES = {
  TAB_ACCESS_DENIED: 'TAB_ACCESS_DENIED',
  LLM_CONNECTION_FAILED: 'LLM_CONNECTION_FAILED',
  STORAGE_ERROR: 'STORAGE_ERROR',
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;
