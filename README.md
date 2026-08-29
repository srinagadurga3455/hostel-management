# Hostel Management AI Agent — FastAPI

Production-ready AI Agent that orchestrates hostel operations (attendance, complaints, outings, leave, profile) on top of existing Hostel Management backend.

## Architecture
```
Frontend → AI Agent API (FastAPI) → Grok LLM → Policies → Tool Registry → Hostel Backend APIs
```
Pipeline: Router → Service → Orchestration → Planner → Permission/Validation/Confirmation → Executor → Tool → Verifier → NL Response

## Folder Structure
```
app/
├── main.py
├── agent/
│   ├── router.py, service.py
│   ├── orchestration/{planner,executor,verifier,orchestration}.py
│   ├── policies/{permission,validation,confirmation,safety}.py
│   ├── tools/{registry, attendance, complaints, leave, outing, user}/
│   ├── state/{agent_state, agent_session}.py
│   ├── schemas/agent_chat.py
│   ├── types/{agent_types,plan_types,tool_types}.py
│   ├── prompts/agent_prompt.py
│   └── errors/agent_errors.py
├── core/{config,llm,http_client,security}.py
└── requirements.txt
```

## Installation
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill GROK_API_KEY
```

## Environment
See `.env.example`. Never commit `.env`.

## Running
```bash
uvicorn app.main:app --reload
# health
curl http://localhost:8000/health
# docs
http://localhost:8000/docs
```

## Auth
Agent forwards `Authorization: Bearer <token>` to backend. User identity from JWT (`sub`, `role`). Never trust `student_id` from LLM.

## Endpoints
- `GET /health`, `GET /`, `GET /api/agent/health`, `POST /api/agent/chat`
- Hostel backend at `/api/v1/*`:
  - `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/users/me`
  - `GET/POST /api/v1/students`, `GET/PATCH/DELETE /api/v1/students/{id}`, `PATCH /api/v1/students/{id}/room`
  - `GET/POST /api/v1/rooms`, `GET/PATCH/DELETE /api/v1/rooms/{id}`
  - `POST/GET /api/v1/attendance`, `GET /api/v1/attendance/student/{id}`, `PATCH /api/v1/attendance/{id}`
  - `POST/GET /api/v1/leaves`, `GET/PATCH /api/v1/leaves/{id}`, `PATCH /api/v1/leaves/{id}/approve|reject|cancel`
  - `POST/GET /api/v1/outings`, `GET /api/v1/outings/{id}`, `PATCH /api/v1/outings/{id}/approve|reject`
  - `POST/GET /api/v1/complaints`, `GET/PATCH /api/v1/complaints/{id}`
  - `POST/GET /api/v1/food-menu`, `GET/PATCH/DELETE /api/v1/food-menu/{id}`

Example:
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"student1@hostel.com","password":"Student@123"}' | jq -r .token)
curl -X POST http://localhost:8000/api/agent/chat -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"message":"What is my attendance?"}'
```

## Adding a New Tool
1. Create `app/agent/tools/<domain>/<tool>.py` with `async def my_tool(args, ctx)`
2. `register("my_tool", "...", my_tool)`
3. Add permission in `policies/permission.py`
4. Add validation in `policies/validation.py`
5. LLM will auto-select via planner prompt

## Leave Workflow
- Student `POST /api/v1/leaves` with `startDate`, `endDate`, `reason` → `PENDING`
- Warden `PATCH /api/v1/leaves/{id}/approve|reject`, Student `PATCH /cancel` (PENDING only)
- Validations: `endDate>=startDate`, overlapping `PENDING/APPROVED` → `409`, status transitions enforced
- Agent: `Apply leave from Sep 1 to Sep 3` → confirmation → `apply_leave` tool → backend

## Testing
```bash
pytest -q
# 15 tests: health, auth, students, rooms, leave, agent
```

## Database
```bash
# Auto-migrate via Base.metadata.create_all (dev)
# Tables: users, students, rooms, attendance, complaints, food_menus, outings, leaves
# Production: set ENV=production and DATABASE_URL explicitly (dev fallback isolated)
```

## Security
- No `eval`, only registry dispatch
- Permission matrix enforced independent of LLM
- Safety blocks prompt injection
- No API key logging
- CORS via `CORS_ORIGINS` env (production must not use `*` with credentials)
