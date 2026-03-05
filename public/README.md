# NutriScan AI — Vercel Deployment Guide

## Project Structure
```
nutriscan/
├── api/
│   └── analyze.js        ← Serverless function (API key lives here)
├── public/
│   └── index.html        ← Your app
├── vercel.json           ← Routing config
└── README.md
```

## Deploy Steps

### Step 1 — Upload to GitHub
1. Create new repo on github.com
2. Upload all 3 files maintaining folder structure

### Step 2 — Deploy on Vercel
1. Go to vercel.com → New Project
2. Import your GitHub repo
3. Click Deploy

### Step 3 — Add Environment Variable ✅
1. Vercel Dashboard → Your Project → Settings
2. Click "Environment Variables"
3. Add:
   - **Name:** `OPENROUTER_API_KEY`
   - **Value:** `sk-or-v1-your-actual-key-here`
4. Click Save
5. **Redeploy** the project (Important!)

## How It Works (Secure Flow)
```
User scans food
     ↓
Browser → POST /api/analyze (only sends image)
     ↓
Vercel Server reads OPENROUTER_API_KEY (secret, never sent to browser)
     ↓
Server calls OpenRouter API with key
     ↓
Server returns nutrition data to browser
     ↓
App shows results ✅
```

## API Key Safety
- ✅ Key stored in Vercel Environment Variable
- ✅ Key never appears in browser/source code
- ✅ Key never visible in Network tab
- ✅ Users cannot steal your API key
