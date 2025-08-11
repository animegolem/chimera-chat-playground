/**
 * ContentChangePlugin - Handles content change detection in Lexical editor
 * Focused on content updates following single-responsibility principle
 */
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_LOW } from 'lexical';

interface ContentChangePluginProps {
  onContentChange?: (_content?: string) => void;
}

export function ContentChangePlugin({
  onContentChange,
}: ContentChangePluginProps): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!onContentChange) return;

    // Handle paste events for content change detection
    const removePasteCommand = editor.registerCommand(
      'paste' as any,
      () => {
        setTimeout(onContentChange, 50);
        return false; // Don't prevent default paste behavior
      },
      COMMAND_PRIORITY_LOW
    );

    return removePasteCommand;
  }, [editor, onContentChange]);

  return null;
}
