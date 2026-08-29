# Hostel Management System

A full-stack hostel management system with AI agent capabilities.

## Tech Stack

- **Backend**: FastAPI + PostgreSQL
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **AI Agent**: Groq API (Qwen model)

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Groq API Key

## Quick Start

### 1. Environment Setup

Copy the example env file and configure:
```bash
cp .env.example .env
```

Update `.env` with your credentials:
```env
# Database
DATABASE_URL=postgresql+psycopg2://postgres:123@localhost:5434/hostel_management

# Security
JWT_SECRET=your-secret-key-here

# AI Configuration
AI_API_KEY=your_groq_api_key
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MODEL=qwen/qwen3.8-27b

# Backend URL (for agent to connect to API)
HOSTEL_BACKEND_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 2. Database Setup

Start PostgreSQL:
```bash
docker-compose up -d postgres
```

Initialize database:
```bash
python init_db.py
```

Seed test data:
```bash
python seed_test_data.py
```

### 3. Backend Setup

Install dependencies:
```bash
pip install -r requirements.txt
```

Start the backend server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000

### 4. Frontend Setup

Navigate to frontend:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Create frontend env file:
```bash
cp .env.example .env.local
```

Update `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:8000
```

Start the frontend:
```bash
npm run dev
```

Frontend will be available at: http://localhost:5173

## Testing Backend Connectivity

Run the test script:
```bash
python test_backend.py
```

This will verify:
- Backend health endpoint
- Database connectivity
- AI API configuration

## Features

### For Students
- View room details and roommates
- Check attendance records
- Request outings
- Create and track complaints
- View food menu
- AI Assistant for hostel services

### For Wardens
- Manage students and rooms
- Approve/reject outing requests
- Handle complaints
- Manage food menu
- View attendance reports

## AI Agent

The AI agent uses Groq's Qwen model to help students with:
- Creating outing requests
- Checking attendance
- Filing complaints
- Viewing food menu
- General hostel queries

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Troubleshooting

### "All connection attempts failed" error

This means the backend is not running or not accessible:

1. Check if backend is running: `curl http://localhost:8000/health`
2. Verify `HOSTEL_BACKEND_URL` in `.env` is set to `http://localhost:8000`
3. Check logs for connection errors
4. Run `python test_backend.py` to diagnose

### Database connection errors

1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Verify database credentials
4. Try recreating the database: `python init_db.py`

### Frontend can't reach backend

1. Check CORS settings in `.env`
2. Verify `VITE_API_URL` in `frontend/.env.local`
3. Ensure backend is accessible from browser

## Project Structure

```
.
├── app/                    # Backend application
│   ├── agent/             # AI agent logic
│   ├── core/              # Core configurations
│   ├── models/            # Database models
│   ├── routers/           # API routes
│   ├── schemas/           # Pydantic schemas
│   └── services/          # Business logic
├── frontend/              # React frontend
│   └── src/
│       ├── api/          # API client
│       ├── components/   # UI components
│       ├── layouts/      # Layout components
│       ├── pages/        # Page components
│       └── routes/       # Routing
└── docker-compose.yml    # Docker configuration
```

## License

MIT
