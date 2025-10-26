<<<<<<< HEAD
// Inject button on pages
const btn = document.createElement('button');
btn.textContent = 'AI Muse Voice';
btn.onclick = () => chrome.runtime.sendMessage({ action: 'startVoice' });
=======
// Inject button on pages
const btn = document.createElement('button');
btn.textContent = 'AI Muse Voice';
btn.onclick = () => chrome.runtime.sendMessage({ action: 'startVoice' });
>>>>>>> d67b6e54235b0ba181efedd522db3f5840c7de45
document.body.appendChild(btn);