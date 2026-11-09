// DOM Utilities for Repli content script (supporting X/Twitter and LinkedIn)

export type Platform = 'x' | 'linkedin';

/**
 * Determines the current platform based on the page hostname.
 */
export function getCurrentPlatform(): Platform {
  if (window.location.hostname.includes('linkedin.com')) {
    return 'linkedin';
  }
  return 'x';
}

/**
 * Extracts the text content of the post or tweet being replied to.
 */
export function extractContextText(toolbar: HTMLElement, platform: Platform = getCurrentPlatform()): string {
  if (platform === 'linkedin') {
    return extractLinkedInPostText(toolbar);
  }
  return extractTwitterTweetText(toolbar);
}

// Backwards-compatible alias
export const extractTweetText = extractContextText;

/**
 * Extracts context from a Twitter/X post.
 */
function extractTwitterTweetText(toolbar: HTMLElement): string {
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
 * Cleans extracted text by stripping "...more" and excessive formatting.
 */
function cleanExtractedText(text: string): string {
  return text
    .replace(/(\.\.\.|…)\s*more\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts visible post content, caption paragraphs, or media descriptions from any element.
 */
function extractTextFromPostElement(container: HTMLElement): string {
  const extractedParts: string[] = [];

  // 1. Primary post commentary / caption paragraphs (Universal across LinkedIn)
  const textSelectors = [
    '.attributed-text-segment-list__content',
    '.update-components-text',
    '.feed-shared-update-v2__commentary',
    '.feed-shared-inline-show-more-text',
    '.feed-shared-update-v2__description',
    '.feed-shared-text',
    'span[dir="ltr"]',
    'span.break-words',
    'div[data-ad-preview="message"]',
    '[class*="update-components-text"]',
    '[class*="commentary"]',
  ];

  for (const selector of textSelectors) {
    const matches = container.querySelectorAll<HTMLElement>(selector);
    for (const el of Array.from(matches)) {
      // Skip if inside comment box
      if (el.closest('form, [class*="comment-box"], [class*="comment__form"]')) continue;
      
      const raw = (el.textContent || '').trim();
      const cleaned = cleanExtractedText(raw);
      if (cleaned.length > 15 && !extractedParts.includes(cleaned)) {
        extractedParts.push(cleaned);
        break;
      }
    }
    if (extractedParts.length > 0) break;
  }

  // 2. Article & Headline titles (Useful for link cards, sponsored cards, etc.)
  const headlineSelectors = [
    '.feed-shared-article__title',
    '.update-components-article__title',
    '.update-components-header',
    '[class*="article__title"]',
    '[class*="headline"]',
    'h2, h3, h4',
  ];

  for (const selector of headlineSelectors) {
    const el = container.querySelector<HTMLElement>(selector);
    if (el && !el.closest('form, [class*="comment"]')) {
      const cleaned = cleanExtractedText(el.textContent || '');
      if (cleaned.length > 10 && !extractedParts.includes(cleaned)) {
        extractedParts.push(cleaned);
        break;
      }
    }
  }

  // 3. Descriptive image alt text (Crucial for infographic / media cards like ByteByteGo / ads)
  const images = container.querySelectorAll<HTMLImageElement>('img[alt]');
  images.forEach((img) => {
    if (img.closest('form, [class*="comment"]')) return;
    const alt = (img.getAttribute('alt') || '').trim();
    if (
      alt.length > 15 &&
      !alt.toLowerCase().includes('profile') &&
      !alt.toLowerCase().includes('avatar') &&
      !alt.toLowerCase().includes('logo') &&
      !extractedParts.includes(alt)
    ) {
      extractedParts.push(`[Media: ${alt}]`);
    }
  });

  if (extractedParts.length > 0) {
    return extractedParts.join('\n\n').trim();
  }

  // 4. Fallback: Clone container, strip comments and interactive counters, and extract innerText
  try {
    const clone = container.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(
      'form, [class*="comment"], [class*="social-details"], [class*="social-actions"], [class*="actor__meta"], button'
    ).forEach((el) => el.remove());

    const fallback = (clone.innerText || clone.textContent || '').trim();
    // Filter out short noise lines
    const meaningfulLines = fallback
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 20 && !l.match(/^\d+[\s\d]*$/));

    if (meaningfulLines.length > 0) {
      return meaningfulLines.join('\n\n').trim();
    }
  } catch (err) {
    console.warn('[Repli] Fallback clone extraction failed:', err);
  }

  return '';
}

/**
 * Extracts context from a LinkedIn post or comment.
 */
function extractLinkedInPostText(startEl: HTMLElement): string {
  console.log('[Repli] Starting LinkedIn context extraction from:', startEl);

  // Strategy 1: Check if replying to an existing comment
  const commentItem = startEl.closest(
    '.comments-comment-item, .comments-comments-list__comment-item, .comments-reply-item, .feed-shared-main-content--comment, [class*="comment-item"]'
  );
  if (commentItem) {
    const commentBody = commentItem.querySelector(
      '.comments-comment-item-content-body, .comments-comment-item__main-content, .feed-shared-main-content--comment, [class*="comment-item-content"], span.break-words'
    );
    if (commentBody && commentBody.textContent && commentBody.textContent.trim().length > 5) {
      const text = cleanExtractedText(commentBody.textContent);
      console.log('[Repli] Found comment reply context:', text);
      return text;
    }
  }

  // Find the comment box wrapper
  const commentBox = startEl.closest('form, [class*="comment-box"], [class*="comment__form"], [class*="comment"]') || startEl;

  // Strategy 2: Upward sibling traversal
  // In LinkedIn's layout, post text, media, and headers ALWAYS sit in previous siblings above the comment box!
  let current: HTMLElement | null = commentBox as HTMLElement;
  while (current && current !== document.body) {
    let sibling = current.previousElementSibling;
    while (sibling) {
      const text = extractTextFromPostElement(sibling as HTMLElement);
      if (text && text.length > 15) {
        console.log('[Repli] Found post context via upward sibling traversal:', text);
        return text;
      }
      sibling = sibling.previousElementSibling;
    }
    current = current.parentElement;
  }

  // Strategy 3: Enclosing post container (starting strictly OUTSIDE the comment box)
  const searchStart = (commentBox.parentElement || startEl) as HTMLElement;
  const postCard = searchStart.closest<HTMLElement>(
    '.feed-shared-update-v2, ' +
    'div[data-view-name="feed-full-update"], ' +
    '.occludable-update, ' +
    'article, ' +
    '[role="article"], ' +
    '[class*="feed-shared-update"]'
  ) || searchStart.closest<HTMLElement>('[data-urn*="activity"], [data-urn*="sponsored"]');

  if (postCard) {
    const text = extractTextFromPostElement(postCard);
    if (text && text.length > 0) {
      console.log('[Repli] Found post context via post card:', text);
      return text;
    }
  }

  // Strategy 4: Find any parent that contains the element and extract
  let ancestor: HTMLElement | null = searchStart;
  while (ancestor && ancestor !== document.body) {
    // If ancestor has an actor/header or commentary
    if (ancestor.querySelector('[class*="actor"], [class*="header"], [class*="commentary"], [class*="update-components"]')) {
      const text = extractTextFromPostElement(ancestor);
      if (text && text.length > 15) {
        console.log('[Repli] Found post context via ancestor crawl:', text);
        return text;
      }
    }
    ancestor = ancestor.parentElement;
  }

  console.warn('[Repli] Could not find any LinkedIn post context.');
  return '';
}

/**
 * Traverses up from the toolbar to find the rich editor textbox.
 */
export function findEditor(toolbar: HTMLElement, platform: Platform = getCurrentPlatform()): HTMLElement | null {
  if (platform === 'linkedin') {
    return findLinkedInEditor(toolbar);
  }
  return findTwitterEditor(toolbar);
}

function findTwitterEditor(toolbar: HTMLElement): HTMLElement | null {
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

function findLinkedInEditor(toolbar: HTMLElement): HTMLElement | null {
  // 1. Check parent form or comment box
  const form = toolbar.closest(
    'form, [class*="comment"], article, .feed-shared-update-v2, .comments-comment-item'
  );
  if (form) {
    const editor = form.querySelector(
      'div[role="textbox"][contenteditable="true"], .ql-editor[contenteditable="true"], .ql-editor, div[contenteditable="true"], div[data-placeholder]'
    );
    if (editor instanceof HTMLElement) {
      return editor;
    }
  }

  // 2. Traversal fallback
  let current: HTMLElement | null = toolbar;
  while (current && current !== document.body) {
    const textbox = current.querySelector('.ql-editor, [role="textbox"][contenteditable="true"]');
    if (textbox instanceof HTMLElement) {
      return textbox;
    }
    current = current.parentElement;
  }

  // 3. Global active editor fallback
  const focused = document.activeElement;
  if (focused && focused.getAttribute('contenteditable') === 'true' && focused instanceof HTMLElement) {
    return focused;
  }

  return null;
}

/**
 * Programmatically inserts text into the rich editor across platforms.
 */
export function insertTextIntoEditor(editor: HTMLElement, text: string, platform: Platform = getCurrentPlatform()): void {
  editor.focus();

  if (platform === 'linkedin') {
    insertTextIntoLinkedInEditor(editor, text);
    return;
  }

  insertTextIntoTwitterEditor(editor, text);
}

function insertTextIntoLinkedInEditor(editor: HTMLElement, text: string): void {
  // Step 1: Attempt standard execCommand which Quill natively supports
  try {
    const success = document.execCommand('insertText', false, text);
    if (success) {
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }));
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      editor.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('[Repli] Successfully inserted text via execCommand into LinkedIn editor.');
      return;
    }
  } catch (err) {
    console.warn('[Repli] execCommand failed on LinkedIn editor, trying Quill DOM fallback:', err);
  }

  // Step 2: Quill paragraph DOM fallback
  try {
    editor.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = text;
    editor.appendChild(p);

    editor.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }));
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    editor.dispatchEvent(new Event('change', { bubbles: true }));
    editor.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    console.log('[Repli] Successfully inserted text via Quill DOM fallback into LinkedIn editor.');
  } catch (err) {
    console.error('[Repli] LinkedIn editor text insertion failed:', err);
  }
}

function insertTextIntoTwitterEditor(editor: HTMLElement, text: string): void {
  try {
    // Primary method: Dispatch a Clipboard Event (paste)
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dt,
      bubbles: true,
      cancelable: true,
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
 * Locates reply/comment toolbars with platform-specific selectors.
 */
export function findToolbars(platform: Platform = getCurrentPlatform()): HTMLElement[] {
  if (platform === 'linkedin') {
    return findLinkedInToolbars();
  }
  return findTwitterToolbars();
}

function findTwitterToolbars(): HTMLElement[] {
  const list: HTMLElement[] = [];

  // Target X's primary reply action toolbar row
  const directToolbars = document.querySelectorAll<HTMLElement>(
    'div[data-testid="toolBar"], div[data-testid="toolbar"]'
  );
  directToolbars.forEach((el) => {
    if (!list.includes(el)) {
      list.push(el);
    }
  });

  // Fallback only if no direct toolbar is detected
  if (list.length === 0) {
    const emojiButtons = document.querySelectorAll<HTMLElement>(
      '[data-testid="emojiButton"], [aria-label="Emoji"]'
    );
    emojiButtons.forEach((btn) => {
      const parent = btn.closest<HTMLElement>('nav, div[role="group"]') || btn.parentElement;
      if (parent && !list.includes(parent)) {
        list.push(parent);
      }
    });
  }

  return list;
}

/**
 * Locates LinkedIn comment toolbars and emoji buttons (strictly 1 target per comment box).
 */
function findLinkedInToolbars(): HTMLElement[] {
  const list: HTMLElement[] = [];
  const handledBoxes = new Set<Element>();

  // Priority 1: Locate native LinkedIn Emoji buttons directly
  const emojiSelectors = [
    'button.comments-comment-box__emoji-picker-trigger',
    'button[aria-label*="emoji" i]',
    'button[aria-label*="smile" i]',
    'button[aria-label*="sticker" i]',
    'button[title*="emoji" i]',
    'button[title*="smile" i]',
    'button[data-test-emoji-picker-trigger]',
    'button[data-control-name*="emoji" i]',
    '[role="button"][aria-label*="emoji" i]',
    '[role="button"][aria-label*="smile" i]',
    'button[class*="emoji" i]',
  ];

  emojiSelectors.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((btn) => {
      const box = btn.closest('form, [class*="comment"], article, .feed-shared-update-v2') || btn.parentElement;
      if (box) {
        if (handledBoxes.has(box)) return;
        handledBoxes.add(box);
      }
      if (!list.includes(btn)) {
        list.push(btn);
      }
    });
  });

  // Priority 2: Fallback for comment editors whose box didn't have an emoji button caught
  const editors = document.querySelectorAll<HTMLElement>(
    'div[role="textbox"][contenteditable="true"], ' +
    'div[contenteditable="true"][data-placeholder*="comment" i], ' +
    'div[contenteditable="true"][aria-label*="comment" i], ' +
    'div[contenteditable="true"][aria-label*="Add a comment" i], ' +
    '.ql-editor[contenteditable="true"], ' +
    '.comments-comment-box-comment__text-editor'
  );

  editors.forEach((editor) => {
    const box = editor.closest<HTMLElement>(
      'form, [class*="comment-box"], [class*="comment__form"], [class*="comment-texteditor"], [class*="comment"], article, .feed-shared-update-v2'
    ) || editor.parentElement;

    if (!box) return;
    if (handledBoxes.has(box)) return; // Already handled by Priority 1!

    // Check if Repli button already exists in this box
    if (box.querySelector('.repli-btn-container')) {
      handledBoxes.add(box);
      return;
    }

    // Look for utility/actions container
    const utilContainer = box.querySelector<HTMLElement>(
      '[class*="utils"], [class*="footer"], [class*="actions"], [class*="toolbar"], [class*="controls"], [class*="tools"]'
    );
    if (utilContainer) {
      handledBoxes.add(box);
      list.push(utilContainer);
      return;
    }

    // Look for buttons (excluding submit button)
    const buttons = box.querySelectorAll<HTMLElement>('button');
    for (const btn of Array.from(buttons)) {
      const text = (btn.textContent || '').trim().toLowerCase();
      const isSubmit = (btn instanceof HTMLButtonElement && btn.type === 'submit') || btn.getAttribute('type') === 'submit';
      if (!isSubmit && text !== 'post' && text !== 'comment' && !btn.classList.contains('artdeco-button--primary')) {
        handledBoxes.add(box);
        list.push(btn);
        return;
      }
    }
  });

  return list;
}
