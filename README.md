# SmartFlow AI (Local MVP)

SmartFlow AI is a full-stack workflow automation platform for SMBs, with a modern dashboard and AI-generated workflows.

## Stack

- Frontend: Next.js (App Router) + TypeScript + Tailwind CSS
- Backend: FastAPI + LangGraph-ready agent service
- Database: PostgreSQL (pgvector image) + Redis via Docker Compose
- AI: Local LLM through Ollama-compatible API

## Run Locally

### 1) Start infrastructure

```bash
docker compose up -d
```

### 2) Start backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

### 3) Start frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Current MVP Features

- AI prompt to workflow generation (`/workflows/create-from-prompt`)
- Workflow list and dashboard stats
- Local LLM support (Ollama endpoint + model in `.env`)
- RAG service placeholder ready for pgvector retrieval integration
- Drag-and-drop workflow builder in UI (save per workflow)
- LangGraph test pipeline endpoint (`/workflows/{id}/run-test`)
- Graph persistence endpoint (`/workflows/{id}/graph`)

## Next Recommended Upgrades

- Multi-tenant auth (Clerk/NextAuth + RBAC)
- Drag-and-drop workflow builder UI
- LangGraph state machine with tool execution nodes
- Gmail/Slack/WhatsApp/Stripe integrations
- Audit logs, retries, and webhook signature verification
# Business_WorkFlow_Automation_Platform
