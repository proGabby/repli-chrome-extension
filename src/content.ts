// X AI Reply Content Script

// Keep track of toolbars we have already injected our button into
const injectedToolbars = new WeakSet<HTMLElement>();

// Magic wand icon SVG path
const AI_ICON_SVG = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="display: block;">
  <path d="M12 3a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1zm5.657 2.343a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0zM19 12a1 1 0 0 1-1 1h-2a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1zm-3.343 5.657a1 1 0 0 1-1.414 0l-1.414-1.414a1 1 0 1 1 1.414-1.414l1.414 1.414a1 1 0 0 1 0 1.414zM12 19a1 1 0 0 1-1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zm-5.657-2.343a1 1 0 0 1 0-1.414l1.414-1.414a1 1 0 1 1 1.414 1.414l-1.414 1.414a1 1 0 0 1-1.414 0zM5 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1zm2.343-5.657a1 1 0 0 1 1.414 0l1.414 1.414a1 1 0 1 1-1.414 1.414L7.343 7.757a1 1 0 0 1 0-1.414zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
</svg>
`;

// Helper to inject the AI Reply button
function injectAIButton(toolbar: HTMLElement) {
  if (injectedToolbars.has(toolbar)) return;
  injectedToolbars.add(toolbar);

  // Create container for the Shadow DOM
  const container = document.createElement('div');
  container.className = 'x-ai-reply-btn-container';
  container.style.position = 'relative';
  container.style.display = 'inline-flex';
  container.style.alignItems = 'center';

  // Attach Shadow DOM
  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Styles for components inside Shadow DOM
  const style = document.createElement('style');
  style.textContent = `
    .ai-btn {
      background: none;
      border: none;
      padding: 0;
      margin: 0 4px;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      color: rgb(29, 155, 240); /* X primary blue */
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s, transform 0.1s;
    }
    .ai-btn:hover {
      background-color: rgba(29, 155, 240, 0.1);
    }
    .ai-btn:active {
      transform: scale(0.95);
    }

    /* Dropdown container */
    .dropdown {
      position: absolute;
      bottom: 40px;
      left: 4px;
      background-color: #15181c;
      border: 1px solid #2f3336;
      border-radius: 12px;
      width: 280px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      z-index: 99999;
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .dropdown.show {
      display: flex;
    }

    /* Dropdown Loader */
    .loader {
      padding: 16px;
      color: #71767b;
      font-size: 0.85rem;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(29, 155, 240, 0.2);
      border-top-color: rgb(29, 155, 240);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Dropdown options */
    .options {
      display: flex;
      flex-direction: column;
    }
    .option {
      padding: 12px 16px;
      color: #f7f9f9;
      font-size: 0.875rem;
      text-align: left;
      background: none;
      border: none;
      border-bottom: 1px solid #2f3336;
      cursor: pointer;
      transition: background-color 0.2s;
      line-height: 1.35;
    }
    .option:last-child {
      border-bottom: none;
    }
    .option:hover {
      background-color: #1e2226;
    }

    /* Error Message */
    .error-msg {
      padding: 14px;
      color: #f4212e;
      font-size: 0.8rem;
      text-align: center;
      line-height: 1.4;
    }
    .error-msg a {
      color: rgb(29, 155, 240);
      text-decoration: none;
    }
    .error-msg a:hover {
      text-decoration: underline;
    }
  `;

  // Create button
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ai-btn';
  button.title = 'Generate AI Reply';
  button.innerHTML = AI_ICON_SVG;

  // Create dropdown element
  const dropdown = document.createElement('div');
  dropdown.className = 'dropdown';

  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle dropdown visibility
    const isShowing = dropdown.classList.contains('show');
    
    // Close other open dropdowns first
    document.querySelectorAll('.x-ai-reply-btn-container').forEach((el) => {
      el.shadowRoot?.querySelector('.dropdown')?.classList.remove('show');
    });

    if (!isShowing) {
      dropdown.classList.add('show');
      handleAIClick(toolbar, dropdown);
    }
  });

  // Close dropdown on click outside
  document.addEventListener('click', () => {
    dropdown.classList.remove('show');
  });

  shadowRoot.appendChild(style);
  shadowRoot.appendChild(button);
  shadowRoot.appendChild(dropdown);

  // Insert the button in X's toolbar.
  if (toolbar.firstChild) {
    toolbar.insertBefore(container, toolbar.firstChild);
  } else {
    toolbar.appendChild(container);
  }
}

// Helper to extract the text content of the tweet being replied to
function extractTweetText(toolbar: HTMLElement): string {
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

// Find X's editor textbox traversing up from the toolbar
function findEditor(toolbar: HTMLElement): HTMLElement | null {
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

// Inject selected text into X's rich editor
function insertTextIntoEditor(editor: HTMLElement, text: string) {
  editor.focus();

  // Primary insertion method for Draft.js
  try {
    const success = document.execCommand('insertText', false, text);
    if (success) return;
  } catch (err) {
    console.warn('execCommand failed:', err);
  }

  // Fallback paste injection method
  const dt = new DataTransfer();
  dt.setData('text/plain', text);
  const pasteEvent = new ClipboardEvent('paste', {
    clipboardData: dt,
    bubbles: true,
    cancelable: true
  });
  editor.dispatchEvent(pasteEvent);
}

// Helper to locate X's toolbars with robust selectors and fallback logic
function findToolbars(): HTMLElement[] {
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

// Action handler for button clicks
function handleAIClick(toolbar: HTMLElement, dropdown: HTMLDivElement) {
  console.log('AI Button clicked. Locating context...');
  const tweetText = extractTweetText(toolbar);
  console.log('Extracted Tweet Text context:', tweetText);
  
  if (!tweetText) {
    dropdown.innerHTML = `<div class="error-msg">Could not extract tweet text context.</div>`;
    return;
  }

  // Show loading spinner
  dropdown.innerHTML = `
    <div class="loader">
      <div class="spinner"></div>
      Generating options...
    </div>
  `;

  // Fetch tone settings from storage first
  chrome.storage.local.get(['x_ai_reply_default_tone'], (settings) => {
    const tone = settings.x_ai_reply_default_tone || 'supportive';
    console.log('Sending message to background script for tone:', tone);
    
    // Dispatch message to background service worker
    chrome.runtime.sendMessage(
      { action: 'generate_replies', tweetText, tone },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Runtime message error:', chrome.runtime.lastError);
          dropdown.innerHTML = `<div class="error-msg">Connection error. Please reload X.com and try again.</div>`;
          return;
        }

        console.log('Received response from background script:', response);

        if (response && response.success && Array.isArray(response.replies)) {
          // Render options list
          dropdown.innerHTML = '';
          const optionsContainer = document.createElement('div');
          optionsContainer.className = 'options';

          response.replies.forEach((replyText: string) => {
            const optionBtn = document.createElement('button');
            optionBtn.type = 'button';
            optionBtn.className = 'option';
            optionBtn.textContent = replyText;
            
            optionBtn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              
              const editor = findEditor(toolbar);
              if (editor) {
                console.log('Inserting text into editor...');
                insertTextIntoEditor(editor, replyText);
                dropdown.classList.remove('show');
              } else {
                console.warn('Active editor not found.');
                alert('Could not find active reply textbox. Please click inside X\'s reply box first.');
              }
            });

            optionsContainer.appendChild(optionBtn);
          });

          dropdown.appendChild(optionsContainer);
        } else {
          const errorMsg = response?.error || 'Unknown error occurred.';
          console.error('AI reply generation failed:', errorMsg);
          
          if (errorMsg.includes('API key')) {
            dropdown.innerHTML = `
              <div class="error-msg">
                Gemini API Key not set. Please click the X AI Reply extension icon in your Chrome toolbar to set it up.
              </div>
            `;
          } else {
            dropdown.innerHTML = `<div class="error-msg">Error: ${errorMsg}</div>`;
          }
        }
      }
    );
  });
}

// Set up MutationObserver to detect reply box toolbars dynamically
function observeDOM() {
  console.log('Setting up MutationObserver to watch X.com DOM updates...');
  
  const observer = new MutationObserver(() => {
    const toolbars = findToolbars();
    if (toolbars.length > 0) {
      toolbars.forEach((el) => injectAIButton(el));
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial check
  const toolbars = findToolbars();
  console.log(`Initial scan: found ${toolbars.length} toolbars.`);
  toolbars.forEach((el) => injectAIButton(el));
}

// Initialize observer
observeDOM();
