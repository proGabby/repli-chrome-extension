// Styles and SVG constants for the X AI Reply UI components

export const AI_ICON_SVG = `
<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="display: block;">
  <path d="M12 3a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1zm5.657 2.343a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0zM19 12a1 1 0 0 1-1 1h-2a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1zm-3.343 5.657a1 1 0 0 1-1.414 0l-1.414-1.414a1 1 0 1 1 1.414-1.414l1.414 1.414a1 1 0 0 1 0 1.414zM12 19a1 1 0 0 1-1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zm-5.657-2.343a1 1 0 0 1 0-1.414l1.414-1.414a1 1 0 1 1 1.414 1.414l-1.414 1.414a1 1 0 0 1-1.414 0zM5 12a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1zm2.343-5.657a1 1 0 0 1 1.414 0l1.414 1.414a1 1 0 1 1-1.414 1.414L7.343 7.757a1 1 0 0 1 0-1.414zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
</svg>
`;

export const SHADOW_DOM_CSS = `
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

  /* Custom Prompt Form */
  .custom-input-form {
    display: flex;
    align-items: center;
    border-top: 1px solid #2f3336;
    background-color: #15181c;
    padding: 8px 12px;
    gap: 8px;
  }
  .custom-input {
    flex: 1;
    background-color: #202327;
    border: 1px solid #2f3336;
    border-radius: 9999px;
    padding: 6px 12px;
    color: #f7f9f9;
    font-size: 0.8rem;
    outline: none;
    transition: border-color 0.2s;
  }
  .custom-input:focus {
    border-color: rgb(29, 155, 240);
  }
  .custom-submit-btn {
    background: none;
    border: none;
    padding: 0;
    color: rgb(29, 155, 240);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    transition: background-color 0.2s;
  }
  .custom-submit-btn:hover {
    background-color: rgba(29, 155, 240, 0.1);
  }
  .custom-submit-btn svg {
    display: block;
  }
`;
