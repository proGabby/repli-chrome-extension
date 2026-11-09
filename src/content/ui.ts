// UI Components for Repli content script (X and LinkedIn)
import { extractContextText, findEditor, insertTextIntoEditor, getCurrentPlatform, Platform } from './dom';
import { AI_ICON_SVG, getShadowDomCss } from './uiStyles';

// Global Overlay State (Mounted directly onto document.body to prevent parent overflow:hidden clipping)
let globalOverlayHost: HTMLElement | null = null;
let globalOverlayShadow: ShadowRoot | null = null;
let globalDropdown: HTMLDivElement | null = null;
let activeTriggerButton: HTMLElement | null = null;

/**
 * Ensures the global overlay host on document.body is ready.
 */
function getOrCreateGlobalOverlay(): { dropdown: HTMLDivElement; shadowRoot: ShadowRoot } {
  if (globalOverlayHost && globalOverlayShadow && globalDropdown) {
    return { dropdown: globalDropdown, shadowRoot: globalOverlayShadow };
  }

  // Create isolated container attached directly to document.body
  globalOverlayHost = document.createElement('div');
  globalOverlayHost.id = 'repli-global-overlay-host';
  globalOverlayHost.style.position = 'fixed';
  globalOverlayHost.style.top = '0';
  globalOverlayHost.style.left = '0';
  globalOverlayHost.style.width = '100vw';
  globalOverlayHost.style.height = '100vh';
  globalOverlayHost.style.pointerEvents = 'none'; // Background allows clicks to pass through
  globalOverlayHost.style.zIndex = '2147483647'; // Maximum possible z-index

  globalOverlayShadow = globalOverlayHost.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.id = 'repli-overlay-style';
  style.textContent = getShadowDomCss('x');

  globalDropdown = document.createElement('div');
  globalDropdown.className = 'dropdown';
  globalDropdown.style.pointerEvents = 'auto'; // Re-enable pointer events inside dropdown

  globalOverlayShadow.appendChild(style);
  globalOverlayShadow.appendChild(globalDropdown);
  document.body.appendChild(globalOverlayHost);

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!globalDropdown?.classList.contains('show')) return;
    const path = e.composedPath();

    if (activeTriggerButton && path.includes(activeTriggerButton)) {
      return; // Handled by trigger button click
    }
    if (globalDropdown && path.includes(globalDropdown)) {
      return; // Clicks inside dropdown itself
    }
    hideGlobalDropdown();
  });

  // Dynamically reposition overlay on window scroll or resize
  window.addEventListener('scroll', () => {
    if (globalDropdown?.classList.contains('show') && activeTriggerButton) {
      positionDropdown(activeTriggerButton, globalDropdown);
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (globalDropdown?.classList.contains('show') && activeTriggerButton) {
      positionDropdown(activeTriggerButton, globalDropdown);
    }
  }, { passive: true });

  return { dropdown: globalDropdown, shadowRoot: globalOverlayShadow };
}

/**
 * Computes exact viewport positioning for the dropdown relative to the trigger button.
 */
function positionDropdown(button: HTMLElement, dropdown: HTMLDivElement): void {
  const rect = button.getBoundingClientRect();
  const dropdownWidth = 290;
  const preferredHeight = 240;

  // Horizontal position (aligned with button, clamped to screen margins)
  let left = rect.left + rect.width / 2 - dropdownWidth / 2;
  if (left + dropdownWidth > window.innerWidth - 12) {
    left = window.innerWidth - dropdownWidth - 12;
  }
  if (left < 12) {
    left = 12;
  }

  dropdown.style.left = `${left}px`;
  dropdown.style.right = 'auto';

  // Vertical position:
  // Prefer opening ABOVE the button if space allows, otherwise open BELOW
  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;

  if (spaceAbove >= preferredHeight || spaceAbove > spaceBelow) {
    // Open upwards (above the button)
    dropdown.style.bottom = `${window.innerHeight - rect.top + 8}px`;
    dropdown.style.top = 'auto';
  } else {
    // Open downwards (below the button)
    dropdown.style.top = `${rect.bottom + 8}px`;
    dropdown.style.bottom = 'auto';
  }
}

/**
 * Closes the active global dropdown.
 */
function hideGlobalDropdown(): void {
  if (globalDropdown) {
    globalDropdown.classList.remove('show');
  }
  activeTriggerButton = null;
}

/**
 * Injects the AI Reply/Comment button into the platform's toolbar.
 */
export function injectAIButton(target: HTMLElement, platform: Platform = getCurrentPlatform()): void {
  // Guard 1: Direct element already processed
  if (target.dataset.repliInjected === 'true') return;

  // Guard 2: Enclosing comment container already has a Repli button (strictly 1 button per comment box)
  const enclosingBox = target.closest('form, [class*="comment"], article, .feed-shared-update-v2');
  if (enclosingBox && enclosingBox.querySelector('.repli-btn-container')) {
    target.dataset.repliInjected = 'true';
    return;
  }

  // Guard 3: Immediate sibling already has button
  const isButton = target.tagName.toLowerCase() === 'button';
  if (isButton) {
    if (
      target.nextElementSibling?.classList.contains('repli-btn-container') ||
      target.previousElementSibling?.classList.contains('repli-btn-container')
    ) {
      target.dataset.repliInjected = 'true';
      return;
    }
  } else {
    if (target.querySelector('.repli-btn-container')) {
      target.dataset.repliInjected = 'true';
      return;
    }
  }

  target.dataset.repliInjected = 'true';

  // Create button container for Shadow DOM
  const container = document.createElement('div');
  container.className = `repli-btn-container repli-${platform}`;
  container.style.position = 'relative';
  container.style.display = 'inline-flex';
  container.style.alignItems = 'center';
  container.style.verticalAlign = 'middle';
  container.style.flexShrink = '0';
  container.style.lineHeight = '0';
  container.style.margin = '0 2px';

  // Attach Shadow DOM for the button
  const shadowRoot = container.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = getShadowDomCss(platform);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ai-btn';
  button.title = platform === 'linkedin' ? 'Generate AI Comment with Repli' : 'Generate AI Reply with Repli';
  button.innerHTML = AI_ICON_SVG;

  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const { dropdown, shadowRoot: overlayShadow } = getOrCreateGlobalOverlay();

    // Update overlay styles for this platform
    const overlayStyle = overlayShadow.querySelector<HTMLStyleElement>('#repli-overlay-style');
    if (overlayStyle) {
      overlayStyle.textContent = getShadowDomCss(platform);
    }

    const isCurrentOpen = dropdown.classList.contains('show') && activeTriggerButton === button;

    if (isCurrentOpen) {
      hideGlobalDropdown();
    } else {
      activeTriggerButton = button;
      positionDropdown(button, dropdown);
      dropdown.classList.add('show');
      handleAIClick(target, dropdown, platform);
    }
  });

  shadowRoot.appendChild(style);
  shadowRoot.appendChild(button);

  // Placement logic is platform-specific:
  if (platform === 'x') {
    // On X (Twitter): Place cleanly as the FIRST item in X's toolbar row
    const toolbar = (target.getAttribute('data-testid') === 'toolBar' || target.getAttribute('data-testid') === 'toolbar')
      ? target
      : (target.closest('div[data-testid="toolBar"], div[data-testid="toolbar"]') || target);

    if (toolbar.firstChild) {
      toolbar.insertBefore(container, toolbar.firstChild);
    } else {
      toolbar.appendChild(container);
    }
    console.log('[Repli] Injected Spark button at start of X toolbar row.');
  } else {
    // On LinkedIn: Place directly adjacent to the native emoji icon in the comment box
    if (isButton) {
      target.insertAdjacentElement('afterend', container);
      console.log('[Repli] Injected Spark button directly after LinkedIn emoji button.');
    } else {
      const emojiBtn = target.querySelector<HTMLElement>(
        'button.comments-comment-box__emoji-picker-trigger, ' +
        'button[aria-label*="emoji" i], ' +
        'button[aria-label*="smile" i]'
      );
      if (emojiBtn) {
        emojiBtn.insertAdjacentElement('afterend', container);
        console.log('[Repli] Injected Spark button next to LinkedIn emoji button.');
      } else if (target.firstChild) {
        target.insertBefore(container, target.firstChild);
      } else {
        target.appendChild(container);
      }
    }
  }
}

/**
 * Handles the AI action click: extracts context, triggers the loading state,
 * and calls background scripts to query Gemini.
 */
function handleAIClick(target: HTMLElement, dropdown: HTMLDivElement, platform: Platform): void {
  console.log(`[Repli] AI Button clicked on ${platform}. Locating context...`);
  const contextElement = (target && target.isConnected) ? target : (activeTriggerButton || target);
  const contextText = extractContextText(contextElement, platform);
  console.log(`[Repli] Extracted ${platform} context:`, contextText);

  if (!contextText) {
    const fallbackMessage = platform === 'linkedin' 
      ? 'Could not extract LinkedIn post context.' 
      : 'Could not extract tweet text context.';
    dropdown.innerHTML = `<div class="error-msg">${fallbackMessage}</div>`;
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
    const tone = settings.x_ai_reply_default_tone || (platform === 'linkedin' ? 'professional' : 'supportive');
    console.log(`[Repli] Querying background worker for tone: ${tone}, platform: ${platform}`);

    chrome.runtime.sendMessage(
      { action: 'generate_replies', tweetText: contextText, tone, platform },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Repli] Runtime message error:', chrome.runtime.lastError);
          dropdown.innerHTML = `<div class="error-msg">Connection error. Please reload the page and try again.</div>`;
          return;
        }

        console.log('[Repli] Received response from background script:', response);

        if (response && response.success && Array.isArray(response.replies)) {
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

              const editor = findEditor(target, platform);
              if (editor) {
                console.log(`[Repli] Inserting text into ${platform} editor...`);
                insertTextIntoEditor(editor, replyText, platform);
                hideGlobalDropdown();
              } else {
                console.warn(`[Repli] Active editor not found on ${platform}.`);
                const alertMsg = platform === 'linkedin'
                  ? 'Could not find active comment textbox. Please click inside the comment box first.'
                  : 'Could not find active reply textbox. Please click inside X\'s reply box first.';
                alert(alertMsg);
              }
            });

            optionsContainer.appendChild(optionBtn);
          });

          dropdown.appendChild(optionsContainer);
        } else {
          const errorMsg = response?.error || 'Unknown error occurred.';
          console.error('[Repli] AI reply generation failed:', errorMsg);

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
      }
    );
  });
}
