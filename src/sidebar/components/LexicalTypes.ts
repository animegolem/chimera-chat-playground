export interface LexicalEditorProps {
  content: string;
  onKeyDown?: (event: KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onImageDrop?: (base64: string, fileName: string) => void;
  onContentChange?: (content?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface LexicalEditorRef {
  focus: () => void;
  clear: () => void;
  getEditor: () => any;
  getText: () => string;
  getMarkdown: () => string;
}
