/**
 * KeyboardShortcutPlugin - Handles keyboard shortcuts in Lexical editor
 * Focused on keyboard interactions following single-responsibility principle
 */
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_LOW, KEY_DOWN_COMMAND } from 'lexical';

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
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        console.log(
          'DEBUG: KeyboardShortcutPlugin triggered, key:',
          event.key,
          'ctrlKey:',
          event.ctrlKey
        );

        // Always call onKeyDown to let parent handle all key events
        if (onKeyDown) {
          onKeyDown(event);
        }

        return false; // Always allow other handlers to process
      },
      COMMAND_PRIORITY_LOW // Low priority to not interfere with built-ins
    );

    return removeKeyCommand;
  }, [editor, onKeyDown]);

  return null;
}
