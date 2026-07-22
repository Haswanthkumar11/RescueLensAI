# 🚑 RescueLens AI

> **AI-Powered Emergency Image Triage & Operations Coordination Engine for Faster Disaster Response**

![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google_Gemini-3.5_Flash-8E75B2?logo=google&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![Render](https://img.shields.io/badge/Render-Backend-46E3B7?logo=render&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-Frontend-000000?logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📌 Project Overview

**RescueLens AI** is an intelligent disaster triage and emergency operations management platform designed to accelerate emergency response during critical disaster scenarios. 

When disasters strike—floods, fires, structural collapses, or severe traffic accidents—first responders face overwhelming numbers of unverified emergency reports. RescueLens AI bridges the gap between citizens on the scene and emergency dispatchers by combining **Google Gemini Multimodal AI** with a **deterministic, auditable risk scoring engine**. 

---

## 💡 Why We Built RescueLens

In emergency response, **seconds cost lives**. 

During high-stress disaster events:
- **Dispatchers receive hundreds of raw photos and vague calls**, making manual prioritization nearly impossible.
- **Critical hazards (e.g., trapped victims, active fires, gas leaks) are overlooked** due to reporting clutter.
- **Resource deployment is delayed** because specialized teams (USAR, EMS, Fire Brigades) lack immediate scene context.

We built RescueLens AI to give emergency command centers instant, visual-driven situational awareness. Citizens take a single photo; RescueLens AI instantly analyzes hazards, calculates an auditable risk score, recommends the exact response team needed, and generates official government-grade PDF incident assessments.

---

## ✨ Key Features

### 🔐 Authentication & Self-Healing Profiles
- **Supabase Auth Integration**: Secure email/password authentication with JWT session token validation on every backend call.
- **Self-Healing User Profiles**: Database trigger provisions user profile rows on signup, while backend middleware self-heals pre-existing legacy accounts seamlessly.
- **Role-Based Access Control (RBAC)**: Enforces three distinct privilege tiers: **Viewer** (Citizen), **Responder**, and **Admin**.

### 📱 Citizen / Viewer Portal
- **Instant Emergency Reporting**: Upload disaster photos for immediate AI analysis.
- **Personal Report History**: View past reports in a personalized list. Citizens can only access their own reports via backend RLS filtering.
- **Government-Grade PDF Reports**: Generate and download multi-page PDF reports complete with QR verification codes and real-time processing timelines.

### 🚒 Responder Operations Dashboard
- **Live Emergency Queue**: Filter dispatches by Priority (**Critical**, **High**, **Medium**, **Low**), Hazard Type, and Timestamp.
- **Active Operations Panel**: Track dispatches for Fire, USAR, EMS, and Flood teams with interactive status transitions (*Accept*, *Dispatch*, *Resolve*).
- **Incident Analytics**: Visual distribution charts for incident severity and category frequency built with Recharts.
- **Case Profile Drawer**: View high-resolution scene photos, AI summary metrics, and recommended responder gear.

### ⚙️ Administrative Control Center
- **User Registry**: Audit registered profiles, email status, creation dates, and last login timestamps.
- **Role Administration**: Promote or demote users across system roles (`admin`, `responder`, `viewer`) in real time.
- **Incident Inventory Audit**: Inspect detailed incident records and purge resolved or invalid reports.
- **System Settings & Health**: Monitor backend database connection integrity and active LLM configuration.

---

## 🤖 AI Integration (Google Gemini)

RescueLens AI uses Google's `google-genai` SDK and the **Gemini Vision** multimodal API to extract structured hazard metadata directly from disaster imagery.

### Triage Pipeline Breakdown:
1. **Multimodal Scene Understanding**: Identifies disaster categories (fire, flood, collapsed building, vehicle collision).
2. **Hazard Detection Flags**: Detects individual critical signals:
   - `people_detected` (count)
   - `children`, `elderly`, `injured`, `trapped` (booleans)
   - `fire`, `flood`, `smoke`, `collapsed_building` (booleans)
3. **Severity & Summary Generation**: Produces a concise, actionable executive summary for dispatchers.
4. **Resilient JSON Parsing**: A production-grade parser cleans markdown code fences, extracts JSON objects, and retries the Gemini API with a stricter system instruction if validation fails.

---

## 🏗️ System Architecture

```text
               ┌──────────────────────────────────────────────┐
               │    Citizens, Responders & Administrators     │
               └──────────────────────┬───────────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   React + Vite Frontend   │
                        │      (Vercel Hosted)      │
                        └─────────────┬─────────────┘
                                      │  HTTPS / REST / JWT
                                      ▼
                        ┌───────────────────────────┐
                        │      FastAPI Backend      │
                        │      (Render Hosted)      │
                        └──────┬──────────┬─────────┘
                               │          │
         ┌─────────────────────┘          └─────────────────────┐
         ▼                                                      ▼
┌─────────────────┐                                   ┌───────────────────┐
│ Google Gemini   │                                   │ Supabase Cloud    │
│ Multimodal AI   │                                   │ ├─ Auth (JWT)     │
│ (GenAI SDK)     │                                   │ ├─ Postgres DB    │
└─────────────────┘                                   │ └─ Storage Bucket │
                                                      └───────────────────┘
```

### Request & Data Flow:
1. User uploads a disaster photo via the React frontend.
2. The request passes through `require_permission()` RBAC guardrails in FastAPI.
3. The image is saved to Supabase Storage, and raw bytes are analyzed by Gemini Vision.
4. Gemini's structured output feeds into our deterministic Python Risk Engine.
5. The combined result, timeline events, and hazard flags are saved atomically to Supabase PostgreSQL.
6. The frontend displays the interactive result page and allows downloading an authenticated PDF report.

---

## 🛠️ Complete Technology Stack

| Layer | Technology | Usage |
| :--- | :--- | :--- |
| **Frontend** | **React 19**, **Vite** | Modern, fast single-page application framework |
| **UI & Styling** | **Tailwind CSS**, **Lucide React**, **Recharts** | Responsive layouts, icons, and analytics charts |
| **Backend API** | **FastAPI**, **Uvicorn**, **Pydantic v2** | Async RESTful API service and data validation |
| **Artificial Intelligence** | **Google GenAI SDK** (`gemini-3.5-flash`) | Multimodal vision understanding & hazard extraction |
| **PDF Generation** | **ReportLab**, **qrcode** | Multi-page government-style PDF report generator |
| **Database & Auth** | **Supabase PostgreSQL**, **Supabase Auth** | Relational data, RLS security policies, and user JWTs |
| **Storage** | **Supabase Storage** | Cloud image storage bucket (`incident-images`) |
| **Hosting** | **Vercel** (Frontend), **Render** (Backend) | Production cloud deployment |

---

## 📂 Project Folder Structure

```text
RescueLens AI/
├── backend/
│   ├── app/
│   │   ├── database/          # Supabase client & Pydantic BaseSettings
│   │   ├── models/            # Pydantic schemas, Roles enum, Permissions matrix
│   │   ├── routers/           # FastAPI endpoints (/analyze, /history, /incident, /profile, /upload)
│   │   ├── services/
│   │   │   ├── ai/            # Gemini client, retry logic, and prompts
│   │   │   ├── auth.py        # JWT validation & self-healing user profiles
│   │   │   ├── pdf_generator.py # ReportLab Platypus PDF renderer
│   │   │   ├── risk_engine.py # Deterministic risk scoring math & team recommendations
│   │   │   ├── startup_checks.py # DB schema validation on startup
│   │   │   ├── supabase_client.py # Data access layer for Postgres tables & Storage
│   │   │   ├── timeline.py    # Wall-clock & performance timeline builder
│   │   │   └── validation.py  # Upload image size & MIME type validation
│   │   └── main.py            # FastAPI entrypoint & CORS middleware
│   ├── .env.example           # Environment variable template for backend
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, Footer, IncidentCard, RiskMeter, ProtectedRoute, etc.
│   │   ├── context/           # AuthContext for Supabase session tracking
│   │   ├── pages/             # Landing, Upload, Result, History, Dashboards, Profile, Auth pages
│   │   ├── services/          # Axios API interceptors & Supabase client wrapper
│   │   ├── constants/         # Roles & Permissions definitions
│   │   └── App.jsx            # Main React Router configuration
│   ├── .env.example           # Environment variable template for frontend
│   └── package.json           # Frontend dependencies & Vite scripts
└── docs/
    ├── ARCHITECTURE.md        # Deep-dive architecture notes
    ├── supabase_schema.sql    # Base PostgreSQL schema
    └── migrations/            # Additive SQL migrations
```

---

## ⚙️ Installation & Local Setup

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**
- **Supabase Account** with a project created
- **Google Gemini API Key**

---

### 1. Database Setup (Supabase)
1. Open the **SQL Editor** in your Supabase Dashboard.
2. Execute `docs/supabase_schema.sql`.
3. Sequentially execute the SQL migrations in `docs/migrations/`:
   - `001_add_incident_timeline.sql`
   - `002_add_user_profiles.sql`
   - `003_add_incident_user_relationship.sql`
4. In Supabase Storage, create a public bucket named **`incident-images`**.
5. Reload Schema cache in Supabase SQL Editor:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

---

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

Configure `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_BUCKET=incident-images
FRONTEND_ORIGIN=http://localhost:5173
ENVIRONMENT=development
```

Start backend development server:
```bash
uvicorn app.main:app --reload --port 8000
```
Interactive API documentation is available at `http://localhost:8000/docs`.

---

### 3. Frontend Setup
```bash
cd frontend

# Install npm dependencies
npm install

# Create environment file
cp .env.example .env
```

Configure `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start frontend development server:
```bash
npm run dev
```
Access the web application at `http://localhost:5173`.

---

## ⚡ API Overview

| Method | Endpoint | Description | Access Permission |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Uptime health check probe | Public |
| `POST` | `/analyze` | End-to-end image upload, AI analysis, risk scoring & DB save | `can_analyze` |
| `POST` | `/upload` | Direct storage upload endpoint | `can_analyze` |
| `GET` | `/history` | Fetch incident history list (filtered by user/role) | `can_view_history` |
| `GET` | `/incident/{id}` | Fetch detailed incident record & detections | Authenticated |
| `DELETE` | `/incident/{id}` | Remove an incident record | `can_manage_roles` |
| `GET` | `/incident/{id}/report.pdf` | Build & stream official PDF assessment report | Authenticated |
| `GET` | `/profile/me` | Fetch authenticated user's profile | Authenticated |
| `PATCH` | `/profile/me` | Self-service profile updates | Authenticated |
| `GET` | `/profile/users` | List all user profiles | `can_manage_users` |
| `PATCH` | `/profile/users/{id}/role` | Update user system role | `can_manage_roles` |

---

## 🧠 Deterministic Risk Scoring Engine

Rather than asking the LLM to grade its own homework, RescueLens AI uses a **transparent, rule-based risk engine** to calculate the priority score (0–100):

```python
WEIGHTS = {
    "trapped": 30,
    "fire": 25,
    "collapsed_building": 25,
    "flood": 20,
    "injured": 20,
    "children": 20,
    "elderly": 15,
    "smoke": 15,
}
```

- **People Baseline**: Adds `+2` points per person present (capped at +10).
- **Priority Classification Bands**:
  - `0 - 30`: **Low Priority**
  - `31 - 60`: **Medium Priority**
  - `61 - 80`: **High Priority**
  - `81 - 100`: **Critical Priority**
- **Responder Routing Logic**:
  - `trapped` / `collapsed_building` → **Search & Rescue (USAR)**
  - `fire` / `smoke` → **Fire Brigade**
  - `flood` → **Flood Rescue Team**
  - `injured` → **Medical Emergency (EMS)**

---

## ☁️ Deployment Guide

### Backend (Render Web Service)
1. Connect repository to Render.
2. Environment: `Python 3`.
3. Build Command: `pip install -r requirements.txt`.
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Add environment variables: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `FRONTEND_ORIGIN`.

### Frontend (Vercel)
1. Import repository into Vercel dashboard.
2. Framework Preset: `Vite`.
3. Add environment variables: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

---

## 🔮 Future Enhancements
- 🗺️ **Interactive GIS Spatial Mapping**: Real-time map pins clustered by disaster severity.
- 📱 **Multi-Channel SMS & Push Dispatching**: Twilio SMS integration for instant responder alert notifications.
- 📶 **Offline Incident Caching**: Service worker support for queuing disaster reports offline and uploading automatically when connectivity resumes.

---

## 🤝 Contributing & License

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue.

This project is open source and available under the [MIT License](LICENSE).
