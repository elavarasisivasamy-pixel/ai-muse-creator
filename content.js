// Inject button on pages
const btn = document.createElement('button');
btn.textContent = 'AI Muse Voice';
btn.onclick = () => chrome.runtime.sendMessage({ action: 'startVoice' });
document.body.appendChild(btn);