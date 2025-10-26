chrome.runtime.onInstalled.addListener(() => console.log('AI Muse installed'));
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startVoice') {
    // For content script integration if needed
  }
});