// Background Service Worker Entry Point
import { handleReplyGeneration } from './api';

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'generate_replies') {
    handleReplyGeneration(request.tweetText, request.tone)
      .then((replies) => sendResponse({ success: true, replies }))
      .catch((error) => sendResponse({ success: false, error: error.message }));

    return true; // Keep message channel open for asynchronous reply
  }
  return false;
});
