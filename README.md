# Tabibak (طبيبك) — Your Doctor

Medical appointment booking SaaS for Algeria.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript + Tailwind CSS + Shadcn/ui |
| Backend | Python FastAPI (async) |
| Database | PostgreSQL (Neon) |
| ORM | SQLAlchemy 2.0 + Alembic |
| Auth | JWT (python-jose + passlib) |

## Project Structure

```
tabibi/
├── apps/
│   ├── backend/     # FastAPI API server
│   └── frontend/    # React SPA
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ (or use Docker)

### Backend Setup

```bash
cd apps/backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt

# Copy env file and configure
copy .env.example .env

# Run migrations
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd apps/frontend
npm install
npm run dev
```

### Using Docker (recommended for local dev)

```bash
docker-compose up -d postgres
# Then start backend and frontend manually for hot-reload
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## License

Private — All rights reserved.
