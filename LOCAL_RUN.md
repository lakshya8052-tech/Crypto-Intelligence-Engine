# Local Run Guide

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Backend health check:

```text
http://127.0.0.1:8000/health
```

## Frontend

Use `frontend/.env.local` for local development:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

Then start the app:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The backend CORS config allows both `http://localhost:3000` and `http://127.0.0.1:3000`.
## Test Message