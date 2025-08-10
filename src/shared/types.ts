// Shared TypeScript types for Firefox Bootstrap extension

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
  updatedAt?: number;
  model?: ModelInfo;
}

export interface ModelInfo {
  id: string;
  name: string;
  emoji: string;
  color: string;
  type: 'local' | 'api';
  active: boolean;
  settings: ModelSettings;
}

export interface ModelSettings {
  temperature: number;
  systemPrompt: string;
  topP?: number;
  maxTokens?: number;
  apiKey?: string; // For API models
  endpoint?: string; // For local models
}

export interface TabGroupInfo {
  id: number;
  title?: string;
  tabCount: number;
  tabs: TabInfo[];
}

export interface TabInfo {
  id: number;
  title?: string;
  url?: string;
  hostname?: string;
  active: boolean;
}

export interface SelectionInfo {
  text: string;
  url: string;
  title: string;
  timestamp: number;
}

export interface PageContent {
  text: string;
  title: string;
  url: string;
  domain: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  models: ModelInfo[];
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  models: ModelInfo[]; // Full model objects with metadata
  activeModelIds: string[]; // Active model IDs for clarity
  modelColors: Record<string, string>; // Quick color lookup
  activeModels: string[]; // Legacy field - to be removed after migration
  currentSelection: SelectionInfo | null;
  highlightedLines: number;
  sidebarOpen: boolean;
}
