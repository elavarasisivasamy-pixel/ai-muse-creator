# Backend Proxy for AI Muse Creator

## Local Dev
1. npm install
2. cp .env.example .env (fill vars)
3. npm run dev

## Endpoints
- POST /generate-image { prompt: "..." } → { image: "data:..." }
- POST /analyze-mood { transcript: "..." } → { mood: "...", style: "..." }
- POST /share { text, imageBase64, alt } → { shareUrl, qrDataUrl }
- GET /share/:id → Share data

## Deploy
- Vercel: vercel.com → Import GitHub → Add env vars → Deploy.
- MongoDB: atlas.mongodb.com → New cluster (free M0) → Get URI.

Extend: Add auth (JWT), rate limiting (express-rate-limit).
## Backend Integration
- Deploy `/backend` to Vercel.
- Update `BACKEND_URL` in `popup.js`.
- Env: Add Stability/OpenAI keys in Vercel dashboard.