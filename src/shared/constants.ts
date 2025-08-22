// Shared constants for Firefox Bootstrap extension

// Default model configurations (synced with background script)
export const DEFAULT_MODELS = {
  'gemma3:4b': {
    id: 'gemma3:4b',
    name: 'Gemma 3 4B',
    emoji: '💎',
    color: '#83a598', // gruv-blue-bright
    type: 'local' as const,
    active: true,
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
    emoji: '🦙',
    color: '#b8bb26', // gruv-yellow-bright
    type: 'local' as const,
    active: false,
    settings: {
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant.',
      endpoint: 'http://localhost:11434',
      maxTokens: 2048,
    },
  },
} as const;

// Storage keys
export const STORAGE_KEYS = {
  SESSIONS: 'firefox-bootstrap-sessions',
  MODELS: 'firefox-bootstrap-models', // Legacy ModelInfo array
  MODELS_V2: 'firefox-bootstrap-models-v2', // New separated format
  SETTINGS: 'firefox-bootstrap-settings',
  API_KEYS: 'firefox-bootstrap-api-keys',
  CURRENT_SESSION: 'firefox-bootstrap-current-session',
} as const;

// Message timeouts
export const TIMEOUTS = {
  MESSAGE_RESPONSE: 5000, // 5 seconds
  LLM_REQUEST: 30000, // 30 seconds
  TAB_ACCESS: 3000, // 3 seconds
} as const;

// UI Configuration
export const UI_CONFIG = {
  MAX_CHAT_HISTORY: 100,
  MAX_MESSAGE_LENGTH: 10000,
  MAX_SELECTION_LENGTH: 5000,
  DEBOUNCE_SELECTION: 300, // ms
  SIDEBAR_MIN_WIDTH: 320, // px
} as const;

// LLM Configuration
export const LLM_CONFIG = {
  MAX_CONTEXT_LENGTH: 8000, // tokens
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_TOP_P: 0.9,
  MAX_TOKENS_PER_REQUEST: 2048,

  // Prompts
  TAB_NAMING_PROMPT: `Based on the following tab information, suggest a short, descriptive name for this tab group (max 20 characters):

Tabs:
{tabs}

Respond with only the suggested name, no explanation.`,

  CHAT_SYSTEM_PROMPT: `You are an AI assistant integrated into Firefox. You can help with:
- Analyzing web content and highlighted text
- Research and information gathering  
- Web development questions
- General assistance

Keep responses concise and helpful. You have access to the current page content and any highlighted text.`,
} as const;

// Extension info
export const EXTENSION_INFO = {
  NAME: 'Firefox Bootstrap',
  VERSION: '0.1.0',
  DESCRIPTION: 'AI-powered tab management and chat assistant',
  HOMEPAGE: 'https://github.com/yourusername/firefox-bootstrap',
} as const;

// Feature flags for development
export const FEATURE_FLAGS = {
  ENABLE_TAB_NAMING: true,
  ENABLE_CONTEXT_MENU: true,
  ENABLE_FILE_UPLOAD: false, // Coming in Phase 5
  ENABLE_OBSIDIAN_SYNC: false, // Coming in Phase 5
  DEBUG_MESSAGES: true,
  ENABLE_LOCAL_LLM: true,
  ENABLE_API_LLM: true,
} as const;
