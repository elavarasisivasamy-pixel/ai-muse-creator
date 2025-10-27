# AI Muse Creator

Voice-to-image AI extension for Chrome Built-in AI Challenge 2025.

## Setup
1. Enable Chrome flags: chrome://flags/#prompt-api-for-gemini-nano (Enabled), #optimization-guide-on-device-model (Enabled).
2. Get Stability AI key: stability.ai (free tier).
3. Replace YOUR_STABILITY_API_KEY_HERE in popup.js.
4. Load unpacked in chrome://extensions/.

## Features
1. Voice recognition + lang check.
2. Mood detection pre-gen.
3. Generate simplified text + image prompt.
4. Post-gen review/regenerate.
5. Voice edit image (Canvas-based).
6. QR code or URL share.

## Challenge Fit
Uses Prompt API (Gemini Nano), Translator, Summarizer, Writer. On-device for privacy.

## Extend
- Full on-device images: Add Transformers.js (npm i @xenova/transformers, but bundle for extension).
- Backend: If needed, add Node/Express for cloud AI (e.g., Vercel), but not required.

Load unpacked: Download repo zip → chrome://extensions/ → Load unpacked → Select folder.
License: MIT. Submit to devpost.com!
