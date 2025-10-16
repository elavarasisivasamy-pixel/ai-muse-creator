// Inject mic button on pages for quick voice
if (location.hostname !== 'extensions::something') { // Avoid popup
  const btn = document.createElement('button');
  btn.textContent = 'AI Muse Voice';
  btn.onclick = () => chrome.runtime.sendMessage({ action: 'startVoice' });
  document.body.appendChild(btn);
}