# Vect0r Deployment (0G Mainnet)

This guide deploys the backend to Render (native Node) and the frontend to Vercel.

## 1) Backend (Render Web Service)

Two options:
- Click “New +” → Web Service → Connect GitHub → pick this repo; set Root Directory to `backend`.
- Or use the included `render.yaml` (Blueprints). You can copy the values from it.

Recommended settings:

- Root directory: `backend`
- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Environment variables:
  - `NODE_ENV=production`
  - `ZG_CHAIN_RPC_URL=https://evmrpc.0g.ai`
  - `ZG_INDEXER_URL=https://indexer-storage-turbo.0g.ai`
  - `ZG_CHAIN_ID=16661`
  - `PRIVATE_KEY=<your 0G mainnet private key>`
  - `GEMINI_API_KEY=<your Gemini API key>`
  - `VECTOR_REGISTRY_ADDRESS=0x796373F5e5879AF43233B378c0425b54797Cf5B9`
  - `STORAGE_ORACLE_ADDRESS=0x52c0088C5b910FE40Cb217CF2d3E779113a0007e`
  - `UPLOAD_PATH=/tmp` (ephemeral is fine)
  - `CORS_ORIGIN=https://your-frontend.vercel.app` (update after frontend goes live)

> Render injects `PORT`. The app reads `process.env.PORT` automatically.

Verify after deploy:

- `GET https://<your-backend>.onrender.com/api/v1/health`
- `GET https://<your-backend>.onrender.com/api/v1/stats`

## 2) Frontend (Vercel)

- Import the repo in Vercel → set **Root Directory** to `frontend`.
- Environment variables:
  - `NEXT_PUBLIC_API_BASE=https://<your-backend>.onrender.com`
- Deploy. Open `/app/admin-dashboard` and test upload + RAG.

## 3) Post‑deploy

- Set the backend `CORS_ORIGIN` to the exact Vercel domain and redeploy backend.
- (Optional) Add custom domains to Vercel and Render.

## 4) Ops tips

- Auto‑deploy on push to `main` is supported by both platforms.
- If the backend restarts (free tier sleep), collections still sync from 0G mainnet.
- No persistent disk required—0G Storage + on‑chain state are the sources of truth.

## 5) Smoke Test

1. `GET /api/v1/health` → `{ status: "healthy" }`
2. Upload via UI (small `.txt`) → New collection appears at top with `count ≥ 1`.
3. Run a RAG query → Answer and sources returned.


