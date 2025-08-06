# Claude Context Catchup - TipTap Markdown Investigation

## Current Status: TipTap Markdown Shortcuts Not Working

### What We've Accomplished ✅
1. **Hybrid Security Architecture**: User posts render as rich HTML (trusted), LLM responses go through marked + DOMPurify sanitization (untrusted)
2. **GraphIAC ContentSanitizer**: Successfully ported secure markdown→HTML pipeline with XSS protection
3. **Copy as Markdown**: HTML→Markdown conversion using Turndown works for clipboard functionality
4. **LLM Content Display**: Fixed sanitizer issue (was too restrictive, switched from whitelist to blacklist approach)

### The TipTap Problem ❌
**Current State**: Some markdown shortcuts work (bold, italic, highlight, typography), but textblock transformations (headers, lists, code blocks, blockquotes) do NOT work.

**Key Discovery**: User observed that `# ` only disappears at the FIRST character of input box, not on subsequent lines. This revealed the issue is position-specific input rules.

**Latest Symptom**: After version alignment to 2.26.1, `# ` behavior is unchanged (still disappears with space but doesn't create header), and `> ` is no longer recognized as a command at all (regression).

### Investigation Timeline

#### Phase 1: Initial Hybrid Approach
- ✅ Switched from trying to fix TipTap shortcuts to hybrid approach
- ✅ User input: TipTap rich HTML (trusted)  
- ✅ LLM output: marked + DOMPurify sanitization (untrusted)
- Result: Working solution with partial markdown support

#### Phase 2: Enter Key Theory
- **Theory**: Custom Enter key handling was creating `<br>` instead of `<p>` blocks
- **Test**: Removed all keyboard event handlers
- **Result**: Made things WORSE - `# ` now disappeared on any line, not just first
- **Conclusion**: Keyboard handling was NOT the issue, rolled back changes

#### Phase 3: Version Mismatch Theory  
- **Issue**: Mixed TipTap versions (StarterKit 2.1.13, Extensions 2.26.1)
- **User's Key Observation**: `# ` + space disappears, but backspace reveals `# ` (with space) - proving input rule fires but transformation fails
- **Action**: Upgraded all TipTap packages to 2.26.1
- **Result**: Regression - `> ` no longer works at all, `# ` unchanged

### Current Package Versions (All 2.26.1)
```json
"@tiptap/react": "^2.26.1",
"@tiptap/starter-kit": "^2.26.1", 
"@tiptap/extension-placeholder": "^2.26.1",
"@tiptap/extension-highlight": "^2.26.1",
"@tiptap/extension-typography": "^2.26.1"
```

### Working vs Non-Working Features

#### ✅ Working Markdown:
- `**bold**` → **bold text**
- `*italic*` → *italic text*  
- `==highlight==` → highlighted text
- Typography: `(c)` → ©, `->` → →, `--` → —

#### ❌ Not Working (Textblock Rules):
- `# ` → H1 heading (disappears but no transformation)
- `## ` → H2 heading (same issue)
- `` `code` `` → inline code (no transformation)
- ```` → code block (disappears but no block created)
- `> ` → blockquote (no longer recognized after version upgrade)
- `* ` → bullet list (no transformation)
- `1. ` → ordered list (no transformation)

### Technical Analysis

#### Input Rule Behavior:
- **Mark rules** (bold, italic) work perfectly
- **Textblock rules** (headers, lists) fire but fail to complete transformation
- **Pattern**: `find: /^(#{1,6})\s$/` matches, consumes characters, but node creation fails

#### Current TipTap Configuration:
```typescript
// TipTapEditor.tsx - Current working config
const editor = useEditor({
  extensions: [
    StarterKit,        // Should include all input rules
    Typography,        // Working (symbols)
    Highlight,         // Working (==text==)
    Placeholder
  ],
  // ... rest of config
});
```

### Architecture Working Well
```
User Input (TipTap) → Rich HTML → Direct Display ✅
LLM Response (Markdown) → Marked → DOMPurify → Safe HTML ✅  
Copy Button → HTML → Turndown → Markdown → Clipboard ✅
```

### Next Steps Options

#### Option A: Accept Partial Markdown (Recommended)
- Current state is highly functional for chat interface
- Bold, italic, highlights work for basic formatting
- LLM responses render beautifully with full markdown support
- Focus on LLM integration instead

#### Option B: Investigate Further
- Try different TipTap versions (maybe 2.0.0-beta like reference example)
- Create minimal reproduction case
- Check if our styling/configuration interferes with node creation

#### Option C: Alternative Solutions
- Switch to different markdown editor (Monaco Editor, CodeMirror)
- Custom markdown shortcuts implementation
- Use react-markdown for input as well

### Files Changed in This Session
- `/src/sidebar/utils/sanitizer.ts` - GraphIAC-style content sanitizer
- `/src/sidebar/utils/converter.ts` - HTML to Markdown conversion utility  
- `/src/sidebar/components/ChatHistory.tsx` - Hybrid rendering (user HTML, LLM sanitized)
- `/src/sidebar/components/TipTapEditor.tsx` - TipTap configuration
- `/package.json` - TipTap version alignment

### Performance Impact
- Bundle size increased ~130KB due to marked + turndown + DOMPurify
- No noticeable performance impact
- Security significantly improved for LLM responses

### Recommendation
**Move forward with LLM integration.** The hybrid approach works excellently for the chat use case. Users can still format text with bold/italic/highlights, and all LLM responses render perfectly with full markdown support including code syntax highlighting via the sanitizer.

The textblock markdown shortcuts are a nice-to-have but not essential for a functional chat interface. We've spent significant time on this without clear resolution, and the current state provides excellent UX.

### Debug Information for Future
- Firefox extension console: `about:debugging#/runtime/this-firefox` → "Inspect"
- TipTap debug: `console.log(editor.extensionManager.extensions)`
- Input rules: `console.log(editor.schema.plugins)`
- Version compatibility seems to be the core issue, not our implementation