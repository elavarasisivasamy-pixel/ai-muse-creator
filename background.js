<<<<<<< HEAD
chrome.runtime.onInstalled.addListener(() => console.log('AI Muse installed'));
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startVoice') {
    // For content script integration if needed
  }
=======
chrome.runtime.onInstalled.addListener(() => console.log('AI Muse installed'));
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startVoice') {
    // For content script integration if needed
  }
>>>>>>> d67b6e54235b0ba181efedd522db3f5840c7de45
});