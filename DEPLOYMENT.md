# 🚀 FlowPilot AI — Complete Production Deployment Guide

This guide walks you through deploying **FlowPilot AI** to production in under 10 minutes:
- **Backend API & AI Engine**: Deployed on **[Render](https://render.com)** (FastAPI, Uvicorn, SQLAlchemy).
- **Frontend Console**: Deployed on **[Vercel](https://vercel.com)** (Next.js 14, Tailwind CSS).
- **Database**: Cloud **Neon PostgreSQL** / Supabase.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:
1. **GitHub Repository**: `https://github.com/ayush-init/FlowPilot` (Up to date).
2. **Neon PostgreSQL Database URL**: Your async connection string (`postgresql://...`).
3. **Google Gemini API Key**: From Google AI Studio.
4. **Google OAuth Credentials** (Optional for Google Sign-In): Client ID and Secret.

---

## Part 1: Deploy Backend on Render

### Step 1: Create a Web Service on Render
1. Go to [dashboard.render.com](https://dashboard.render.com) and click **"New +"** $\rightarrow$ **"Web Service"**.
2. Connect your GitHub repository: `ayush-init/FlowPilot`.
3. Fill in the service configuration:
   - **Name**: `flowpilot-backend` (or any custom name)
   - **Region**: `Oregon (US West)` (or your preferred region)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`

### Step 2: Configure Environment Variables on Render
Click on **"Advanced"** or navigate to the **"Environment"** tab, and add the following variables:

| Variable Name | Value | Description |
|---|---|---|
| `PYTHON_VERSION` | `3.11.9` | Python runtime version |
| `ENV` | `production` | Enables production mode & cross-site cookies |
| `DEBUG` | `false` | Disables debug logs |
| `DATABASE_URL` | `postgresql+asyncpg://neondb_owner:npg_8q4wJgNheKjA@ep-rough-morning-a1n4q2i7-pooler.ap-southeast-1.aws.neon.tech/neondb?ssl=require` | Your Neon Postgres DB |
| `GEMINI_API_KEY` | `YOUR_GEMINI_API_KEY` | Google Gemini API key |
| `SESSION_SECRET` | `flowpilot-prod-secret-session-key-2026` | Random secure secret string |
| `FRONTEND_URL` | `https://your-flowpilot-frontend.vercel.app` *(update after Part 2)* | Vercel production frontend URL |
| `GOOGLE_CLIENT_ID` | `YOUR_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | `YOUR_GOOGLE_CLIENT_SECRET` | Google OAuth Secret |
| `GOOGLE_REDIRECT_URI` | `https://<YOUR_RENDER_SERVICE_NAME>.onrender.com/api/auth/google/callback` | Render OAuth callback URL |

4. Click **"Deploy Web Service"**.
5. Once deployed, note down your Render service URL (e.g., `https://flowpilot-backend.onrender.com`).

---

## Part 2: Deploy Frontend on Vercel

### Step 1: Import Project to Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Add New..."** $\rightarrow$ **"Project"**.
2. Select your `FlowPilot` GitHub repository.
3. In the project setup screen:
   - **Framework Preset**: `Next.js` (automatically detected)
   - **Root Directory**: Click **Edit** and choose `frontend` 👈 *(CRITICAL STEP)*
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)

### Step 2: Configure Environment Variables on Vercel
In the **"Environment Variables"** section, add:

| Key | Value | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<YOUR_RENDER_BACKEND_URL>/api` | `https://flowpilot-backend.onrender.com/api` |

4. Click **"Deploy"**.
5. After build completes (~1 minute), Vercel will give you a live production URL (e.g., `https://flowpilot-frontend.vercel.app`).

---

## Part 3: Connect Both Services (Final 2 Minutes)

1. **Update Render `FRONTEND_URL`**:
   - Go back to Render $\rightarrow$ `flowpilot-backend` $\rightarrow$ **Environment**.
   - Set `FRONTEND_URL` to your live Vercel URL (e.g. `https://flowpilot-frontend.vercel.app`).
   - Save changes (Render will auto-redeploy).

2. **Update Google Cloud OAuth Authorized Redirect URI** (if using Google Login):
   - Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   - Select your OAuth 2.0 Client ID.
   - Under **Authorized redirect URIs**, add:
     `https://<YOUR_RENDER_SERVICE_NAME>.onrender.com/api/auth/google/callback`
   - Under **Authorized JavaScript origins**, add:
     `https://<YOUR_VERCEL_FRONTEND_URL>`
   - Click **Save**.

---

## ✅ Verification Checklist

- [ ] **Backend Health Check**: Open `https://<YOUR_RENDER_URL>/health` $\rightarrow$ should return `{"status":"healthy"}`.
- [ ] **Frontend Load**: Open `https://<YOUR_VERCEL_URL>` $\rightarrow$ should load the login screen.
- [ ] **Email Sign-In**: Enter `ayushchaurasiya9532951470@gmail.com` $\rightarrow$ logs in and loads the dashboard.
- [ ] **Order Run Launch**: Click **"+ New Order Run"** and launch an order run $\rightarrow$ supervisor initializes in real time!
