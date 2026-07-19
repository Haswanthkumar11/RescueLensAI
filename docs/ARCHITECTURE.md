# Architecture

```
Image Upload
     │
     ▼
Supabase Storage  ───────────►  public image_url
     │
     ▼
Gemini 2.5 Flash (Vision)   →  strict JSON scene analysis
     │
     ▼
Risk Scoring Engine (deterministic, own code, not the LLM)
     │
     ▼
Response Recommendation Engine (rule-based routing)
     │
     ▼
Incident Report Generator (DB row + PDF)
     │
     ▼
Dashboard & Analytics (React + Recharts)
```

## Why this shape

The brief's own improvement note is baked in directly: the backend is split into
independent modules (`ai/gemini_service.py`, `risk_engine.py`, `supabase_client.py`,
`pdf_generator.py`) rather than one monolithic "call Gemini and show the result"
endpoint. Gemini only ever answers "what is in this image" — it never decides
urgency. That decision is made by `risk_engine.py`, using fixed, auditable point
weights (see `WEIGHTS` in that file), so a judge or a responder can see exactly why
a photo scored 82/100 instead of trusting an opaque model output.

## Request flow for `POST /analyze`

1. Image bytes arrive as multipart form data.
2. `supabase_client.upload_image` stores the raw file first, so a record exists
   even if the AI call fails downstream.
3. `gemini_service.analyze_image` sends the image + a strict JSON-only prompt to
   Gemini (model configurable via `GEMINI_MODEL`, default `gemini-3.5-flash`) and
   validates the response against the `GeminiAnalysis`
   Pydantic schema — malformed output is rejected rather than silently passed on.
4. `risk_engine.calculate_risk` converts the validated detections into a score and
   priority band; `recommend_team` applies simple rule-based routing.
5. `supabase_client.save_incident` writes one `incidents` row and one `detections`
   row.
6. The full `AnalyzeResponse` is returned to the frontend in a single round trip.

## Data model

See `docs/supabase_schema.sql` for the exact `incidents` / `detections` tables.

## Authentication

```
React Frontend
      │
      │  email/password, verification, forgot/reset password
      ▼
Supabase Auth  ──────────► auth.users
      │                        │
      │ access token           │ trigger: on_auth_user_created
      │ (JWT)                  ▼
      │                 public.user_profiles (role: admin | responder | viewer)
      │
      ▼
FastAPI Backend
  every protected route: Authorization: Bearer <token>
      │
      ▼
app.services.auth.get_current_user
  1. supabase.auth.get_user(token)   -> validates the JWT against Supabase Auth
  2. select * from user_profiles     -> loads the caller's role
      │
      ▼
app.services.auth.require_role(*roles)
  403s the request if the caller's role isn't in the allowed set
```

**Why validate on the backend instead of trusting the frontend:** the frontend
hides UI it shouldn't show (e.g. the Upload page for Viewers), but that's only
UX polish — the actual enforcement is server-side. Every write/read route
carries `Depends(get_current_user)` or `Depends(require_role(...))`, so a
Viewer calling `POST /analyze` directly with curl still gets a 403, regardless
of what the frontend does or doesn't render.

**Why a `user_profiles` table instead of storing role in the JWT:** Supabase
Auth's JWT is issued at sign-in and doesn't automatically refresh mid-session
when you change a claim, which would make role promotions/demotions take up to
a session lifetime to apply. A separate table the backend queries on every
request means a role change by an admin takes effect on the *next* request,
not the next login.

**Why every new signup defaults to `viewer`:** least-privilege by default.
The first admin is promoted with one manual SQL statement (see README); from
then on, admins promote other users through `PATCH /profile/users/{id}/role`.

**Three layers against a missing profile row.** An authenticated user with no
matching `user_profiles` row (which surfaces as `403 No profile found`) can
only happen if the row was never created. Three independent layers prevent
this from being a recurring problem:
1. The `on_auth_user_created` trigger creates a row the instant anyone signs up.
2. The backfill statement in `002_add_user_profiles.sql` (idempotent, safe to
   re-run) covers any account that existed before the trigger did.
3. `get_current_user` itself self-heals: if it ever sees an authenticated user
   with no profile, it creates one on the spot via an idempotent `upsert`
   (safe under concurrent requests) rather than permanently 403-ing that
   account.

**Startup validation.** `app/services/startup_checks.py` runs at process boot
(via FastAPI's `lifespan`) and queries the exact tables/columns the backend
depends on. If anything is missing, the process refuses to start and logs
exactly which migration file to run — this is deliberate: a schema mismatch
should be a loud, immediate, five-second-to-diagnose failure at startup, not a
confusing 500 the first time some user hits the affected endpoint.
