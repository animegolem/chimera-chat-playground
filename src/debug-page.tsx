import React, { useCallback } from 'react';
import {
  LexicalEditor,
  LexicalEditorRef,
} from './sidebar/components/LexicalEditor';

function DebugPage() {
  const handleChange = useCallback((content: string) => {
    console.log('Content changed:', content);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    console.log('Key pressed:', event.key);
  }, []);

  return (
    <div
      style={{
        padding: '20px',
        background: '#1d2021',
        color: '#ebdbb2',
        minHeight: '100vh',
        fontFamily: 'Courier New, monospace',
      }}
    >
      <h1>Lexical Code Block Debug</h1>

      <div
        style={{
          background: '#3c3836',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px',
          fontSize: '12px',
        }}
      >
        <h3>Instructions:</h3>
        <ol>
          <li>Open browser DevTools (F12)</li>
          <li>Go to Console tab</li>
          <li>
            Type <code>```</code> + space to create code block
          </li>
          <li>Add some text, press Enter within the block</li>
          <li>Check console for node structure logs</li>
        </ol>
      </div>

      <div
        style={{
          background: '#282828',
          border: '2px solid #504945',
          borderRadius: '6px',
          padding: '12px',
          minHeight: '300px',
        }}
      >
        <LexicalEditor
          content=""
          onContentChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type ``` + space for code block..."
          className="w-full"
        />
      </div>

      <div
        style={{
          background: '#3c3836',
          padding: '12px',
          borderRadius: '6px',
          marginTop: '20px',
          fontSize: '12px',
        }}
      >
        <strong>Current Status:</strong> Using your existing LexicalEditor
        component with current configuration
      </div>
    </div>
  );
}

export default DebugPage;
