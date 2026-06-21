// Settings storage keys
const STORAGE_KEYS = {
  API_KEY: 'x_ai_reply_api_key',
  TONE: 'x_ai_reply_default_tone',
};

// DOM elements
const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
const toneSelect = document.getElementById('default-tone') as HTMLSelectElement;
const settingsForm = document.getElementById('settings-form') as HTMLFormElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const toggleKeyBtn = document.getElementById('toggle-key') as HTMLButtonElement;

// Load settings on init
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get([STORAGE_KEYS.API_KEY, STORAGE_KEYS.TONE], (result) => {
    const savedKey = result[STORAGE_KEYS.API_KEY];
    const savedTone = result[STORAGE_KEYS.TONE];
    if (typeof savedKey === 'string') {
      apiKeyInput.value = savedKey;
    }
    if (typeof savedTone === 'string') {
      toneSelect.value = savedTone;
    }
  });
});

// Toggle password visibility
toggleKeyBtn.addEventListener('click', () => {
  const type = apiKeyInput.type === 'password' ? 'text' : 'password';
  apiKeyInput.type = type;
  
  // Toggle icon state
  const svg = toggleKeyBtn.querySelector('svg');
  if (svg) {
    if (type === 'text') {
      // Crossed eye path or simple indicator change
      svg.style.color = 'var(--primary-color)';
    } else {
      svg.style.color = 'var(--text-secondary)';
    }
  }
});

// Save settings on submit
settingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const apiKey = apiKeyInput.value.trim();
  const tone = toneSelect.value;
  
  chrome.storage.local.set({
    [STORAGE_KEYS.API_KEY]: apiKey,
    [STORAGE_KEYS.TONE]: tone,
  }, () => {
    // Show success feedback
    statusEl.textContent = 'Settings saved successfully!';
    statusEl.className = 'status-message success';
    
    // Hide feedback after 2 seconds
    setTimeout(() => {
      statusEl.className = 'status-message';
      statusEl.textContent = '';
    }, 2000);
  });
});
