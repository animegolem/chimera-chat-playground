# Firefox Bootstrap - AI Coding Experiment Rollout Plan

> An experimental Firefox extension built as a platform for testing AI coding automations and showcasing LLM-assisted development.

## Project Philosophy
- **Primary Goal**: Demonstrate AI-assisted coding workflows
- **Secondary Goal**: Create a useful tab management tool with LLM integration
- **Not a Goal**: Production-ready, polished software

## Phase 0: Foundation 
### Objectives
- Establish project structure
- Set up public repository
- Create initial documentation

### Tasks
1. **Project Initialization** DONE !!!
   - Create git repository with MIT license
   - Design and implement file structure
   - Configure .gitignore for Node/React/Firefox
   
2. **Documentation** DONE !!!
   - Write README.md emphasizing experimental nature
   - Create ROLLOUT_PLAN.md (this file)
   - Add AI_CODING_NOTES.md for tracking automation experiments

3. **Extension** DONE !!!
   - Create manifest.json v3 for Firefox
   - Set up basic extension permissions
   - Create empty script files (background.js, content.js, sidebar.html)

## Phase 1: Build Pipeline 
### Objectives
- Automated build system
- Development environment setup

### Tasks
4. **Vite Configuration** DONE !!!
   - Set up Vite for React/TypeScript
   - Configure multiple entry points (background, content, sidebar)
   - Add watch mode for development

5. **Styling Setup** 
   - Install and configure Tailwind CSS
   - Add Gruvbox color palette
   - Import Hack font
   - Set up shadcn/ui

6. **TypeScript Configuration**
   - Configure tsconfig.json for Firefox extension APIs
   - Add type definitions for browser APIs
   - Set up strict mode

## Phase 2: Core Extension Architecture 
### Objectives
- Message passing infrastructure
- Basic extension functionality

### Tasks
7. **Background Script**
   - Implement tab group event listeners
   - Create message router
   - Add extension lifecycle management

8. **Content Script**
   - Implement text selection detection
   - Add page content extraction
   - Create message handlers

9. **Message Bus**
   - Define TypeScript interfaces for all message types
   - Implement reliable message passing
   - Add error handling and logging

## Phase 3: UI Foundation 
### Objectives
- React sidebar application
- Component architecture

### Tasks
10. **React App Structure**
    - Set up React context for state management
    - Create component hierarchy
    - Implement routing (if needed)

11. **Core Components**
    - Chat message list
    - Model toggle pills  
    - Lexical input editor (migrated from TipTap due to markdown shortcut issues)
    - Settings dialog

11.5. **Unified Text Rendering System**
    - Code block support in Lexical editor (``` markdown syntax)
    - Syntax highlighting for code blocks (Prism.js integration)
    - Shared CSS system for input/output formatting consistency
    - ContentSanitizer integration for AI response code highlighting
    - HTML→Markdown conversion for copy functionality

12. **State Management**
    - Implement useReducer for complex state
    - Add persistence with browser.storage
    - Create action creators

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
- **P0: Foundation** (Issues 1-3)
- **P1: Build System** (Issues 4-6)
- **P2: Core Architecture** (Issues 7-9)
- **P3: UI Development** (Issues 10-12)
- **P4: LLM Features** (Issues 13-15)
- **P5: Advanced Features** (Issues 16-18)
- **P6: Polish** (Issues 19-21)

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
