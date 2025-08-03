// Content script for Firefox Bootstrap extension
// Handles page interaction, text selection, and DOM content extraction

console.log('Firefox Bootstrap content script loaded');

let lastSelection = '';
let selectionTimeout: number | null = null;

// Listen for text selection changes
document.addEventListener('mouseup', handleSelectionChange);
document.addEventListener('keyup', handleSelectionChange);

// Message handler for communication with sidebar/background
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message.type);

  switch (message.type) {
    case 'GET_PAGE_CONTENT':
      handleGetPageContent(sendResponse);
      return true; // Async response

    case 'GET_SELECTION':
      handleGetSelection(sendResponse);
      return true; // Async response

    case 'HIGHLIGHT_TEXT':
      handleHighlightText(message.text, sendResponse);
      return true; // Async response

    default:
      console.warn('Unknown message type:', message.type);
  }
});

function handleSelectionChange() {
  // Debounce selection changes to avoid spam
  if (selectionTimeout) {
    clearTimeout(selectionTimeout);
  }

  selectionTimeout = window.setTimeout(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';

    if (selectedText && selectedText !== lastSelection) {
      lastSelection = selectedText;

      // Send selection to sidebar
      browser.runtime
        .sendMessage({
          type: 'TEXT_SELECTED',
          text: selectedText,
          url: window.location.href,
          title: document.title,
          timestamp: Date.now(),
        })
        .catch(() => {
          // Sidebar might not be open, ignore error
        });

      console.log('Text selected:', selectedText.substring(0, 50) + '...');
    } else if (!selectedText && lastSelection) {
      // Selection cleared
      lastSelection = '';
      browser.runtime
        .sendMessage({
          type: 'TEXT_SELECTION_CLEARED',
        })
        .catch(() => {
          // Sidebar might not be open, ignore error
        });
    }
  }, 300);
}

function handleGetPageContent(sendResponse: Function) {
  try {
    // Extract main content, avoiding navigation and ads
    const content = extractMainContent();

    sendResponse({
      success: true,
      content: {
        text: content,
        title: document.title,
        url: window.location.href,
        domain: window.location.hostname,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function handleGetSelection(sendResponse: Function) {
  const selection = window.getSelection();
  const selectedText = selection?.toString().trim() || '';

  sendResponse({
    success: true,
    selection: {
      text: selectedText,
      url: window.location.href,
      title: document.title,
      timestamp: Date.now(),
    },
  });
}

function handleHighlightText(searchText: string, sendResponse: Function) {
  try {
    // Simple text highlighting (could be enhanced with better algorithms)
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent?.includes(searchText)) {
        textNodes.push(node);
      }
    }

    // Highlight found text nodes
    textNodes.forEach((textNode) => {
      const parent = textNode.parentElement;
      if (parent && !parent.classList.contains('firefox-bootstrap-highlight')) {
        const highlighted = document.createElement('mark');
        highlighted.className = 'firefox-bootstrap-highlight';
        highlighted.style.backgroundColor = '#8ec07c';
        highlighted.style.color = '#1d2021';

        const content = textNode.textContent || '';
        const parts = content.split(searchText);

        if (parts.length > 1) {
          const fragment = document.createDocumentFragment();
          parts.forEach((part, index) => {
            if (index > 0) {
              const mark = highlighted.cloneNode() as HTMLElement;
              mark.textContent = searchText;
              fragment.appendChild(mark);
            }
            if (part) {
              fragment.appendChild(document.createTextNode(part));
            }
          });

          parent.replaceChild(fragment, textNode);
        }
      }
    });

    sendResponse({
      success: true,
      highlightCount: textNodes.length,
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function extractMainContent(): string {
  // Try to find main content area
  const mainSelectors = [
    'main',
    '[role="main"]',
    '.main-content',
    '#main-content',
    '.content',
    '#content',
    'article',
    '.post-content',
    '.entry-content',
  ];

  for (const selector of mainSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      return cleanText(element.textContent || '');
    }
  }

  // Fallback to body, but filter out common navigation/footer elements
  const body = document.body.cloneNode(true) as HTMLElement;

  // Remove navigation, ads, and other non-content elements
  const removeSelectors = [
    'nav',
    'header',
    'footer',
    'aside',
    '.navigation',
    '.nav',
    '.menu',
    '.sidebar',
    '.ad',
    '.advertisement',
    '.social',
    '.share',
    '.comments',
  ];

  removeSelectors.forEach((selector) => {
    const elements = body.querySelectorAll(selector);
    elements.forEach((el) => el.remove());
  });

  return cleanText(body.textContent || '');
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^\s+|\s+$/g, '') // Trim
    .substring(0, 10000); // Limit length to avoid massive content
}

// Add some basic styles for highlighting
if (!document.getElementById('firefox-bootstrap-styles')) {
  const style = document.createElement('style');
  style.id = 'firefox-bootstrap-styles';
  style.textContent = `
    .firefox-bootstrap-highlight {
      background-color: #8ec07c !important;
      color: #1d2021 !important;
      border-radius: 2px;
      padding: 1px 2px;
    }
  `;
  document.head.appendChild(style);
}
