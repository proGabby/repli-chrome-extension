// DOM Utilities for X AI Reply content script

/**
 * Extracts the text content of the tweet being replied to.
 */
export function extractTweetText(toolbar: HTMLElement): string {
  // Scenario A: Reply is in a modal popup (e.g., clicking reply icon on feed)
  const modal = toolbar.closest('[data-testid="sheetDialog"], [role="dialog"]');
  if (modal) {
    const tweetTextEl = modal.querySelector('[data-testid="tweetText"]');
    if (tweetTextEl && tweetTextEl.textContent) {
      return tweetTextEl.textContent.trim();
    }
  }

  // Scenario B: Inline reply on a status detail page
  let current: HTMLElement | null = toolbar;
  while (current && current !== document.body) {
    let sibling = current.previousElementSibling;
    while (sibling) {
      const tweetTextEl = sibling.querySelector('[data-testid="tweetText"]');
      if (tweetTextEl && tweetTextEl.textContent) {
        return tweetTextEl.textContent.trim();
      }
      if (sibling.getAttribute('data-testid') === 'tweet') {
        const text = sibling.querySelector('[data-testid="tweetText"]');
        if (text && text.textContent) return text.textContent.trim();
      }
      sibling = sibling.previousElementSibling;
    }
    current = current.parentElement;
  }

  // Scenario C: Fallback to the main tweet on the detail page
  const mainTweetTextEl = document.querySelector('article[data-testid="tweet"] [data-testid="tweetText"]');
  if (mainTweetTextEl && mainTweetTextEl.textContent) {
    return mainTweetTextEl.textContent.trim();
  }

  return '';
}

/**
 * Traverses up from the toolbar to find X's rich editor textbox.
 */
export function findEditor(toolbar: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = toolbar;
  while (current && current !== document.body) {
    const textbox = current.querySelector('[role="textbox"], .public-DraftEditor-content, [data-testid="tweetTextarea_0"]');
    if (textbox instanceof HTMLElement) {
      return textbox;
    }
    current = current.parentElement;
  }
  return null;
}

/**
 * Programmatically inserts text into X's rich Draft.js editor.
 */
export function insertTextIntoEditor(editor: HTMLElement, text: string): void {
  editor.focus();

  try {
    // Primary method: Dispatch a Clipboard Event (paste)
    // Draft.js intercepts this event, calls preventDefault(), and updates the state once.
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dt,
      bubbles: true,
      cancelable: true
    });
    
    const dispatched = editor.dispatchEvent(pasteEvent);
    if (!dispatched) {
      console.log('Successfully inserted text via clipboard paste event.');
      return;
    }
  } catch (err) {
    console.warn('Clipboard paste event failed, attempting fallback execCommand:', err);
  }

  // Fallback method: execCommand
  try {
    document.execCommand('insertText', false, text);
    console.log('Successfully inserted text via fallback execCommand.');
  } catch (err) {
    console.error('Fallback execCommand failed:', err);
  }
}

/**
 * Locates X's toolbars with robust selectors and fallback logic.
 */
export function findToolbars(): HTMLElement[] {
  const list: HTMLElement[] = [];

  // Selector 1: Standard data-testid toolbar
  const directToolbars = document.querySelectorAll('div[data-testid="toolBar"], div[data-testid="toolbar"]');
  directToolbars.forEach((el) => {
    if (el instanceof HTMLElement) {
      list.push(el);
    }
  });

  // Selector 2: Fallback via Emoji button parent container
  const emojiButtons = document.querySelectorAll('[data-testid="emojiButton"], [aria-label="Emoji"], [aria-label="Add GIF"]');
  emojiButtons.forEach((btn) => {
    const parent = btn.parentElement;
    if (parent instanceof HTMLElement && !list.includes(parent)) {
      list.push(parent);
    }
  });

  return list;
}
