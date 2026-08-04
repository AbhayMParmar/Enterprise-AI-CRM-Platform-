# 🚀 Vercel Deployment Guide — Enterprise AI CRM Platform

## Architecture on Vercel

```
Vercel Project
├── /api/index.ts         → Serverless Function (Express backend)
├── /client/dist/         → Static CDN (React frontend)
└── vercel.json           → Routing: /api/* → serverless, /* → SPA
```

All traffic hits a single Vercel deployment:
- **`/api/*`** → routed to the Express serverless function
- **`/*`** → served from the Vite static build with SPA fallback

---

## Step 1 — Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Add New Project"**
3. Import **`AbhayMParmar/Enterprise-AI-CRM-Platform-`** from GitHub
4. **Do NOT change** the Framework Preset — leave it as **"Other"**
5. Vercel will auto-detect `vercel.json` and use these build settings:
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`

---

## Step 2 — Set Environment Variables

In **Vercel Dashboard → Settings → Environment Variables**, add ALL of these:

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Access token signing secret |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing secret |
| `GROQ_API_KEY` | ✅ | Groq LLaMA-3 API key |
| `CLIENT_URL` | ✅ | Your Vercel app URL (`https://your-app.vercel.app`) |
| `GOOGLE_CLIENT_ID` | ⚡ | Google OAuth (if using Google login) |
| `GOOGLE_CLIENT_SECRET` | ⚡ | Google OAuth secret |
| `CLOUDINARY_CLOUD_NAME` | ⚡ | Avatar uploads (if using Cloudinary) |
| `CLOUDINARY_API_KEY` | ⚡ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ⚡ | Cloudinary API secret |
| `EMAIL_HOST` | ⚡ | SMTP host for OTP emails |
| `EMAIL_PORT` | ⚡ | SMTP port (587 for TLS) |
| `EMAIL_USER` | ⚡ | SMTP email address |
| `EMAIL_PASS` | ⚡ | SMTP app password |
| `REDIS_URL` | ⚡ | Upstash Redis URL (optional) |
| `NODE_ENV` | ✅ | Set to `production` |

> See `.env.example` for the full list with descriptions.

---

## Step 3 — MongoDB Atlas Network Access

Allow Vercel's IPs (or use `0.0.0.0/0` for simplicity):

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to **Network Access → Add IP Address**
3. Add `0.0.0.0/0` (allow from anywhere) for Vercel serverless IPs
4. Click **Confirm**

---

## Step 4 — Deploy

Click **"Deploy"** on Vercel. The build will:
1. Run `npm install` (root)
2. Run `npm run vercel-build` → `cd client && npm install && npm run build`
3. Output static files to `client/dist`
4. Package `api/index.ts` as a serverless function

---

## Step 5 — Post-Deployment Configuration

After your first deployment, update these settings:

### Google OAuth (if using)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services → Credentials → Your OAuth Client**
3. Add your Vercel URL to **Authorized JavaScript origins**:
   - `https://your-app.vercel.app`
4. Add to **Authorized redirect URIs**:
   - `https://your-app.vercel.app/api/auth/google/callback`

### Update CLIENT_URL env var
Set `CLIENT_URL` to your actual Vercel deployment URL.

---

## Redis Note (Important for Serverless)

The default Redis setup uses a persistent TCP connection which doesn't work well with serverless functions. For Vercel deployment, use **[Upstash Redis](https://upstash.com)** (serverless-compatible):

1. Create a free Upstash Redis database
2. Copy the `REDIS_URL` (starts with `rediss://`)
3. Set it as the `REDIS_URL` environment variable in Vercel

---

## Local Development

```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend
npm run dev

# Frontend → http://localhost:5173
# Backend  → http://localhost:5000
```

---

## Useful Vercel CLI Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check logs
vercel logs your-app.vercel.app

# List env variables
vercel env ls
```
