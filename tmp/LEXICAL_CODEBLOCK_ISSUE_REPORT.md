# Lexical Code Block Issue Report

## Problem Summary

Our Lexical editor implementation creates separate code blocks for each line when pressing Enter within a code block, instead of creating multi-line code blocks like the official Lexical playground.

## Expected Behavior (Lexical Playground)

1. Type ``` + space → Creates ONE code block
2. Press Enter within code block → Adds new line WITHIN the same code block
3. Press Enter twice → Escapes the code block to normal paragraph
4. Result: Single `<pre>` element with multiple lines inside

## Actual Behavior (Our Implementation)

1. Type ``` + space → Creates code block (✅ works)
2. Press Enter within code block → Creates NEW separate code block
3. Result: Multiple separate `<pre>` elements instead of one multi-line block

## Visual Comparison

**Expected (Playground):**
```html
<pre>
  <span>Line 1</span><br>
  <span>Line 2</span><br>
  <span>Line 3</span>
</pre>
```

**Actual (Our Implementation):**
```html
<pre><span>Line 1</span></pre>
<pre><span>Line 2</span></pre>
<pre><span>Line 3</span></pre>
```

## Debug Evidence

### Node Structure Analysis
- **Fixed**: Node insertion order (was scrambled, now sequential)
- **Working**: Final DOM structure is correct
- **Issue**: Each Enter creates new CodeNode instead of adding linebreaks within existing CodeNode

### Debug Output Shows:
```
root
  └ (4) code 
    ├ (5) text "Line 1"
    ├ (6) linebreak 
    ├ (7) text "Line 2"
    ├ (8) linebreak 
    └ (9) text "Line 3"
```

This LOOKS correct structurally, but visually renders as separate blocks.

## Technical Details

### Our Current Setup
```typescript
// Components
<MarkdownShortcutPlugin transformers={TRANSFORMERS} />
<CodeHighlightPlugin />

// Nodes
CodeNode, CodeHighlightNode

// Theme
code: 'bg-gruv-dark-0 border border-gruv-dark-4 rounded p-3 my-2...'
```

### What We've Tried

1. **✅ Fixed KeyDownPlugin interference** - Removed DOM event listeners that were preventing proper CodeNode behavior
2. **✅ Added CodeHighlightPlugin** - Added `registerCodeHighlighting()` for proper code block support
3. **✅ Proper command priority** - Used `COMMAND_PRIORITY_LOW` to not interfere with built-ins
4. **❌ Still creating separate blocks** - Enter key still creates new CodeNodes instead of adding to existing

### Key Findings

- **Root cause is NOT Enter key handling** - That was causing node insertion scrambling, which we fixed
- **Real issue**: Markdown transformer behavior or missing plugin for multi-line code blocks
- **The TRANSFORMERS array** from `@lexical/markdown` includes `CODE` transformer but may not handle multi-line correctly
- **CodeNode.insertNewAfter()** might be called instead of inserting linebreaks within the node

## Current Hypothesis

The issue may be in:

1. **CODE transformer implementation** - The `@lexical/markdown` CODE transformer might be designed for single-line blocks
2. **Missing specialized plugin** - May need a specific multi-line code block plugin beyond CodeHighlightPlugin
3. **Theme configuration** - Our `code` theme property might be overriding multi-line behavior
4. **MarkdownShortcutPlugin configuration** - May need additional configuration for multi-line support

## Environment

- **Lexical Version**: 0.33.1 (production ESM)
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Browser**: Firefox (extension context)

## Next Steps for Investigation

1. **Compare transformer arrays** - Check if playground uses different/additional transformers
2. **Inspect playground plugins** - Identify any missing plugins in our setup
3. **Test minimal reproduction** - Create simple test case with just essential components
4. **Theme configuration** - Test without custom code theme
5. **Alternative approaches** - Consider custom CodeNode implementation if needed

## Code References

- **Main editor**: `src/sidebar/components/LexicalEditor.tsx:279` (MarkdownShortcutPlugin)
- **Debug environment**: `debug.html` with full reproduction
- **Node analysis**: `tmp/subagent/lexical-codeblock-analysis.ipynb`

## Request for Input

Looking for insights on:
- Is this a known limitation of Lexical's markdown shortcuts?
- Are there additional plugins needed for multi-line code blocks?
- Should we implement a custom transformer or CodeNode behavior?
- Any configuration differences between our setup and the playground?