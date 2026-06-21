# Repli

**Repli** is a lightweight, privacy-focused Chrome Extension that brings AI-powered reply generation directly into X (Twitter). Instead of staring at a blank text box, Repli analyzes the tweet context and provides 3 distinct, tone-tailored reply options within seconds using the **Gemini 3.5 Flash** model.

Select your preferred option, tweak it, and post it yourself!

---

## Features
- **Seamless Integration:** Adds a native-looking Spark button directly into X's reply input toolbar.
- **Context-Aware Suggestions:** Scrapes the context of the tweet you are replying to (works in modals, detail views, and inline threads).
- **Tone Customization:** Configure your default reply tone (Supportive, Witty, Professional, Contribution, Agree, Disagree) in the extension settings.
- **Draft.js React State Integration:** Uses clipboard injection workarounds to update X's rich editor state cleanly, enabling the native "Post" button.
- **Shadow DOM Encapsulation:** Protects the UI overlay styles from X's stylesheet rules.
- **Secure API Key Storage:** Keys are saved locally in the browser (`chrome.storage.local`) and called directly via background service workers.

---

## Getting Started

### 1. Prerequisites
You need a Gemini API Key to use this extension:
1. Head over to [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API Key** and create a key (Free tier works perfectly).

### 2. Loading the Extension in Chrome
1. Download or clone this repository.
2. Build the project distribution folder (see [Development](#development) below).
3. Open Google Chrome and navigate to `chrome://extensions/`.
4. Enable **Developer mode** (toggle in the top-right corner).
5. Click **Load unpacked** (button in the top-left corner).
6. Select the compiled **`dist`** folder inside this project directory.
7. Click the extension puzzle icon in your Chrome toolbar, pin **Repli**, and click the icon to paste your Gemini API key and choose your default tone.

---

## Development

Repli is built using modern tooling:
- **Build Tool:** Vite
- **Language:** TypeScript
- **Bundler:** CRXJS (Vite Chrome Extension Plugin)

### Scripts
Install project dependencies:
```bash
npm install
```

Generate the static build folder (`/dist`):
```bash
npm run build
```

---

## License
Distributed under the GNU General Public License v3.0 (GPL-3.0). See [LICENSE](./LICENSE) for more information.
