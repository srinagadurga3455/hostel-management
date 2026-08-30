# Hostel iOS — AI-Powered Hostel Management System

A web-based hostel management system with dedicated **Student** and **Warden** dashboards, hostel operations management, and an AI-powered hostel assistant.

## 🔗 Quick Links

- **Live Application:** https://hostel-management-srkr.vercel.app/
## 🔐 Demo Credentials

Use the following accounts to explore the Student and Warden dashboards:

| Role | Email | Password |
|------|-------|----------|
| **Warden** | `demo.warden@hostel.com` | `Warden@123` |
| **Student** | `demo.student@hostel.com` | `Student@123` | 

- **Demo Video:** https://www.loom.com/share/bc6fa3d1502b4b48b99db8cae0779fba
- **GitHub Repository:** https://github.com/durga67/hostel-management
- **Docker Hub — Combined (all-in-one):** https://hub.docker.com/r/durga67/hostel-management (`docker pull durga67/hostel-management:latest`)
- **Docker Hub — Backend:** https://hub.docker.com/r/durga67/hostel-backend
- **Docker Hub — Frontend:** https://hub.docker.com/r/durga67/hostel-frontend
- **API Documentation (Render):** https://hostel-management-u6o4.onrender.com/docs
- **Health:** https://hostel-management-u6o4.onrender.com/health | `/` → `{"status":"ok"}`

---

## 1. Project Overview

Hostel iOS streamlines hostel operations for students and wardens. Students manage rooms, attendance, outings, leaves, complaints and mess menus. Wardens manage occupancy, approvals, attendance and complaints. An AI agent (Grok/Groq `qwen/qwen3-8b`) assists students via chat to create and track requests with confirmation and safety policies.

Deployed: Frontend on Vercel (`hostel-management-srkr.vercel.app`), Backend on Render (`hostel-management-u6o4.onrender.com`), PostgreSQL 16. Docker images published to Docker Hub for `durga67`.

---

## 2. Key Features

### For Students (`frontend/src/pages/student/`)
- **Dashboard** (`Dashboard.tsx`) — Ask HostelOS chat, room/attendance/outing/complaint stats, today's mess menu
- **Room** — view allocated room, block/floor, occupancy, roommates
- **Attendance** — view `PRESENT/ABSENT` records by student
- **Outings** — request (`destination`, `outingDate`, `outTime`/`inTime`, `reason`) and list/status
- **Leaves** — apply (`startDate`→`endDate`, `reason`) and list/status
- **Complaints** — create (`title`, `description`) and track `PENDING/IN_PROGRESS/RESOLVED`
- **Food / Mess** — weekly menu (`day`, `breakfast`, `lunch`, `snacks`, `dinner`)
- **Profile** — user + student details
- **AI Assistant (Agent)** — chat on dashboard, confirmation flow

### For Wardens (`frontend/src/pages/warden/`)
- **Dashboard** — occupancy rate, students, today's attendance, pending queue, blocks occupancy, queues for complaints/outings/leaves
- **Rooms / Students / Attendance / Reports** — CRUD and reports
- **Outings / Leaves / Complaints** — approve/reject, status updates
- **Food** — manage weekly menu (7 days)
- **Settings**

---

## 3. AI Assistant

Located in `server/app/agent/` — Grok/X.AI compatible with Groq fallback. Model defaults to `qwen/qwen3-8b` at `https://api.x.ai/v1` (fallback `https://api.groq.com/openai/v1`). Configure via `GROK_API_KEY` / `XAI_API_KEY` / `AI_API_KEY`.

**Capabilities (tools in `server/app/agent/tools/`):**
- `outing` (`outing_tools.py`) — `create_outing_request`, `get_outings`
- `leave` (`leave_tools.py`) — `apply_leave`, `get_leaves`
- `complaints` (`complaints_tools.py`) — `create_complaint`, `get_complaints`
- `attendance` (`attendance_tools.py`) — `get_attendance`, `get_attendance_by_student`
- `user` (`user_tools.py`) — `get_profile`, `get_room`

**Policies (`server/app/agent/policies/`):** `safety` (prompt injection, role check), `permission` (student vs warden), `validation` (required fields), `confirmation` (Yes/No flow for writes). See `server/app/agent/orchestration/orchestration.py:11` for flow: `safety → session → pending confirmation → plan → greeting/unknown fallback → safety → confirmation → execute → verify → natural response`.

---

## 4. Technology Stack

- **Backend:** FastAPI `>=0.110.0`, SQLAlchemy `2.0`, Pydantic `2.6`, `pydantic-settings`, `python-jose[cryptography]`, `argon2-cffi`, `httpx`, `uvicorn[standard]`
- **Frontend:** React `19`, TypeScript `5.7`, Vite `8`, Tailwind `3.4`, `@tanstack/react-query` `5.64`, `react-hook-form` `7.54`, `zod` `3.24`, `axios` `1.7`, `lucide-react`, `react-router-dom` `7.1`
- **Database:** PostgreSQL `16-alpine`
- **AI:** Grok/X.AI & Groq OpenAI-compatible API
- **Infra:** Docker, nginx, supervisord, Vercel (`frontend/vercel.json`), Render

---

## 5. System Architecture

```
                ┌─────────────┐  VITE_API_URL/vite proxy  ┌────────────────────┐  DATABASE_URL ┌──────────────┐  OpenAI API ┌──────────┐
  Browser  ───► │   Frontend  │ ────────────────────────► │  Backend (FastAPI) │ ────────────► │  PostgreSQL  │             │ Grok/Groq│
 (Vercel or     │ React+Vite  │                           │  /api/v1/* /api/agent │             │   16         │ ──────────► │  LLM     │
  nginx :80)    │  nginx SPA  │ ◄── /api proxied to :8000 │  + supervisord       │             └──────────────┘             └──────────┘
                └─────────────┘                           └────────────────────┘
                                                                  │
                                                                  └──► CORS, JWT, agent orchestration
```

- **Combined Docker image** (`Dockerfile` at root): nginx (`:80`) serves `frontend/dist` and proxies `/api/`, `/health`, `/docs`, `/redoc` to `uvicorn :8000` (see `nginx.combined.conf:1`, `supervisord.conf:1`).
- Separate images: `server/Dockerfile` (python `uvicorn --host 0.0.0.0 --port ${PORT:-8000}`) and `frontend/Dockerfile` (node build → nginx with `VITE_API_URL` build-arg).

---

## 6. Project Structure

```
.
├── Dockerfile                 # Combined all-in-one (frontend + backend)
├── nginx.combined.conf        # nginx for combined image (proxy /api to :8000)
├── supervisord.conf           # runs uvicorn + nginx
├── docker-compose.yml         # db + backend + frontend (uses server/.env)
├── server/
│   ├── Dockerfile             # Backend only
│   ├── docker-compose.yml     # db only (dev)
│   ├── requirements.txt
│   ├── init_db.py             # Base.metadata.create_all
│   ├── seed_food.py
│   ├── .env                   # not committed (see §14)
│   └── app/
│       ├── agent/             # orchestration, tools/*, policies/*, prompts, state, errors, types
│       ├── core/              # config.py, security.py, llm.py, http_client.py
│       ├── db/                # base.py, database.py, session.py
│       ├── models/            # user.py, student.py, room.py, attendance.py, complaint.py, outing.py, leave.py, food_menu.py
│       ├── routers/           # auth.py, users.py, students.py, rooms.py, attendance.py, complaints.py, food_menu.py, outings.py, leave.py, agent.py
│       ├── schemas/           # auth.py, student.py, room.py, attendance.py, complaint.py, outing.py, leave.py, food_menu.py, agent.py
│       ├── services/          # auth.py, students.py, rooms.py, attendance.py, complaints.py, etc.
│       └── main.py            # FastAPI app, CORS, / and /health
└── frontend/
    ├── Dockerfile             # node build → nginx
    ├── nginx.conf             # SPA fallback try_files
    ├── vercel.json            # SPA rewrite for Vercel
    ├── vite.config.ts
    ├── .env                   # VITE_API_URL
    └── src/
        ├── api/               # client.ts (axios, baseURL=VITE_API_URL), auth.api.ts, etc. (8 modules)
        ├── components/ui/     # Button, Card, Modal, Badge, etc.
        ├── context/AuthContext.tsx
        ├── layouts/           # StudentLayout, WardenLayout
        ├── pages/             # auth/*, student/{Dashboard,Room,Attendance,Outings,Leaves,Complaints,Food,Profile,Agent}, warden/*
        ├── routes/            # AppRoutes, ProtectedRoute, RoleRoute
        └── types/
```

---

## 7. Backend Architecture

**Layers (`server/app/`):**
- **Routers** (`routers/`) — thin FastAPI endpoints, dependency-injected `current_user`
- **Services** (`services/`) — business logic, DB queries via SQLAlchemy
- **Schemas** (`schemas/`) — Pydantic request/response models
- **Models** (`models/`) — SQLAlchemy ORM tables
- **Core** (`core/config.py:6` Settings, `security.py` JWT+argon2, `llm.py` OpenAI-compatible client)
- **DB** (`db/database.py`, `db/session.py`, `db/base.py`)
- **Agent** (`agent/`) — orchestration, tools, policies, prompts, state/session

**App init (`app/main.py:10`):** `FastAPI(title=PROJECT_NAME)`, CORS from `CORS_ORIGINS`, include `api_router` at `API_V1_STR=/api/v1` and `agent_router` at `/api/agent`, health at `/` and `/health`.

---

## 8. Modules

| Module | Models | Routers | Services | Frontend Pages |
|--------|--------|---------|----------|----------------|
| **Auth** | `user.py` | `auth.py` | `auth.py` | `Login.tsx`, `Register.tsx` |
| **Users** | `user.py` | `users.py` | — | `Profile.tsx` (student) |
| **Students** | `student.py` | `students.py` | `students.py` | warden `Students.tsx` |
| **Rooms** | `room.py` | `rooms.py` | `rooms.py` | student `Room.tsx`, warden `Rooms.tsx` |
| **Attendance** | `attendance.py` | `attendance.py` | `attendance.py` | student + warden `Attendance.tsx` |
| **Complaints** | `complaint.py` | `complaints.py` | `complaints.py` | student + warden `Complaints.tsx` |
| **Outings** | `outing.py` | `outings.py` | `outings.py` | student + warden `Outings.tsx` |
| **Leaves** | `leave.py` | `leave.py` | `leave.py` | student + warden `Leaves.tsx` |
| **Food Menu** | `food_menu.py` | `food_menu.py` | `food_menu.py` | student `Food.tsx`, warden `Food.tsx` |
| **Agent** | — (tools) | `agent.py` + `agent/router.py` | `agent/service.py` | student `Agent.tsx` + `Dashboard.tsx` chat |

---

## 9. API Directory

Base: `https://hostel-management-u6o4.onrender.com` (local `http://localhost:8000`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | `{"status":"ok"}` |
| GET | `/health` | `{"status":"healthy"}` |
| GET | `/docs` | Swagger UI |
| GET | `/redoc` | ReDoc |
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login → JWT |
| GET/POST/PATCH | `/api/v1/users/*` | Users |
| GET/POST | `/api/v1/students` etc. | Students |
| GET/POST/PATCH | `/api/v1/rooms/*` | Rooms |
| GET/POST/PATCH | `/api/v1/attendance` `/api/v1/attendance/student/{id}` | Attendance |
| GET/POST/PATCH | `/api/v1/complaints` | Complaints |
| GET/POST | `/api/v1/food-menu` | Food menu |
| GET/POST/PATCH | `/api/v1/outings` | Outings |
| GET/POST/PATCH | `/api/v1/leave` | Leaves |
| POST | `/api/agent/chat` | Agent chat (`{message, session_id}`) |
| GET | `/api/agent/health` | Agent health |
| POST | `/api/v1/agent/chat` | Agent via `api_router` |

All `/api/v1/*` (except auth) require `Authorization: Bearer <JWT>` (see `frontend/src/api/client.ts:12`).

---

## 10. AI Agent Flow

`server/app/agent/orchestration/orchestration.py:11` → `orchestrate(message, session_id, user_id, role, token)`

1. **Safety** (`policies/safety.py:check_safety`) — block prompt injection, role violation
2. **Session** (`state/agent_session.py:get_session`) — load `session_id` + `pending_confirmation`
3. **Pending confirmation** — if `Yes` → `executor.execute(pending_tool, ctx)` → `verifier.verify()` → `chat_completion(RESPONSE_SYSTEM_PROMPT)` → save `data`; if `No` → cancel
4. **Plan** (`orchestration/planner.py:plan`) — LLM classifies `intent` → `tool_name` + `arguments`, `requires_confirmation`
5. **Greeting / Unknown** — `_greeting_response` or `_general_chat` via `core/llm.py:chat_completion` (OpenAI-compatible)
6. **Confirmation** — `policies/confirmation.py` + `validation.py:validate`; return human confirmation message (`create_complaint` / `create_outing_request` / `apply_leave`) with `requires_confirmation:true`
7. **Execute** (`orchestration/executor.py:execute`) — `ToolContext(user_id, role, token)` → calls `tools/*/*.py` which hit backend via `core/http_client.py`
8. **Verify** (`orchestration/verifier.py:verify`) + **Natural Response** (`_natural_response` via `RESPONSE_SYSTEM_PROMPT`)

Tools register in `server/app/agent/tools/registry.py`.

---

## 11. Database Overview

PostgreSQL 16 (`postgres:16-alpine`). Tables via `server/app/db/base.py:Base` and `init_db.py:Base.metadata.create_all`:

- **users** (`models/user.py`) — `id`, `name`, `email` (unique), `password_hash` (argon2), `role` (`student`/`warden`/`admin`), timestamps
- **students** (`models/student.py`) — `id`, `user_id` FK→users, `roll_number`, `department`, `year`, `room_id` FK→rooms, `phone`
- **rooms** (`models/room.py`) — `id`, `room_number`, `block`, `floor`, `capacity`, `occupied`, `type`
- **attendance** (`models/attendance.py`) — `id`, `student_id` FK, `date`, `status` (`PRESENT`/`ABSENT`), `marked_by`
- **complaints** (`models/complaint.py`) — `id`, `student_id`, `title`, `description`, `status` (`PENDING`/`IN_PROGRESS`/`RESOLVED`/`REJECTED`), `created_at`
- **outings** (`models/outing.py`) — `id`, `student_id`, `destination`, `outing_date`, `out_time`, `in_time`, `reason`, `status` (`PENDING`/`APPROVED`/`REJECTED`)
- **leaves** (`models/leave.py`) — `id`, `student_id`, `start_date`, `end_date`, `reason`, `status` (`PENDING`/`APPROVED`/`REJECTED`)
- **food_menus** (`models/food_menu.py`) — `id`, `day` (`MONDAY`..`SUNDAY` unique), `breakfast`, `lunch`, `snacks`, `dinner`

Volumes: `postgres_data:/var/lib/postgresql/data`.

---

## 12. Authentication & Authorization

- **Security** (`server/app/core/security.py`): `argon2` password hashing, JWT (`python-jose[cryptography]`) with `JWT_SECRET` / `SECRET_KEY` and `JWT_EXPIRES_IN=7d` (`ACCESS_TOKEN_EXPIRE_MINUTES=10080`), `core/config.py:14`.
- **Production guard** (`core/config.py:35`): `ENV=production` requires `DATABASE_URL` and non-default `JWT_SECRET`.
- **Flows:** `POST /api/v1/auth/register` → hash + create user (+ student if role=student), `POST /api/v1/auth/login` → verify + return `{access_token, token_type}`.
- **Frontend** (`frontend/src/api/client.ts:15`): axios `baseURL=VITE_API_URL`, request interceptor adds `Authorization: Bearer <token>` from `localStorage`, 401 clears token and redirects to `/login`.
- **RBAC:** `ProtectedRoute.tsx` (authenticated), `RoleRoute.tsx` (role check `student` vs `warden`), layouts `StudentLayout`/`WardenLayout`, backend `dependencies.py` guards. Agent `policies/permission.py` also enforces role per tool.

---

## 13. Local Setup

```bash
git clone https://github.com/durga67/hostel-management
cd hostel-management
# follow §14-15 below
```

Prerequisites: Python `3.11+`, Node `18+`, Docker (for postgres), Grok/X.AI or Groq key.

---

## 14. Environment Variables

**`server/.env`** (create from below — no `.env.example` committed, see `server/app/core/config.py:6`):

```env
ENV=development
DATABASE_URL=postgresql+psycopg2://postgres:123@localhost:5434/hostel_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=123
POSTGRES_DB=hostel_management
POSTGRES_PORT=5434

JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# AI — one of GROK_API_KEY / XAI_API_KEY / AI_API_KEY
GROK_API_KEY=your_grok_or_xai_key
GROK_MODEL=qwen/qwen3-8b
GROK_BASE_URL=https://api.x.ai/v1
# Groq alt: AI_API_KEY=... AI_BASE_URL=https://api.groq.com/openai/v1 AI_MODEL=qwen/qwen3-8b

HOSTEL_BACKEND_URL=http://localhost:8000
AGENT_API_PREFIX=/api/agent
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
REQUEST_TIMEOUT=30
```

**`frontend/.env`:**

```env
VITE_API_URL=http://localhost:8000
# Prod: VITE_API_URL=https://hostel-management-u6o4.onrender.com
# Combined image: VITE_API_URL="" (same-origin)
```

`VITE_API_URL` is baked at `npm run build` time (build-arg in `frontend/Dockerfile:10`).

---

## 15. Database Setup

```bash
cd server
docker-compose up -d db        # or from root: docker compose --env-file server/.env up -d db
python init_db.py              # creates tables
python seed_food.py            # seeds 7-day menu (optional)
```

`server/docker-compose.yml:1` maps `${POSTGRES_PORT:-5434}:5432`, healthcheck `pg_isready`. Data in `postgres_data` volume.

---

## 16. Docker Setup

```bash
# Root — full stack (requires server/.env)
docker compose --env-file server/.env build
docker compose --env-file server/.env up -d   # db :5434, backend :8000, frontend :3000

# Individual
docker build -t hostel-backend ./server
docker build --build-arg VITE_API_URL=http://localhost:8000 -t hostel-frontend ./frontend
# Combined all-in-one (single image for submission)
docker build -t durga67/hostel-management:latest -f Dockerfile .   # VITE_API_URL="" same-origin
docker run -p 80:80 -p 8000:8000 --env-file server/.env durga67/hostel-management
```

Images:
- `server/Dockerfile:1` — `python:3.11-slim`, `pip install -r requirements.txt`, `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`
- `frontend/Dockerfile:1` — `node:20-alpine` → `nginx:alpine`, `COPY dist /usr/share/nginx/html` + `nginx.conf` SPA `try_files`
- `Dockerfile` (root): multi-stage frontend build + `python:3.11-slim` + `nginx` + `supervisor`, copies `frontend/dist` to nginx and `server/` to `/app`, `nginx.combined.conf` proxies `/api/*` to `:8000`, `supervisord.conf` runs `uvicorn` + `nginx`.

---

## 17. Docker Hub

Public (user `durga67`, already pushed and `docker login` succeeded):

- **Combined:** `https://hub.docker.com/r/durga67/hostel-management` — `docker pull durga67/hostel-management:latest` (`:0.1.0` digest `sha256:5c006ad8`, 854MB)
- **Backend:** `https://hub.docker.com/r/durga67/hostel-backend` — `docker pull durga67/hostel-backend:latest` (`:0.1.0` digest `sha256:363e0f11`, 643MB)
- **Frontend:** `https://hub.docker.com/r/durga67/hostel-frontend` — `docker pull durga67/hostel-frontend:latest` (`:0.1.0` digest `sha256:231fa89`, 94MB, built with `VITE_API_URL=https://hostel-management-u6o4.onrender.com`; also pushed `sha256:ba317e07` with Vercel URL earlier)

Publish (already done — rerun on changes):
```bash
docker login
docker build -t durga67/hostel-backend:latest ./server && docker push durga67/hostel-backend:latest
docker build --build-arg VITE_API_URL=https://hostel-management-u6o4.onrender.com -t durga67/hostel-frontend:latest ./frontend && docker push durga67/hostel-frontend:latest
docker build -t durga67/hostel-management:latest -f Dockerfile . && docker push durga67/hostel-management:latest
```

Short Description (≤100 chars) for Hub → Settings:
- `hostel-management`: `All-in-one Hostel iOS: React+FastAPI+AI. Run: docker run -p 80:80 durga67/hostel-management` (86)
- `hostel-backend`: `FastAPI hostel backend + AI agent (Grok). docker pull durga67/hostel-backend` (74)
- `hostel-frontend`: `React hostel frontend. Live: hostel-management-srkr.vercel.app` (61)

---

## 18. Live Deployment

- **Live Application — Hostel iOS:** https://hostel-management-srkr.vercel.app/ — Vercel, SPA rewrite via `frontend/vercel.json:1` (`/(.*)` → `/index.html`), `VITE_API_URL` points to Render backend.
- **Backend:** https://hostel-management-u6o4.onrender.com (`/docs`, `/health`, `/api/v1/*`, `/api/agent/*`). Requires `ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `GROK_API_KEY`, `CORS_ORIGINS`.
- **Alternate via Docker:** any host can run `durga67/hostel-management` or `docker compose --env-file server/.env up -d`.

---

## 19. Demo Video

**Hostel iOS — Project Demo Video:** https://www.loom.com/share/bc6fa3d1502b4b48b99db8cae0779fba

Demonstrates complete student and warden workflows, including authentication, hostel operations (rooms, attendance, outings, leaves, complaints, food), AI-assisted actions, and management features.

---

## License

MIT
