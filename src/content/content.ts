// Repli Multi-Platform Content Script Entry Point (X/Twitter & LinkedIn)
import { getCurrentPlatform, findToolbars } from './dom';
import { injectAIButton } from './ui';

function observeDOM() {
  const platform = getCurrentPlatform();
  const platformName = platform === 'linkedin' ? 'LinkedIn' : 'X (Twitter)';
  console.log(`[Repli] Extension active on ${platformName}. Starting observer...`);

  function scanAndInject() {
    const targets = findToolbars(platform);
    if (targets.length > 0) {
      targets.forEach((el) => injectAIButton(el, platform));
    }
  }

  // 1. MutationObserver watching DOM mutations and attribute changes
  const observer = new MutationObserver(() => {
    scanAndInject();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'aria-expanded'],
  });

  // 2. Global event listeners for immediate responsiveness when user opens/clicks comment boxes
  document.addEventListener('click', () => {
    setTimeout(scanAndInject, 50);
    setTimeout(scanAndInject, 200);
    setTimeout(scanAndInject, 500);
  }, { passive: true });

  document.addEventListener('focusin', () => {
    setTimeout(scanAndInject, 50);
    setTimeout(scanAndInject, 200);
    setTimeout(scanAndInject, 500);
  }, { passive: true });

  // 3. Fallback interval so dynamic lazy-loaded feed elements are never missed
  setInterval(scanAndInject, 1000);

  // 4. Initial scan
  scanAndInject();
}

// Initialize observer
observeDOM();
