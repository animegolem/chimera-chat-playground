# Firefox Bootstrap - AI Coding Experiment Rollout Plan

> An experimental Firefox extension built as a platform for testing AI coding automations and showcasing LLM-assisted development.

## 🚀 Current Status (Updated 2025-08-08)

- **Overall Progress**: Phase 4 in progress - LLM Integration 🚀
- **Extension**: Fully functional UI with rich text editor, code highlighting, and message passing
- **Current Focus**: LLM provider implementation (Issues IAC-129 through IAC-133 created in Linear)
- **Phase 3 Complete**: ✅ Rich message rendering, code block copy buttons, language detection
- **Technical Updates**: ✅ Upgraded to Lexical v0.34.0 stable, Shiki integration complete

## Project Philosophy

- **Primary Goal**: Demonstrate AI-assisted coding workflows
- **Secondary Goal**: Create a useful tab management tool with LLM integration

## Phase 0: Foundation

### Objectives

- Establish project structure ✅
- Set up public repository ✅
- Create initial documentation ✅

### Tasks

1. **Project Initialization** DONE !!!
   - Create git repository with MIT license ✅
   - Design and implement file structure ✅
   - Configure .gitignore for Node/React/Firefox ✅

2. **Documentation** DONE !!!
   - Write README.md emphasizing experimental nature ✅
   - Create ROLLOUT_PLAN.md (this file) ✅
   - Add AI_CODING_NOTES.md for tracking automation experiments ✅

3. **Extension** DONE !!!
   - Create manifest.json v3 for Firefox ✅
   - Set up basic extension permissions ✅
   - Create empty script files (background.js, content.js, sidebar.html) ✅

## Phase 1: Build Pipeline ✅ COMPLETE

### Objectives

- Automated build system ✅
- Development environment setup ✅

### Tasks

4. **Vite Configuration** DONE !!!
   - Set up Vite for React/TypeScript ✅
   - Configure multiple entry points (background, content, sidebar) ✅
   - Add watch mode for development ✅

5. **Styling Setup** DONE !!!
   - Install and configure Tailwind CSS ✅
   - Add Gruvbox color palette ✅
   - Import Hack font ✅
   - Set up shadcn/ui ✅

6. **TypeScript Configuration** DONE !!!
   - Configure tsconfig.json for Firefox extension APIs ✅
   - Add type definitions for browser APIs ✅
   - Set up strict mode ✅

## Phase 2: Core Extension Architecture ✅ COMPLETE

### Objectives

- Message passing infrastructure ✅
- Basic extension functionality ✅

### Tasks

7. **Background Script** DONE !!!
   - Implement tab group event listeners ✅
   - Create message router ✅
   - Add extension lifecycle management ✅

8. **Content Script** DONE !!!
   - Implement text selection detection ✅
   - Add page content extraction ✅
   - Create message handlers ✅

9. **Message Bus** DONE !!!
   - Define TypeScript interfaces for all message types ✅
   - Implement reliable message passing ✅
   - Add error handling and logging ✅

## Phase 3: UI Foundation ✅ COMPLETE (95%)

### Objectives

- React sidebar application ✅
- Component architecture ✅
- Smart paste handling ✅ (Phase 3.6 - IAC-111 DONE!)
- Rich text editor with Lexical ✅

### Tasks

10. **React App Structure** DONE !!!
    - Set up React context for state management ✅
    - Create component hierarchy ✅
    - Implement routing (if needed) ✅ (Single-page design)

11. **Core Components** DONE !!!
    - Chat message list ✅ (Basic rendering, needs rich text - Phase 3.7)
    - Model toggle pills ✅
    - Lexical input editor ✅ (migrated from TipTap, fully functional)
    - Settings dialog ⚠️ (Placeholder only)

11.5. **Unified Text Rendering System** DONE !!!
    - Code block support in Lexical editor (``` markdown syntax) ✅
    - Smart code block escape functionality (3+ empty lines auto-exit) ✅
    - Line numbering for code blocks ✅
    - Shared CSS system for input/output formatting consistency ✅
    - ContentSanitizer integration for AI response code highlighting ✅
    - HTML→Markdown conversion for copy functionality ✅

11.6. **Smart Paste Handling** DONE !!! (Phase 3.6 - IAC-111)
    - Context-aware paste formatting plugin ✅
    - Detect paste context: general editor vs code blocks ✅
    - Intelligent content routing: markdown parsing vs raw text preservation ✅
    - Integration with TRANSFORMERS for security ✅
    - Critical for Phase 4 LLM integration UX ✅

11.7. **Rich Message Rendering** ✅ COMPLETE (Phase 3.7)
    - Markdown export from Lexical editor (IAC-112) ✅
    - RichMessageContent component for AI responses (IAC-113) ✅
    - ChatHistory integration with rich text (IAC-114) ✅
    - Copy-as-markdown functionality (IAC-115) ✅
    - Consistent styling between input/output (IAC-116) ✅

12. **State Management** DONE !!!
    - Implement useReducer for complex state ✅
    - Add persistence with browser.storage ✅
    - Create action creators ✅

## Phase 4: LLM Integration 🚀 MOSTLY COMPLETE (70%)

### Objectives

- Local and API model support ✅ Basic Ollama working, OpenRouter pending
- Tab naming automation ⏳ Pending
- Streaming responses ⏳ Pending (blocked by model management)

### Current Status - WORKING CHAT! 🎉

**✅ COMPLETED:**
- Basic LLM chat functionality with Ollama
- CORS bypass via background script (XMLHttpRequest)
- User/AI message flow in sidebar
- Thinking indicator with bouncing dots
- Input clearing on send for immediate feedback
- Error handling with user-friendly messages
- OLLAMA_ORIGINS="*" server configuration documented

**⚠️ LIMITATIONS:**
- Hardcoded model selection (gemma3:4b only)
- No model discovery from Ollama /api/tags
- No settings UI for model configuration
- No streaming responses (complete response only)
- No model color theming (generic UI)

### Tasks

13. **Local LLM Connection** ✅ BASIC VERSION COMPLETE
    - LLM Service Base Architecture (IAC-129) ✅ COMPLETE
    - Implement Ollama provider (IAC-130) ✅ WORKING (background script bypass)
    - Add connection status monitoring ✅ Basic error handling
    - Create fallback handling ✅ Error messages in chat

13.1. **Model Management System** 🚧 NEW - CRITICAL FOR COMPLETION
    - Dynamic Model Discovery (IAC-134) ⏳ Discover models from Ollama /api/tags
    - Model State Refactoring (IAC-135) ⏳ Store full ModelInfo objects with colors
    - Settings UI Implementation (IAC-136) ⏳ Model configuration interface

14. **API Integration** ⏳ BLOCKED BY MODEL MANAGEMENT
    - OpenRouter provider implementation (IAC-131) ⏳ Blocked by model system
    - Secure API key management ⏳ 
    - Rate limiting and error handling ⏳

15. **Chat Interface Integration** ✅ BASIC VERSION COMPLETE  
    - Wire up LLM to sidebar (IAC-132) ✅ WORKING chat with real AI responses
    - Implement streaming UI (IAC-133) ⏳ Blocked by provider refactoring
    - Tab group auto-naming ⏳ Pending
    - Context injection for chat ⏳ Pending

## Phase 5: Advanced Features

### Objectives

- Page interaction
- External integrations

### Tasks

16. **Context Awareness**
    - Highlighted text capture
    - @check-website command
    - Context indicators in UI

17. **MCP/Obsidian Integration**
    - Advanced URI construction
    - Note formatting with pandoc style
    - Error handling for missing vault

18. **File Upload**
    - Simple text file handling
    - Drag-and-drop support
    - File content preview

## Phase 6: Polish & Testing

### Objectives

- Bug fixes
- Performance optimization
- Documentation

### Tasks

19. **UI Polish**
    - Animation refinements
    - Dark mode consistency
    - Accessibility improvements

20. **Performance**
    - Bundle size optimization
    - Lazy loading
    - Memory leak prevention

21. **Documentation**
    - User guide
    - Developer notes
    - AI automation insights

## Linear Issue Structure

### Epic: Firefox Bootstrap MVP

- **P0: Foundation** (Issues 1-3) ✅ COMPLETE
- **P1: Build System** (Issues 4-6) ✅ COMPLETE  
- **P2: Core Architecture** (Issues 7-9) ✅ COMPLETE
- **P3: UI Development** (Issues 10-12) ✅ COMPLETE
  - **P3.6: Smart Paste** (Issue 111) ✅ COMPLETE
  - **P3.7: Rich Message Rendering** (Issues 112-116) ✅ COMPLETE
- **P4: LLM Features** 🚀 MAJOR PROGRESS (70% complete)
  - IAC-129: LLM Service Base Architecture ✅ COMPLETE
  - IAC-130: Implement Ollama Provider ✅ WORKING (background script)
  - IAC-131: Add OpenRouter API Provider ⏳ Blocked by model management
  - IAC-132: Integrate LLM Service with Sidebar Chat ✅ WORKING CHAT!
  - IAC-133: Implement Message Streaming UI ⏳ Blocked by model management
  - **P4.1: Model Management System** 🚧 NEW CRITICAL PATH:
    - IAC-134: Model Management System - Dynamic Discovery & Configuration
    - IAC-135: Refactor Model State Management - Store Full ModelInfo Objects  
    - IAC-136: Settings UI Implementation - Model Management Interface
- **P5: Advanced Features** (Issues 16-18) ⏳ Ready to start
- **P6: Polish** (Issues 19-21) ⏳ Ready to start

### Phase 4 Dependencies Overview

**CRITICAL PATH**: Model Management System (IAC-134, IAC-135, IAC-136)
- **BLOCKS**: OpenRouter Provider (IAC-131), Streaming UI (IAC-133)
- **ENABLES**: Full model selection, proper theming, settings UI
- **CURRENT**: Hardcoded models prevent full feature completion

**WORKING NOW**: Basic chat with Ollama, thinking indicators, error handling
**NEXT PRIORITY**: IAC-135 (Model State Refactoring) → enables proper model access

### Recent Technical Debt Cleanup (IAC-102 through IAC-111)

✅ **All 10 issues completed** - Systematic Lexical editor refactoring using BDD methodology:

- Plugin architecture improvements
- CSS module extraction  
- Command pattern implementations
- Debug console cleanup with regression fixes
- onChange handler simplification
- TRANSFORMERS evaluation and optimization
- Smart paste functionality with context detection

### Labels

- `ai-experiment`: Tasks specifically for testing AI coding
- `core`: Essential functionality
- `enhancement`: Nice-to-have features
- `automation`: CI/CD and build automation

## Success Metrics

1. Working Firefox extension installable via about:debugging ✅ ACHIEVED
2. Successful tab group auto-naming ⏳ Pending
3. Functional chat with both local and API models ✅ LOCAL WORKING / API pending
4. Public repository with clear AI coding documentation ✅ ACHIEVED
5. At least 5 documented AI automation experiments ⏳ In progress

### Current Achievement Status (Updated 2025-08-09)

**🎉 MAJOR MILESTONE**: Real LLM chat functionality working!
- Users can send messages and receive AI responses from Ollama
- CORS issues resolved with background script bypass
- Proper error handling and user feedback
- Thinking indicators and immediate input clearing
- All UI components integrated and functional

**📈 Progress**: Phase 4 is 70% complete with core chat working
**🚧 Blocker**: Model management system needed for full feature completion
**⏭️ Next**: IAC-135 model state refactoring to enable model selection UI

## Out of Scope (v1)

- Chrome/Edge support
- Production error tracking
- User authentication
- Cloud sync
- Extensive testing suite
