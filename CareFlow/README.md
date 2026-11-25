# CareFlow – Patient Admission Management System

CareFlow is a web application that hospital staff can use to record and manage patient admissions. Staff can add, view, search, filter, edit, discharge and delete patient records. Every change is saved to a PostgreSQL database hosted on Supabase.

**Live application:** `<ADD-LIVE-URL-HERE>`

## Features

- Add a patient with validated details.
- View all patients in a responsive table (stacked cards on tablet and phone).
- Search patients by name (case-insensitive, partial match).
- Filter by ward, department and doctor. Search and all filters combine with AND logic.
- Edit an existing patient, with the form pre-filled from the saved record.
- Delete a patient after a confirmation dialog.
- Mark a patient as Discharged. Repeated discharge is rejected.
- Statistics calculated from the database: total patients, currently admitted, discharged and today's admissions.
- Validation on both the frontend and the backend, with field-specific error messages.
- Loading indicators, empty states, friendly network and server error messages, and duplicate-submit protection.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, Axios, Lucide React, React Hot Toast |
| Backend | Python, FastAPI, Pydantic v2, Pydantic Settings |
| Database | Supabase PostgreSQL through SQLAlchemy 2.0 and Psycopg 3 |
| Testing | pytest with FastAPI `TestClient` (SQLite in-memory test database) |
| Hosting | Vercel (frontend), Render (backend), Supabase (database) |

## Architecture

```
React (Vercel)  --HTTPS/JSON (Axios)-->  FastAPI (Render)  --SQLAlchemy/Psycopg-->  PostgreSQL (Supabase)
```

Data flow for a typical action, for example adding a patient:

1. The user fills in the form. `utils/validation.js` checks the input and shows field errors.
2. `services/patientApi.js` sends `POST /api/patients` with Axios.
3. FastAPI validates the body with the Pydantic schema in `schemas.py`. Invalid values return HTTP 422 with field details.
4. `routes/patients.py` creates a SQLAlchemy `Patient`, adds it to the session and commits it.
5. PostgreSQL stores the row. The response returns the saved record, including its database-generated `id`, `created_at` and `updated_at`.
6. The page reloads the list and statistics, and shows a toast.

## Folder structure

```
Dscribe/
├── README.md
├── .gitignore
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                 FastAPI app, lifespan, CORS, error handlers
│   │   ├── database.py             SQLAlchemy engine, session, get_db
│   │   ├── models.py               Patient table model
│   │   ├── schemas.py              Pydantic request and response schemas
│   │   ├── core/
│   │   │   └── config.py           Settings loaded from backend/.env
│   │   └── routes/
│   │       └── patients.py         REST endpoints and their database queries
│   └── tests/
│       ├── conftest.py             Test client with an isolated SQLite database
│       ├── test_patients.py        API tests
│       └── test_validation.py      Schema validation tests
└── frontend/
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx                 Page: header, stats, filters, table, dialogs, data loading
        ├── index.css               Swiss-style design system
        ├── components/
        │   ├── Modal.jsx
        │   ├── PatientStats.jsx
        │   ├── PatientFilters.jsx
        │   ├── PatientTable.jsx
        │   └── PatientForm.jsx
        ├── services/patientApi.js  Axios client and error messages
        └── utils/                  constants.js and validation.js
```

## Prerequisites

- Python 3.13 (the project was built and tested with 3.13)
- Node.js 20 or newer and npm
- A Supabase project with a PostgreSQL database
- Git (optional)

## Local installation

### 1. Clone the repository

```bash
git clone <your-repository-url> Dscribe
cd Dscribe
```

### 2. Configure the backend

Copy `backend/.env.example` to `backend/.env` and fill in your values (see [Environment variables](#environment-variables)).

### 3. Install and start the backend

Windows PowerShell:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

macOS, Linux or other terminals:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`. Interactive API documentation is at `http://localhost:8000/docs`. On startup the backend creates the `patients` table if it does not exist. It never drops or resets existing data.

### 4. Install and start the frontend

Copy `frontend/.env.example` to `frontend/.env.local` if you want to change the API address. Then run:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

Other frontend commands:

```bash
npm run build     # production build in frontend/dist
npm run preview   # serve the production build locally
npm run lint      # ESLint
```

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string. Use the **Session pooler** string from Supabase (Connect button). |
| `FRONTEND_URL` | Yes in production | Allowed frontend origin for CORS. Use a comma-separated list for several origins, for example `http://localhost:5173,https://your-app.vercel.app`. |
| `APP_NAME` | No | Application name shown in the API docs. Default `CareFlow`. |
| `APP_ENV` | No | Environment name. Default `development`. |
| `DEBUG` | No | Debug flag. Default `True`. |

Example:

```env
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-YOUR_REGION.pooler.supabase.com:5432/postgres"
FRONTEND_URL="http://localhost:5173"
```

### Frontend (`frontend/.env.local` locally, or Vercel environment variables)

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes in production | Base URL of the backend API, including `/api`. Local default: `http://localhost:8000/api`. |

Never put database credentials in frontend variables. Only `VITE_` variables reach the browser.

## Database setup

1. Create a Supabase project.
2. In the Supabase dashboard, click **Connect**, choose **Session pooler**, and copy the URI. Replace `[YOUR-PASSWORD]` with your database password.
3. Put the URI in `backend/.env` as `DATABASE_URL`. Use the Session pooler because it is reachable from IPv4-only networks, such as most home and office networks and Render.
4. Start the backend once. The `patients` table is created automatically, with `id`, `name`, `age`, `gender`, `ward`, `department`, `doctor`, `admission_date`, `status`, `created_at` and `updated_at`.

The connection uses `sslmode=require`, which Supabase requires.

## API endpoints

Base path: `/api`. Errors return JSON with a `detail` field. Validation errors (422) list each field.

| Method | Path | Description | Success | Errors |
| --- | --- | --- | --- | --- |
| `POST` | `/api/patients` | Create a patient | 201 + patient | 422 invalid data |
| `GET` | `/api/patients` | List patients. Query: `search`, `ward`, `department`, `doctor`. Filters combine with AND. | 200 + list | 422 invalid filter value |
| `GET` | `/api/patients/stats` | Totals: `total`, `admitted`, `discharged`, `today_admissions` | 200 | |
| `GET` | `/api/patients/{id}` | Get one patient | 200 | 404 |
| `PUT` | `/api/patients/{id}` | Update supplied fields | 200 + patient | 400 no fields, 404, 422 invalid or null values |
| `DELETE` | `/api/patients/{id}` | Permanently delete a patient | 204 | 404 |
| `PATCH` | `/api/patients/{id}/discharge` | Set status to Discharged | 200 + patient | 404, 409 already discharged |
| `GET` | `/health` | Health check | 200 | |

Allowed values:

| Field | Rules |
| --- | --- |
| `name` | Required. Letters and spaces only. Trimmed. Maximum 120 characters. |
| `age` | Required. Whole number from 0 to 120. |
| `gender` | `Male`, `Female`, `Other` |
| `ward` | `General`, `ICU`, `Private`, `Emergency` |
| `department` | `Cardiology`, `Neurology`, `Orthopedics`, `General Medicine`, `Pediatrics` |
| `doctor` | `Dr. Mehta`, `Dr. Rao`, `Dr. Sharma`, `Dr. Das` |
| `admission_date` | Required. Valid date, not later than the server's current date. |
| `status` | `Admitted` (default) or `Discharged` |

Example request:

```bash
curl -X POST http://localhost:8000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"name":"Rahul Sharma","age":45,"gender":"Male","ward":"General","department":"Cardiology","doctor":"Dr. Mehta","admission_date":"2026-11-24"}'
```

## Testing

The tests use an in-memory SQLite database through a dependency override. They never connect to Supabase. Settings are still loaded at import time, so `backend/.env` (or a `DATABASE_URL` environment variable) must exist, even though its database is not used.

```bash
cd backend
pip install -r requirements.txt
python -m pytest -q
```

Windows PowerShell with the virtual environment active:

```powershell
cd backend
.\venv\Scripts\python.exe -m pytest -q
```

Frontend build and lint:

```bash
cd frontend
npm run build
npm run lint
```

## Deployment

### 1. Supabase (database)

Create the project and copy the Session pooler URI, as described in [Database setup](#database-setup). Do not commit the URI.

### 2. Render (backend)

1. Create a **Web Service** from the GitHub repository.
2. Set **Root Directory** to `backend`.
3. Set **Runtime** to Python 3 (version 3.13).
4. Set **Build Command** to `pip install -r requirements.txt`.
5. Set **Start Command** to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
6. Add environment variables:
   - `DATABASE_URL` = the Supabase Session pooler URI
   - `FRONTEND_URL` = your Vercel URL, for example `https://your-app.vercel.app`
7. Deploy. Check `https://YOUR-RENDER-APP.onrender.com/health`, which should return `{"status":"ok"}`.

### 3. Vercel (frontend)

1. Import the GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Add the environment variable `VITE_API_URL` = `https://YOUR-RENDER-APP.onrender.com/api`.
5. Deploy, then copy the Vercel URL into the Render `FRONTEND_URL` variable and redeploy the backend if the URL changed.

## Screenshots

Save each screenshot in `docs/screenshots/` using the file name shown, then replace the blank line with the image.

| Screen | File name | Image |
| --- | --- | --- |
| Dashboard (desktop) | `dashboard-desktop.png` | `<ADD-IMAGE-HERE>` |
| Add patient form | `add-patient-form.png` | `<ADD-IMAGE-HERE>` |
| Edit patient form | `edit-patient-form.png` | `<ADD-IMAGE-HERE>` |
| Search and filters | `search-and-filters.png` | `<ADD-IMAGE-HERE>` |
| Delete confirmation | `delete-confirmation.png` | `<ADD-IMAGE-HERE>` |
| Mobile view | `mobile-view.png` | `<ADD-IMAGE-HERE>` |

Once added, each image line looks like this: `![Dashboard](docs/screenshots/dashboard-desktop.png)`

## Security notes

- Credentials live only in `backend/.env` and in the hosting providers' environment settings. `.gitignore` excludes `.env` files, `venv/`, `node_modules/`, `dist/` and `__pycache__/`.
- The frontend never receives the database URL.
- All queries use SQLAlchemy's parameterized ORM methods.
- Database and unexpected server errors return generic messages. Stack traces and connection details are not shown to users.
- The application has no login, because the assignment does not require one. Anyone who can reach the deployed URL can view and change patient records. Add authentication before using real patient data.
