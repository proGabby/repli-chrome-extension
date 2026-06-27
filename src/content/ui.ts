// UI Components for X AI Reply content script
import { extractTweetText, findEditor, insertTextIntoEditor } from './dom';
import { AI_ICON_SVG, SHADOW_DOM_CSS } from './uiStyles';

const injectedToolbars = new WeakSet<HTMLElement>();

/**
 * Injects the AI Reply button and dropdown component into X's toolbar.
 */
export function injectAIButton(toolbar: HTMLElement): void {
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
  style.textContent = SHADOW_DOM_CSS;

  // Create button
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ai-btn';
  button.title = 'Generate AI Reply with Repli';
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

/**
 * Handles the AI action click: extracts context, triggers the loading state,
 * and calls background scripts to query Gemini.
 */
function handleAIClick(toolbar: HTMLElement, dropdown: HTMLDivElement, customInstructions?: string): void {
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
      { action: 'generate_replies', tweetText, tone, customInstructions },
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
                Gemini API Key not set. Please click the Repli extension icon in your Chrome toolbar to set it up.
              </div>
            `;
          } else {
            dropdown.innerHTML = `<div class="error-msg">Error: ${errorMsg}</div>`;
          }
        }

        // Render custom refinement prompt form at the bottom
        renderCustomInputForm(toolbar, dropdown, customInstructions);
      }
    );
  });
}

function renderCustomInputForm(toolbar: HTMLElement, dropdown: HTMLDivElement, currentPromptValue: string = '') {
  const form = document.createElement('form');
  form.className = 'custom-input-form';
  form.innerHTML = `
    <input type="text" class="custom-input" placeholder="Refine (e.g. 'more witty')..." value="${currentPromptValue}" />
    <button type="submit" class="custom-submit-btn" title="Regenerate">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M2.5 12c0-5.247 4.253-9.5 9.5-9.5s9.5 4.253 9.5 9.5-4.253 9.5-9.5 9.5-9.5-4.253-9.5-9.5zm9.5-7.5c-4.136 0-7.5 3.364-7.5 7.5s3.364 7.5 7.5 7.5 7.5-3.364 7.5-7.5-3.364-7.5-7.5-7.5zm.5 10v-3h3v-2h-3v-3h-2v3h-3v2h3v3h2z"/>
      </svg>
    </button>
  `;

  // Prevent event propagation so clicking inside input doesn't close dropdown
  form.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const input = form.querySelector('.custom-input') as HTMLInputElement;
    const customInstructions = input.value.trim();
    if (customInstructions) {
      handleAIClick(toolbar, dropdown, customInstructions);
    }
  });

  dropdown.appendChild(form);
}
