// Background for persistent AI sessions (Gemini Nano)
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Muse installed');
});

// Listen for messages from popup (e.g., for cross-tab)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'aiPrompt') {
    // Proxy to built-in AI if needed
    if (window.ai) {
      // Handle session creation here if multi-tab
    }
  }
});