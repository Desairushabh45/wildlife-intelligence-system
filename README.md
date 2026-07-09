# Wildlife Population Intelligence System — Backend (Week 1)

## What's here
- `docker-compose.yml` — Postgres+PostGIS and MongoDB, plus the backend service
- `backend/app/models/models.py` — the six-table schema (Users, MonitoringSites, Surveys, Observations, Detections)
- `backend/app/core/` — DB connection, config, JWT/password security, role-based auth dependency
- `backend/app/routers/` — auth (register/login/me), monitoring sites CRUD, surveys CRUD

## Run it
1. `cp backend/.env.example backend/.env` and set a real `SECRET_KEY`
2. Make sure Docker Desktop is running
3. From the project root: `docker-compose up --build`
4. Open http://localhost:8000/docs

## Test the flow in Swagger UI
1. `POST /api/auth/register` with `role: "administrator"`
2. `POST /api/auth/login` → copy `access_token`
3. Click **Authorize** (top right), paste the token
4. `POST /api/sites` with a name + latitude/longitude
5. `POST /api/surveys` with that site's `id` + a `survey_date`
6. `GET /api/sites` and `GET /api/surveys` to confirm
