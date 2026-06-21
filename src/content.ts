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
  container.style.display = 'inline-flex';
  container.style.alignItems = 'center';

  // Attach Shadow DOM
  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Styles for the button inside Shadow DOM
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
  `;

  // Create button
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ai-btn';
  button.title = 'Generate AI Reply';
  button.innerHTML = AI_ICON_SVG;

  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleAIClick(toolbar);
  });

  shadowRoot.appendChild(style);
  shadowRoot.appendChild(button);

  // Insert the button in X's toolbar.
  // The toolbar usually has the "Post" button at the far right, and action icons on the left.
  // We can insert our button before the first element, or at a specific offset.
  if (toolbar.firstChild) {
    toolbar.insertBefore(container, toolbar.firstChild);
  } else {
    toolbar.appendChild(container);
  }
}

// Temporary action handler for button clicks
function handleAIClick(toolbar: HTMLElement) {
  console.log('AI Reply clicked on toolbar:', toolbar);
}

// Set up MutationObserver to detect reply box toolbars dynamically
function observeDOM() {
  const observer = new MutationObserver(() => {
    // Find all toolbar elements
    const toolbars = document.querySelectorAll('div[data-testid="toolBar"]');
    toolbars.forEach((el) => {
      if (el instanceof HTMLElement) {
        injectAIButton(el);
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial check
  const toolbars = document.querySelectorAll('div[data-testid="toolBar"]');
  toolbars.forEach((el) => {
    if (el instanceof HTMLElement) {
      injectAIButton(el);
    }
  });
}

// Initialize observer
observeDOM();
