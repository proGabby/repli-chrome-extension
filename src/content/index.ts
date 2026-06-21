// X AI Reply Content Script Entry Point
import { findToolbars } from './dom';
import { injectAIButton } from './ui';

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
