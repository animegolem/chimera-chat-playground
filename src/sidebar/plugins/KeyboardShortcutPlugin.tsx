/**
 * KeyboardShortcutPlugin - Handles keyboard shortcuts in Lexical editor
 * Focused on keyboard interactions following single-responsibility principle
 */
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_LOW } from 'lexical';

interface KeyboardShortcutPluginProps {
  onKeyDown?: (event: KeyboardEvent) => void;
}

export function KeyboardShortcutPlugin({
  onKeyDown,
}: KeyboardShortcutPluginProps): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onKeyDown) return;

    const removeKeyCommand = editor.registerCommand(
      'keydown' as any,
      (event: KeyboardEvent) => {
        // Only handle special key combinations that need custom behavior
        // Let Lexical handle normal editing (including Enter in code blocks)
        if (event.ctrlKey || event.metaKey || event.altKey) {
          onKeyDown(event);
          // Don't prevent default - let other handlers run too
        }
        return false; // Always allow other handlers to process
      },
      COMMAND_PRIORITY_LOW // Low priority to not interfere with built-ins
    );

    return removeKeyCommand;
  }, [editor, onKeyDown]);

  return null;
}
