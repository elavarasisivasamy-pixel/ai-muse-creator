<<<<<<< HEAD
{
  "manifest_version": 3,
  "name": "AI Muse Creator",
  "version": "1.0",
  "description": "Voice-to-image AI creator with edits and shares",
  "permissions": ["activeTab", "storage", "unlimitedStorage", "clipboardWrite"],
  "host_permissions": ["http://localhost:3000/*", "http://127.0.0.1:3000/*"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "AI Muse"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; connect-src chrome://resources chrome://theme 'self' http://localhost:3000;"
  },
  "icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  }
=======
{
  "manifest_version": 3,
  "name": "AI Muse Creator",
  "version": "1.0",
  "description": "Voice-to-image AI creator with edits and shares",
  "permissions": ["activeTab", "storage", "unlimitedStorage", "clipboardWrite"],
  "host_permissions": ["http://localhost:3000/*", "http://127.0.0.1:3000/*"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "AI Muse"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; connect-src chrome://resources chrome://theme 'self' http://localhost:3000;"
  },
  "icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  }
>>>>>>> d67b6e54235b0ba181efedd522db3f5840c7de45
}