import { useState, useEffect, useCallback } from 'react';
import { SelectionInfo } from '@/shared/types';
import { BackgroundMessage, ContentMessage } from '@/shared/messages';
import { logger } from '@/lib/logger';

interface UseSelectionReturn {
  currentSelection: SelectionInfo | null;
  highlightedLines: number;
  setSelection: (selection: SelectionInfo | null) => void;
  setHighlightedLines: (count: number) => void;
}

export function useSelection(): UseSelectionReturn {
  const [currentSelection, setCurrentSelection] =
    useState<SelectionInfo | null>(null);
  const [highlightedLines, setHighlightedLines] = useState(0);

  const setSelection = useCallback((selection: SelectionInfo | null) => {
    setCurrentSelection(selection);
    setHighlightedLines(selection ? selection.text.split('\n').length : 0);
  }, []);

  // Setup message listeners for text selection events
  useEffect(() => {
    const handleMessage = (message: BackgroundMessage | ContentMessage) => {
      switch (message.type) {
        case 'CONTEXT_MENU_SELECTION':
          if (message.text) {
            logger.log('useSelection: Context menu selection received');
            setSelection({
              text: message.text,
              url: message.url || '',
              title: message.title || '',
              timestamp: message.timestamp || Date.now(),
            });
          }
          break;

        case 'TEXT_SELECTED':
          if (message.text) {
            logger.log('useSelection: Text selection received');
            setSelection({
              text: message.text,
              url: message.url || '',
              title: message.title || '',
              timestamp: message.timestamp || Date.now(),
            });
          }
          break;

        case 'TEXT_SELECTION_CLEARED':
          logger.log('useSelection: Text selection cleared');
          setSelection(null);
          break;

        case 'HIGHLIGHT_UPDATED':
          if (typeof message.highlightCount === 'number') {
            setHighlightedLines(message.highlightCount);
          }
          break;
      }
    };

    // Listen for messages from background and content scripts
    browser.runtime.onMessage.addListener(handleMessage);

    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, [setSelection]);

  return {
    currentSelection,
    highlightedLines,
    setSelection,
    setHighlightedLines,
  };
}
