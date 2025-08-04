# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development Workflow
```bash
# Install dependencies
npm install

# Development build with watch mode
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Code quality
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
npm run format        # Format code with Prettier
npm run format:check  # Check formatting
```

### Firefox Extension Testing
```bash
# Load extension in Firefox
# 1. Navigate to about:debugging
# 2. Click "This Firefox"
# 3. Click "Load Temporary Add-on"
# 4. Select any file in the dist/ folder

# Extension console (for debugging)
# Navigate to: about:debugging#/runtime/this-firefox → "Inspect"
```

### CI Pipeline Requirements
All code must pass these checks before merge:
- `npm run type-check` - TypeScript compilation
- `npm run lint` - ESLint validation (max 50 warnings)
- `npm run format:check` - Prettier formatting
- `npm run build` - Successful build

## Architecture Overview

### Firefox WebExtension Structure
This is a manifest v3 Firefox extension with three main entry points:

- **Sidebar App** (`src/sidebar/`): React application for chat interface
- **Background Script** (`src/background/`): Extension lifecycle and tab management  
- **Content Script** (`src/content/`): Page interaction and text selection

### Multi-Entry Vite Configuration
The build system uses Vite with multiple entry points configured in `vite.config.ts`:
- `sidebar.js` - React sidebar application
- `background.js` - Background service worker
- `content.js` - Content script for page interaction

### Hybrid TipTap Architecture (CRITICAL)
The project uses a security-focused hybrid approach for handling user input vs AI responses:

**User Input**: TipTap rich editor → HTML (trusted content, direct display)
**AI Responses**: Markdown → marked → DOMPurify → Safe HTML

Key files:
- `src/sidebar/components/TipTapEditor.tsx` - Rich text input
- `src/sidebar/utils/sanitizer.ts` - ContentSanitizer class (GraphIAC-based)
- `src/sidebar/utils/converter.ts` - HTML↔Markdown conversion

### Current TipTap Limitations
⚠️ **Known Issue**: TipTap markdown shortcuts partially work:
- ✅ Working: `**bold**`, `*italic*`, `==highlight==`, typography symbols
- ❌ Not Working: `# headers`, `` `code` ``, ```` code blocks, `> blockquotes`, `* lists`

See `claude-catchup.md` for detailed investigation history. The hybrid approach compensates for these limitations.

### State Management Pattern
React Context + useReducer with browser.storage persistence:
- `src/sidebar/contexts/AppContext.tsx` - Main state management
- `src/lib/storage.ts` - Browser storage utilities
- `src/shared/types.ts` - TypeScript interfaces

### Message Passing System
Type-safe inter-script communication:
- `src/shared/messages.ts` - Message type definitions
- Background ↔ Sidebar: Extension lifecycle, model management
- Content ↔ Sidebar: Text selection, page context

## Project-Specific Patterns

### AI-Assisted Development
This is an experimental AI coding project. Key practices:
- **TodoWrite Integration**: Always use TodoWrite tool for task planning
- **Documentation**: Update `AI_CODING_NOTES.md` for experiments
- **Phase-Based Development**: Follow `ROLLOUT_PLAN.md` structure
- **Hybrid Approach**: Balance AI generation with human oversight

### Gruvbox Terminal Aesthetic
Consistent theming throughout:
- Colors defined in `tailwind.config.js` (gruv-* classes)
- Hack font for monospace consistency
- Dark terminal-inspired UI design

### Current Development Phase
**Phase 3**: UI Foundation (nearly complete)
- ✅ TipTap hybrid architecture implemented
- ✅ Secure content sanitization
- ⚠️ TipTap markdown shortcuts partially working
- 🔄 Next: LLM integration (Phase 4)

## TypeScript Configuration

### Extension-Specific Setup
- `tsconfig.json` configured for Firefox extension APIs
- `src/types/browser.d.ts` provides global browser type definitions
- `@types/chrome` installed for WebExtension API types
- Strict mode enabled with extension-specific allowances

### Import Aliases
```typescript
// Use @ alias for src imports
import { Message } from '@/shared/types';
import { Button } from '@/components/ui/button';
```

## Critical Development Notes

### Security Model
- **User content**: Trusted (HTML rendering)
- **AI responses**: Untrusted (markdown → sanitization pipeline)
- All external links open in new tabs with security attributes

### Extension Permissions
Current manifest permissions:
- `tabs`, `storage`, `activeTab`, `scripting`, `contextMenus`
- `<all_urls>` host permissions for content script injection

### Build Output Structure
```
dist/
├── sidebar.js     # React app bundle
├── background.js  # Background script
├── content.js     # Content script
├── sidebar.html   # Extension sidebar
├── manifest.json  # Extension manifest
└── icons/         # Extension icons
```

### Development Status Indicators
- 🚧 **Experimental**: Not production software
- ✅ **Working**: Chat UI, content sanitization, text selection
- ⚠️ **Partial**: TipTap markdown shortcuts
- 🔄 **Pending**: LLM integration, settings dialog, Obsidian export

## Testing & Debugging

### Extension Debugging
1. Load extension via `about:debugging`
2. Use browser DevTools for sidebar debugging
3. Background script logs appear in extension console
4. Content script logs in page DevTools

### Common Issues
- **TipTap textblock rules**: Use fallback to basic formatting
- **Message passing**: Ensure proper type definitions in `messages.ts`
- **Storage**: Browser storage is async, use proper error handling

## Key Dependencies

### Core Stack
- **React 18** + TypeScript for UI
- **TipTap 2.26.1** for rich text editing
- **Tailwind CSS** + shadcn/ui for styling
- **Vite** for build system

### Content Processing
- **marked 16.1.1** for markdown parsing
- **DOMPurify 3.0.5** for HTML sanitization
- **turndown 7.2.0** for HTML→markdown conversion

### Development
- **ESLint + Prettier** for code quality
- **@types/chrome** for extension API types
- **GitHub Actions** for CI/CD