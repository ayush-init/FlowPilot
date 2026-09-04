# FlowPilot: Long-Running AI Order Supervisor
## Master Project Plan & Learning Roadmap

This document is your comprehensive, phase-by-phase blueprint for building the **FlowPilot** AI Order Supervisor POC. It includes step-by-step implementation instructions, technology explainers (FastAPI, Temporal, Next.js, Gemini API), database schema designs, API contracts, testing strategies, and Git commit checkpoints after each phase.

---

## 1. Project Overview & Architecture

### What is FlowPilot?
FlowPilot is an event-driven, long-running AI supervisor designed to monitor an e-commerce order across its entire lifecycle (from creation to delivery or refund). 

Unlike traditional bots that poll continuously (which wastes LLM tokens and compute), FlowPilot uses **Temporal Workflows**:
- **Durable Sleep**: The workflow sleeps when no action is required.
- **Signal Triggers**: It wakes up immediately when external events arrive (e.g. `payment_failed`, `shipment_delayed`).
- **Scheduled Wakeup**: It wakes up on a schedule to check in (e.g. "Wake me up in 2 hours to check tracking").
- **Agent Reasoning (Gemini API)**: When awake, Google's Gemini LLM evaluates the state, decides actions (messaging teams, adding notes) via function calling, updates memory, and goes back to sleep.
- **Lifecycle Rules**: When a terminal state is reached (`delivered`, `refunded`, `terminated`), the workflow executes a final retrospective with Gemini to produce learnings and recommendations.

### High-Level Architecture Diagram

```
                              ┌──────────────────────────────────────────────┐
                              │            Next.js 14 Web App                │
                              │       (Tailwind CSS, App Router)             │
                              └──────────────────────┬───────────────────────┘
                                                     │ HTTP / REST API
                                                     ▼
                              ┌──────────────────────────────────────────────┐
                              │             FastAPI Backend Server           │
                              │      (Endpoints, Validation, DB Session)     │
                              └──────────────┬────────────────┬──────────────┘
                                             │                │
                     Start / Signal Workflow │                │ CRUD Operations (asyncpg)
                                             ▼                ▼
              ┌──────────────────────────────────────┐  ┌───────────────────────────────┐
              │          Temporal Cluster            │  │     PostgreSQL (Supabase)     │
              │ (Timers, Signals, Workflow State)    │  │ (Runs, Activities, Memory,    │
              └──────────────────┬───────────────────┘  │  Supervisor Templates, Notes) │
                                 │                      └───────────────▲───────────────┘
                                 ▼                                      │
              ┌─────────────────────────────────────────────────────────┴┐
              │            Temporal Python Worker Process                │
              │                                                          │
              │  1. OrderSupervisorWorkflow (Deterministic state machine)│
              │  2. Classifier Policy (Determines whether to wake agent) │
              │  3. Agent Reasoning Engine (Google Gemini API & Tools)   │
              │     - Function Calling: 5 Business Actions               │
              │  4. Retrospective & Learnings Generator (Gemini)         │
              └──────────────────────────────────────────────────────────┘
```

---

## 2. Core Technologies Explained (Learning Notes)

### A. FastAPI (Python)
- **What is it?** A modern, high-performance web framework for building APIs with Python 3.10+.
- **Why use it?** 
  - Automatic data validation with **Pydantic** models.
  - Built-in asynchronous support (`async` / `await`), which is ideal for concurrent I/O with databases and Temporal.
  - Automatic interactive documentation at `/docs` (Swagger UI).
  - Dependency Injection system (`Depends`) for clean database session management.

### B. PostgreSQL (Supabase) & Async SQLAlchemy
- **What is it?** PostgreSQL is the gold standard open-source relational database. Supabase provides managed PostgreSQL with connection pooling and instant cloud hosting.
- **Why use it in FlowPilot?**
  - **Durable Audit Log**: Persistent, relational tracking of runs, activities, agent decisions, and memory snapshots.
  - **Async Driver (`asyncpg`)**: FastAPI non-blocking async queries for extreme performance and scalability.
  - **JSONB Support**: Rich storage for metadata, tool call arguments, and event payloads.

### C. Google Gemini API (`google-genai` / `gemini-1.5-flash` / `gemini-2.5-flash`)
- **What is it?** Google's state-of-the-art multimodal and reasoning LLM with fast inference, large context windows, and native tool/function calling support.
- **Why use it in FlowPilot?**
  - **Structured Function Calling**: Directly executes the 5 required business actions with guaranteed schema compliance.
  - **Event Classification**: Evaluates incoming signals with high speed and low latency.
  - **Context Compaction & Retrospectives**: Synthesizes end-of-run learnings, order summaries, and optimization advice.

### D. Temporal (Python SDK - `temporalio`)
- **What is it?** An open-source orchestrator for durable, reliable execution of long-running distributed applications.
- **Why use it instead of Cron or Celery?**
  - **Durable State**: If the server crashes or restarts, the workflow resumes exactly where it left off.
  - **Durable Timers**: You can do `await workflow.sleep(timedelta(days=3))` without keeping a thread or process busy.
  - **Signals**: External systems can send signals (`workflow.signal`) into a specific running workflow instance by its `workflow_id`.
  - **Queries**: You can query the live in-memory state of a workflow in real-time.

### E. Next.js 14 (App Router) & Tailwind CSS
- **What is it?** React-based full-stack framework with React Server Components, client-side routing, and utility-first CSS.
- **Why use it?** Enables rapid development of a clean, responsive operator dashboard with real-time state polling, timeline visualization, and interactive event simulation.

---

## 3. Database Schema (PostgreSQL / Supabase)

FlowPilot stores all supervisor configs, live runs, activities, and final outputs in PostgreSQL (Supabase):

1. **`supervisors`**
   - `id`: UUID (Primary Key, default `gen_random_uuid()`)
   - `name`: VARCHAR(255)
   - `base_instruction`: TEXT
   - `model`: VARCHAR(100) (e.g., `gemini-1.5-flash`, `gemini-1.5-pro`)
   - `aggressiveness`: VARCHAR(50) (`low`, `balanced`, `high` - controls classifier wake sensitivity)
   - `default_wakeup_interval_seconds`: INTEGER (default e.g. 7200 / 2 hours)
   - `created_at`: TIMESTAMPTZ (default `NOW()`)

2. **`order_runs`**
   - `id`: UUID (Primary Key, default `gen_random_uuid()`)
   - `order_id`: VARCHAR(100) (e.g., `ORD-9842`)
   - `supervisor_id`: UUID (Foreign Key -> `supervisors.id` ON DELETE SET NULL)
   - `temporal_workflow_id`: VARCHAR(255) UNIQUE
   - `status`: VARCHAR(50) (`INITIALIZING`, `RUNNING`, `SLEEPING`, `PAUSED`, `COMPLETED`, `TERMINATED`)
   - `compact_memory`: TEXT (Rolling summary of the order context and agent takeaways)
   - `current_state`: JSONB (Order details, tracking status, last event)
   - `extra_instructions`: TEXT (Mid-run human instructions)
   - `next_wakeup_at`: TIMESTAMPTZ (nullable)
   - `final_summary`: TEXT (nullable)
   - `learnings`: TEXT (nullable)
   - `recommendations`: TEXT (nullable)
   - `created_at`, `updated_at`, `completed_at`: TIMESTAMPTZ

3. **`run_activities`**
   - `id`: UUID (Primary Key, default `gen_random_uuid()`)
   - `run_id`: UUID (Foreign Key -> `order_runs.id` ON DELETE CASCADE)
   - `activity_type`: VARCHAR(100) (`SIGNAL_RECEIVED`, `WAKE_DECISION`, `AGENT_REASONING`, `TOOL_ACTION`, `INSTRUCTION_ADDED`, `WORKFLOW_STATE_CHANGE`, `FINAL_RETROSPECTIVE`)
   - `title`: VARCHAR(255)
   - `content`: TEXT
   - `metadata_json`: JSONB
   - `created_at`: TIMESTAMPTZ (default `NOW()`)

---

## 4. Phased Implementation Roadmap

### **Phase 1: Project Scaffolding & Setup**
- Initialize Git repository and `.gitignore`.
- Set up `/backend` and `/frontend` directories.
- Configure backend virtual environment (`venv`) and `requirements.txt` (including `google-genai`, `fastapi`, `uvicorn`, `temporalio`, `sqlalchemy`, `asyncpg`, `psycopg2-binary`, `pydantic`).
- Set up `backend/.env.example` with Supabase PostgreSQL connection string and `GEMINI_API_KEY`.
- **Git Checkpoint 1**: Initial project scaffolding.

### **Phase 2: Database Layer & Data Models (PostgreSQL / Supabase)**
- Implement async SQLAlchemy database engine with `asyncpg` support.
- Define models (`Supervisor`, `OrderRun`, `RunActivity`) with PostgreSQL UUID and JSONB field types.
- Define Pydantic validation schemas for API and Temporal payloads.
- Implement database auto-initialization/migration script (`init_db.py`) to create tables and seed default supervisor templates.
- **Git Checkpoint 2**: Database models and schema definitions for PostgreSQL.

### **Phase 3: Temporal Workflow & Activity Engine**
- Implement `OrderSupervisorWorkflow` with event-driven wait/sleep loop.
- Implement signal handlers: `signal_event`, `signal_instruction`, `signal_pause`, `signal_resume`, `signal_terminate`.
- Implement durable activities for classification, agent reasoning, tool execution, and retrospectives.
- Synchronize workflow state with PostgreSQL / Supabase via activities.
- Set up Temporal worker process runner.
- **Git Checkpoint 3**: Temporal workflow and activities.

### **Phase 4: Agent Reasoning Engine with Gemini API & 5 Business Actions**
- Implement Gemini function calling tool declarations for:
  1. `message_fulfillment_team`
  2. `message_payments_team`
  3. `message_logistics_team`
  4. `message_customer`
  5. `create_internal_note`
- Implement lightweight event classifier using Gemini to decide wake vs sleep.
- Implement agent reasoning with Gemini SDK + prompt templates.
- Implement rolling memory compaction and end-of-run retrospective synthesis.
- Record all action records directly into PostgreSQL `run_activities`.
- **Git Checkpoint 4**: Gemini agent reasoning, tool calling, and memory compaction.

### **Phase 5: FastAPI Backend APIs & Service Layer**
- Implement REST API endpoints:
  - Supervisor config management (`/api/supervisors`)
  - Order run lifecycle (`/api/runs`, `/api/runs/{id}`)
  - Signal injection (`/api/runs/{id}/events`, `/api/runs/{id}/instructions`)
  - Workflow control (`/api/runs/{id}/pause`, `/api/runs/{id}/resume`, `/api/runs/{id}/terminate`)
  - Activity audit log (`/api/runs/{id}/activities`)
  - Preset test simulation scenarios (`/api/simulator/scenario`)
- Configure FastAPI CORS, lifecycle handlers, and OpenAPI docs.
- **Git Checkpoint 5**: FastAPI backend APIs and service layer.

### **Phase 6: Next.js Frontend Dashboard**
- Set up Next.js 14 App Router with Tailwind CSS & Lucide icons.
- Build Supervisor Configurator UI.
- Build Order Runs List with real-time status badges (`RUNNING`, `SLEEPING`, `PAUSED`, `COMPLETED`).
- Build Run Detail View (Status, Next Wakeup Countdown, Memory, Timeline).
- Build Interactive Event Simulator & Mid-Run Instruction Injector.
- Build Retrospective & Learnings Modal.
- **Git Checkpoint 6**: Next.js frontend dashboard.

### **Phase 7: End-to-End Scenarios, Tests & Documentation**
- Write automated test suite with `pytest`.
- Execute all 5 required business verification scenarios.
- Write comprehensive `README.md` with architecture, Supabase PostgreSQL setup instructions, Gemini API configuration, Temporal guide, and demo walkthrough script.
- **Git Checkpoint 7**: Complete project, tests, and documentation.
