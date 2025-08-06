# Lexical Code Block Implementation Plan

## Current Status (Post-Rollback)
- ✅ Stock Lexical `MarkdownShortcutPlugin` handles ``` + space creation
- ✅ Double Enter escape mechanism works
- ❌ Enter within code blocks creates new blocks instead of line breaks
- ❌ Missing proper code block visual styling (no line numbers, basic appearance)

## Root Issues Identified

### Issue 1: Missing Visual Code Block Rendering
**Problem**: We're getting basic `code` nodes but not full `codeBlock` visual treatment
**Cause**: Missing `CodePlugin` from `@lexical/code` for proper rendering
**Evidence**: Playground shows line numbers, rich styling - we get plain text

### Issue 2: Enter Key Behavior Within Code Blocks  
**Problem**: Enter creates new code blocks instead of line breaks within existing block
**Cause**: No plugin handling Enter key within existing code blocks
**Evidence**: DOM should show single `code` node with `linebreak` children

## Implementation Plan

### Phase 1: Restore Proper Code Block Rendering
1. **Add CodePlugin from @lexical/code**
   ```tsx
   import { CodePlugin } from '@lexical/code';
   // Add to plugin list
   ```

2. **Update Theme Configuration**
   ```tsx
   theme: {
     code: 'bg-gruv-dark-0 border border-gruv-dark-4 rounded p-3 my-2 overflow-x-auto text-gruv-green font-mono text-xs',
     codeBlock: {
       // Add proper code block theming with line numbers
     }
   }
   ```

3. **Test Visual Appearance**
   - Verify line numbers appear
   - Confirm proper block styling
   - Check monospace formatting

### Phase 2: Fix Enter Key Behavior (Minimal Plugin)
1. **Create Focused EnterWithinCodeBlockPlugin**
   ```tsx
   function EnterWithinCodeBlockPlugin() {
     // ONLY handle Enter key when already inside code block
     // Insert linebreak node instead of new code block
     // Don't interfere with creation or other behavior
   }
   ```

2. **Integration Strategy**
   - Register with lower priority than stock transformers
   - Only activate when cursor is within existing code block
   - Minimal, targeted fix

### Phase 3: Testing & Validation
1. **Visual Testing**
   - Code block appearance matches playground
   - Line numbers work correctly
   - Styling consistent with Gruvbox theme

2. **Behavior Testing**
   - ``` + space creation (should still work)
   - Enter within blocks → line breaks
   - Double Enter escape (should still work)
   - No overlapping blocks

### Phase 4: Code Highlighting Integration
1. **Add Prism.js or similar**
2. **Language detection from ``` markdown syntax**
3. **Syntax highlighting within code blocks**

## Key Principles
- **Work WITH Lexical's system, not against it**
- **Minimal plugins for specific fixes only**
- **Preserve all working stock behavior**
- **Focus on visual parity with Lexical playground**

## Files to Modify
- `src/sidebar/components/LexicalEditor.tsx`
  - Add CodePlugin import and registration
  - Update theme configuration
  - Add minimal Enter handling plugin

## Success Criteria
- ✅ Code blocks look like playground (line numbers, styling)
- ✅ ``` + space creates proper code blocks
- ✅ Enter within code blocks adds line breaks
- ✅ Double Enter exits code blocks
- ✅ No overlapping or broken blocks
- ✅ Consistent Gruvbox theming