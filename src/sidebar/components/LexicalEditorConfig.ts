import { ElementTransformer } from '@lexical/markdown';
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode';
import { CodeNode, $isCodeNode, $createCodeNode } from '@lexical/code';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { InitialConfigType } from '@lexical/react/LexicalComposer';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { MarkNode } from '@lexical/mark';
import { logger } from '@/lib/logger';

// Email regex for AutoLinkPlugin
export const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

// Horizontal Rule transformer for --- markdown shortcut
export const HR_TRANSFORMER: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node: any) => {
    return $isHorizontalRuleNode(node) ? '***' : null;
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = $createHorizontalRuleNode();

    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line);
    } else {
      parentNode.insertBefore(line);
    }

    line.selectNext();
  },
  type: 'element',
};

// Custom Shiki-compatible code block transformer for ``` markdown shortcut
export const SHIKI_CODE_BLOCK_TRANSFORMER: ElementTransformer = {
  dependencies: [CodeNode],
  export: (node: any) => {
    if (!$isCodeNode(node)) {
      return null;
    }
    const textContent = node.getTextContent();
    const language = node.getLanguage() || '';
    return '```' + language + '\n' + textContent + '\n```';
  },
  regExp: /^```([a-z]*)?\s$/,
  replace: (parentNode, children, match) => {
    const language = match[1] || '';
    const codeNode = $createCodeNode(language);

    // Don't include the backticks in the code content
    // children will be empty or contain only whitespace at this point

    parentNode.replace(codeNode);
    codeNode.selectStart();
  },
  type: 'element',
};

export const createLexicalConfig = (disabled: boolean): InitialConfigType => ({
  namespace: 'ChimeraEditor',
  nodes: [
    HeadingNode,
    QuoteNode,
    ListNode,
    ListItemNode,
    CodeNode,
    CodeHighlightNode,
    LinkNode,
    AutoLinkNode,
    MarkNode,
    HorizontalRuleNode,
  ],
  onError: (error: Error) => {
    logger.error('Lexical Error:', error);
  },
  theme: {
    root: 'relative min-h-[60px] bg-transparent text-gruv-light font-mono text-sm leading-relaxed',
    paragraph: 'm-0 p-0',
    heading: {
      h1: 'text-lg font-bold text-gruv-red mb-1',
      h2: 'text-base font-bold text-gruv-yellow mb-1',
      h3: 'text-sm font-bold text-gruv-green mb-1',
      h4: 'text-sm font-bold text-gruv-blue mb-1',
      h5: 'text-sm font-bold text-gruv-purple mb-1',
      h6: 'text-sm font-bold text-gruv-orange mb-1',
    },
    list: {
      nested: {
        listitem: 'list-none',
      },
      ol: 'list-decimal ml-5 my-1',
      ul: 'list-disc ml-5 my-1',
      listitem: 'my-0.5',
    },
    text: {
      bold: 'font-bold text-gruv-yellow',
      italic: 'italic text-gruv-blue',
      underline: 'underline',
      strikethrough: 'line-through',
      code: 'bg-gruv-dark-2 text-gruv-green px-1 py-0.5 rounded font-mono text-xs',
    },
    code: 'editor-code',
    quote: 'editor-quote',
    link: 'text-gruv-blue underline hover:text-gruv-light cursor-pointer',
    mark: 'bg-gruv-yellow text-gruv-dark-0 px-1 rounded',
    hr: 'border-0 border-t border-gruv-dark-4 my-4',
    hrSelected: 'outline outline-2 outline-gruv-blue',
  },
  editable: !disabled,
});
