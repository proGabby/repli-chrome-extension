// Gemini API Call Integration for X AI Reply Background Worker

const STORAGE_KEYS = {
  API_KEY: 'x_ai_reply_api_key',
  TONE: 'x_ai_reply_default_tone',
};

/**
 * Contacts Gemini API to generate 3 reply options based on the given context.
 */
export async function handleReplyGeneration(tweetText: string, customTone?: string, customInstructions?: string): Promise<string[]> {
  // Retrieve settings
  const settings = await chrome.storage.local.get([STORAGE_KEYS.API_KEY, STORAGE_KEYS.TONE]);
  const apiKey = settings[STORAGE_KEYS.API_KEY];
  const defaultTone = settings[STORAGE_KEYS.TONE] || 'supportive';
  const tone = customTone || defaultTone;

  if (!apiKey) {
    throw new Error('API key is missing. Please click the extension icon in your toolbar to configure your Gemini API Key.');
  }

  let prompt = `You are a helpful assistant generating short replies for X (Twitter).
Analyze the following tweet and generate exactly 3 distinct reply options.

Rules for replies:
1. Tone must be: "${tone}".
2. Make them sound conversational, human, and natural (avoid generic AI corporate-speak).
3. Do not include hashtags or emojis unless appropriate for the tone.
4. Keep each reply under 280 characters.
5. Output format MUST be a valid JSON array of exactly 3 strings. Example: ["reply option 1", "reply option 2", "reply option 3"]`;

  if (customInstructions) {
    prompt += `\n\nCRITICAL - Additional Custom Instructions:
- You MUST adjust your reply generation to follow these user instructions: "${customInstructions}"`;
  }

  prompt += `\n\nTweet Context:\n"${tweetText}"`;

  const models = [
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-flash-lite'
  ];

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      console.log(`Attempting AI reply generation with model: ${model}`);
      const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error?.message || `HTTP error! status: ${response.status}`;
        throw new Error(`${message}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Invalid response payload structure.');
      }

      // Clean up markdown code blocks if the model wrapped the JSON
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trim();

      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length === 3 && parsed.every(item => typeof item === 'string')) {
        console.log(`Successfully generated replies using model: ${model}`);
        return parsed;
      }
      throw new Error('Response is not a valid JSON array of 3 strings.');
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err.message);
      lastError = err;
    }
  }

  // Log supported models for debugging on final failure
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    const listRes = await fetch(listUrl);
    if (listRes.ok) {
      const listData = await listRes.json();
      const modelNames = listData.models?.map((m: any) => m.name) || [];
      console.warn('Supported models list for this API Key:', modelNames);
    }
  } catch (listErr) {
    console.error('Failed to list supported models:', listErr);
  }

  throw new Error(`All Gemini models failed. Last Error: ${lastError?.message || 'Unknown error'}`);
}
