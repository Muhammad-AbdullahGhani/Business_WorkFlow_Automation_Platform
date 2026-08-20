# 🚀 SmartFlow AI - 100% Free Deployment Guide

This guide shows you how to deploy **SmartFlow AI** (Full Stack: Next.js Frontend + FastAPI/LangGraph Backend + PostgreSQL/SQLite + Free AI LLM) online for **$0 / month**.

---

## 🏗️ Architecture Overview

| Component | Recommended Free Provider | Free Tier Details |
| :--- | :--- | :--- |
| **Frontend** (Next.js) | [Vercel](https://vercel.com) | Unlimited deployments, fast global CDN, SSL, custom domains |
| **Backend** (FastAPI) | [Render.com](https://render.com) or [Koyeb](https://koyeb.com) | 750 free hours/month, automatic git deploys, HTTPS |
| **Database** (PostgreSQL) | [Supabase](https://supabase.com) or [Neon.tech](https://neon.tech) | Free Postgres (with pgvector support for RAG) |
| **AI LLM API** | [Groq Cloud](https://console.groq.com) or [Google AI Studio](https://aistudio.google.com) | Ultra-fast Llama 3.3 (70B) & Gemini 2.0 with free API tier |

---

## ⚡ Step 1: Push Code to GitHub

Make sure your latest code is committed and pushed to your GitHub repository:

```bash
git add .
git commit -m "Upgrade SmartFlow AI: multi-provider LLM, drag-and-drop builder, and free deployment configs"
git push origin main
```

---

## 🧠 Step 2: Get a Free AI API Key (Optional but Recommended)

For instant cloud AI generation without running local Ollama:
1. Go to [Groq Cloud Console](https://console.groq.com/keys) (100% Free, no credit card required).
2. Sign in with Google / GitHub and click **Create API Key**.
3. Copy your key (starts with `gsk_...`).

*(Alternatively, you can also use a free Google Gemini key from [Google AI Studio](https://aistudio.google.com))*

---

## 🗄️ Step 3: Set Up Free PostgreSQL (Supabase or Neon) - *Optional*

> *Note: SmartFlow works out of the box with SQLite if you prefer not to set up external Postgres.*

1. Go to [Supabase](https://supabase.com) or [Neon](https://neon.tech) and create a free project.
2. Under **Project Settings -> Database**, copy the **URI Connection String** (e.g., `postgresql://postgres:[password]@...supabase.co:5432/postgres`).

---

## ⚙️ Step 4: Deploy Backend to Render.com (Free)

1. Sign up / Log in to [Render.com](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository (`Business_WorkFlow_Automation_Platform`).
4. Configure the settings:
   - **Name**: `smartflow-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. Add **Environment Variables**:
   - `DATABASE_URL`: `sqlite:///./smartflow.db` *(or your Supabase/Neon PostgreSQL URL)*
   - `LLM_PROVIDER`: `auto`
   - `GROQ_API_KEY`: *(paste your Groq key from Step 2)*
   - `CORS_ORIGINS`: `*`
6. Click **Create Web Service**.
7. Once deployed (takes ~2 minutes), copy your backend URL (e.g. `https://smartflow-backend.onrender.com`).

---

## 🌐 Step 5: Deploy Frontend to Vercel (Free)

1. Sign up / Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`Business_WorkFlow_Automation_Platform`).
4. In the configuration screen:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and choose `frontend`.
5. Expand **Environment Variables** and add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://smartflow-backend.onrender.com` *(your Render URL from Step 4)*
6. Click **Deploy**.

---

## 🎉 Step 6: Verify Live Platform

1. Open your Vercel URL (e.g. `https://smartflow-ai.vercel.app`).
2. Test the platform:
   - Type a prompt in the AI generator (e.g., *"Invoice PDF extraction and alert finance in Slack"*).
   - Click **Generate Flow**.
   - Open the **Visual Builder** and re-order nodes using drag and drop.
   - Click **Run Test** to execute the live LangGraph agent pipeline and review real-time trace outputs!

---

## 🛠️ Local Development Quick Reference

To run locally anytime:

```bash
# Terminal 1 - Backend
cd backend
.venv\Scripts\activate      # On Windows (.venv/bin/activate on Mac/Linux)
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.
