import React, { useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LexicalEditor,
  LexicalEditorRef,
} from './sidebar/components/LexicalEditor';
// Using Tailwind classes directly instead of importing CSS

function DebugApp() {
  const handleChange = useCallback((content: string) => {
    console.log('Content changed:', content);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    console.log('Key pressed:', event.key, 'Ctrl:', event.ctrlKey);

    // Test Ctrl+Enter functionality
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      console.log('🚀 Ctrl+Enter detected - this should trigger send!');
      event.preventDefault();
      alert('Ctrl+Enter works! This would send the message.');
      return;
    }

    // Log editor state on every keystroke for debugging
    setTimeout(() => {
      const editorElement = document.querySelector('[contenteditable="true"]');
      if (editorElement) {
        console.log('DOM structure after keystroke:');
        console.log(editorElement.innerHTML);
        console.log('Text content:', editorElement.textContent);
      }
    }, 10);
  }, []);

  return (
    <div className="min-h-screen bg-gruv-dark p-5 text-gruv-light font-mono">
      <h1 className="text-xl text-gruv-yellow mb-4">
        Lexical Code Block Debug
      </h1>

      <div className="bg-gruv-dark-1 p-3 rounded mb-5 text-xs">
        <h3 className="text-gruv-green mb-2">Instructions:</h3>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Open browser DevTools (F12)</li>
          <li>Go to Console tab</li>
          <li>
            Type <code className="bg-gruv-dark-2 px-1 rounded">```</code> +
            space to create code block
          </li>
          <li>Add some text, press Enter within the block</li>
          <li>Watch console for DOM structure logs</li>
          <li>Compare with expected playground behavior</li>
        </ol>
      </div>

      <div className="bg-gruv-dark-1 border-2 border-gruv-dark-4 rounded p-3 min-h-[300px]">
        <LexicalEditor
          content=""
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type ``` + space for code block..."
          className="w-full"
        />
      </div>

      <div className="bg-gruv-dark-1 p-3 rounded mt-5 text-xs">
        <strong className="text-gruv-orange">Status:</strong> 🔥 TESTING BUILD
        UPDATE v5 🔥 - Using your existing LexicalEditor component. Check
        console for detailed node structure on every keystroke.
      </div>
    </div>
  );
}

const container = document.getElementById('debug-root');
if (container) {
  const root = createRoot(container);
  root.render(<DebugApp />);
}
