# SafariQuest Backend

Django + Django REST Framework backend for SafariQuest. Implements Part 0 of the
ops manual: sign in/out with HttpOnly-cookie JWTs and role-based redirect, plus
first-time platform setup (destinations, safaris, pricing seasons, guides, staff
invites).

## Setup

```bash
cd backend
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt
cp .env.example .env
.venv/Scripts/python manage.py migrate
.venv/Scripts/python manage.py createsuperuser
.venv/Scripts/python manage.py runserver
```

## Endpoints

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/login/` | Public |
| POST | `/api/auth/logout/` | Authenticated |
| POST | `/api/users/` | Admin |
| GET | `/api/destinations/` | Public |
| POST/PATCH/DELETE | `/api/destinations/` | Admin |
| GET | `/api/safaris/` | Public |
| POST/PATCH/DELETE | `/api/safaris/` | Admin |
| GET/POST/PATCH/DELETE | `/api/pricing/seasons/` | Admin |
| GET/POST/PATCH/DELETE | `/api/guides/` | Admin |

## Running tests

```bash
.venv/Scripts/python manage.py test
```

## Not yet implemented

- Google OAuth login
- Bookings, inquiries, invoicing, complaints (later ops-manual parts)
- Frontend wiring (see `website/`)
