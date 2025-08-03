// Shared constants for Firefox Bootstrap extension

// Default model configurations
export const DEFAULT_MODELS = {
  LOCAL: {
    id: 'local-default',
    name: 'Gemma-8B',
    emoji: '🤖',
    color: '#8ec07c', // gruv-aqua-bright
    type: 'local' as const,
    active: true,
    settings: {
      temperature: 0.7,
      systemPrompt: 'You are a helpful AI assistant focused on quick, accurate responses for web browsing and tab management.',
      endpoint: 'http://localhost:11434', // Default Ollama endpoint
      maxTokens: 2048,
    }
  },
  API: {
    id: 'api-default', 
    name: 'Claude-Sonnet',
    emoji: '🌍',
    color: '#d3869b', // gruv-purple-bright
    type: 'api' as const,
    active: false, // Requires API key
    settings: {
      temperature: 0.9,
      systemPrompt: 'You are an expert AI assistant with deep knowledge of web development and research.',
      endpoint: 'https://openrouter.ai/api/v1',
      maxTokens: 4096,
    }
  }
} as const;

// Storage keys
export const STORAGE_KEYS = {
  SESSIONS: 'firefox-bootstrap-sessions',
  MODELS: 'firefox-bootstrap-models', 
  SETTINGS: 'firefox-bootstrap-settings',
  API_KEYS: 'firefox-bootstrap-api-keys',
  CURRENT_SESSION: 'firefox-bootstrap-current-session',
} as const;

// Message timeouts
export const TIMEOUTS = {
  MESSAGE_RESPONSE: 5000, // 5 seconds
  LLM_REQUEST: 30000,     // 30 seconds
  TAB_ACCESS: 3000,       // 3 seconds
} as const;

// UI Configuration
export const UI_CONFIG = {
  MAX_CHAT_HISTORY: 100,
  MAX_MESSAGE_LENGTH: 10000,
  MAX_SELECTION_LENGTH: 5000,
  DEBOUNCE_SELECTION: 300, // ms
  SIDEBAR_MIN_WIDTH: 320,  // px
} as const;

// LLM Configuration
export const LLM_CONFIG = {
  MAX_CONTEXT_LENGTH: 8000,    // tokens
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