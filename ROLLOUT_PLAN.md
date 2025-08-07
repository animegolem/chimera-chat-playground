# Firefox Bootstrap - AI Coding Experiment Rollout Plan

> An experimental Firefox extension built as a platform for testing AI coding automations and showcasing LLM-assisted development.

## 🚀 Current Status (Updated 2025-08-06)

- **Overall Progress**: Phase 3 → Phase 4 transition (95% → LLM Integration)
- **Extension**: Fully functional with rich text editor, message passing, and smart paste
- **Next Priority**: Rich message rendering (Phase 3.7: Issues IAC-112 through IAC-116)
- **LLM Ready**: Ollama setup confirmed, architecture prepared for Phase 4
- **Technical Debt**: ✅ Completed systematic Lexical editor cleanup (IAC-102 through IAC-111)

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

11.7. **Rich Message Rendering** 🔄 IN PROGRESS (Phase 3.7)
    - Markdown export from Lexical editor (IAC-112) ⏳
    - RichMessageContent component for AI responses (IAC-113) ⏳
    - ChatHistory integration with rich text (IAC-114) ⏳
    - Copy-as-markdown functionality (IAC-115) ⏳
    - Consistent styling between input/output (IAC-116) ⏳

12. **State Management** DONE !!!
    - Implement useReducer for complex state ✅
    - Add persistence with browser.storage ✅
    - Create action creators ✅

## Phase 4: LLM Integration

### Objectives

- Local and API model support
- Tab naming automation

### Tasks

13. **Local LLM Connection**
    - Implement Ollama/llamafile adapter
    - Add connection status monitoring
    - Create fallback handling

14. **API Integration**
    - OpenRouter client implementation
    - Secure API key management
    - Rate limiting and error handling

15. **Tab Group Naming**
    - Always-on background monitoring
    - Context extraction from tabs
    - LLM prompt engineering

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
- **P3: UI Development** (Issues 10-12) ✅ 95% COMPLETE
  - **P3.6: Smart Paste** (Issue 111) ✅ COMPLETE - Bridge to Phase 4 ready!
  - **P3.7: Rich Message Rendering** (Issues 112-116) 🔄 IN PROGRESS
    - IAC-112: Markdown export from Lexical
    - IAC-113: RichMessageContent component  
    - IAC-114: ChatHistory rich text integration
    - IAC-115: Copy-as-markdown functionality
    - IAC-116: Consistent input/output styling
- **P4: LLM Features** (Issues 13-15) ⏳ READY (Ollama setup confirmed)
- **P5: Advanced Features** (Issues 16-18)
- **P6: Polish** (Issues 19-21)

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

1. Working Firefox extension installable via about:debugging
2. Successful tab group auto-naming
3. Functional chat with both local and API models
4. Public repository with clear AI coding documentation
5. At least 5 documented AI automation experiments

## Out of Scope (v1)

- Chrome/Edge support
- Production error tracking
- User authentication
- Cloud sync
- Extensive testing suite
