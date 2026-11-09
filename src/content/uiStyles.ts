// Styles and SVG constants for Repli UI components (X and LinkedIn)

export const AI_ICON_SVG = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="display: block;">
  <path d="M12 3a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1zm5.657 2.343a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0zM19 12a1 1 0 0 1-1 1h-2a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1zm-3.343 5.657a1 1 0 0 1-1.414 0l-1.414-1.414a1 1 0 1 1 1.414-1.414l1.414 1.414a1 1 0 0 1 0 1.414zM12 19a1 1 0 0 1-1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zm-5.657-2.343a1 1 0 0 1 0-1.414l1.414-1.414a1 1 0 1 1 1.414 1.414l-1.414 1.414a1 1 0 0 1-1.414 0zM5 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1zm2.343-5.657a1 1 0 0 1 1.414 0l1.414 1.414a1 1 0 1 1-1.414 1.414L7.343 7.757a1 1 0 0 1 0-1.414zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
</svg>
`;

export function getShadowDomCss(platform: 'x' | 'linkedin' = 'x'): string {
  const isLinkedIn = platform === 'linkedin';
  const primaryColor = isLinkedIn ? 'rgb(10, 102, 194)' : 'rgb(29, 155, 240)';
  const bg = isLinkedIn ? 'rgba(10, 102, 194, 0.08)' : 'none';
  const border = isLinkedIn ? '1px solid rgba(10, 102, 194, 0.35)' : 'none';
  const hoverBg = isLinkedIn ? 'rgba(10, 102, 194, 0.2)' : 'rgba(29, 155, 240, 0.1)';
  const size = isLinkedIn ? '32px' : '34px';
  const spinnerTrack = isLinkedIn ? 'rgba(10, 102, 194, 0.2)' : 'rgba(29, 155, 240, 0.2)';

  return `
  :host {
    display: inline-flex;
    vertical-align: middle;
    flex-shrink: 0;
  }

  .ai-btn {
    background: ${bg};
    border: ${border};
    padding: 0;
    margin: 0 ${isLinkedIn ? '2px' : '4px'};
    width: ${size};
    height: ${size};
    min-width: ${size};
    min-height: ${size};
    border-radius: 50%;
    color: ${primaryColor};
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s, transform 0.1s;
    box-sizing: border-box;
  }
  .ai-btn:hover {
    background-color: ${hoverBg};
    ${isLinkedIn ? `border-color: ${primaryColor};` : ''}
    transform: scale(1.05);
  }
  .ai-btn:active {
    transform: scale(0.95);
  }

  /* Fixed Dropdown Overlay (immune to parent overflow: hidden) */
  .dropdown {
    position: fixed;
    background-color: #15181c;
    border: 1px solid #2f3336;
    border-radius: 12px;
    width: 290px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.7);
    z-index: 2147483647;
    display: none;
    flex-direction: column;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
    border: 2px solid ${spinnerTrack};
    border-top-color: ${primaryColor};
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
    max-height: 320px;
    overflow-y: auto;
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
    line-height: 1.4;
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
    color: ${primaryColor};
    text-decoration: none;
  }
  .error-msg a:hover {
    text-decoration: underline;
  }
`;
}

// Fallback constant for backwards compatibility
export const SHADOW_DOM_CSS = getShadowDomCss('x');
