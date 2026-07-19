# 🚑 RescueLens AI

AI-powered emergency image triage and coordination engine for faster disaster response.

![React](https://img.shields.io/badge/React-19-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green)
![Supabase](https://img.shields.io/badge/Supabase-Database-success)
![Gemini](https://img.shields.io/badge/Gemini-AI-orange)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🚀 Project Status

✅ **Completed for the NxtWave Idea2Impact Hackathon 2026**

RescueLens AI is a fully functional emergency reporting and operations center platform designed to assist disaster management teams through intelligent image analysis, automated incident scoring, and role-based coordination.

---

## 📌 Demo Configuration

For demonstration and testing purposes:
- **Email confirmation is disabled** in Supabase Auth to streamline instant registration and sign-in.
- In production, email verification can be enabled by configuring a custom SMTP provider in your Supabase Auth dashboard.
- **First Admin Account Creation**: Register an account through the app, then run this SQL statement in the Supabase SQL editor to bootstrap admin status:
  ```sql
  update public.user_profiles set role = 'admin' where email = 'your-email@example.com';
  ```

---

## 🤖 AI Capabilities

RescueLens AI leverages Google's Gemini Vision models to automatically extract structured incident metadata directly from disaster photos.

The AI triage pipeline performs:
- **Disaster Scene Understanding**: Identifies class categories (e.g. fire, road accident, flood, building collapse).
- **Hazard Spotting**: Detects individual critical signals (e.g. presence of fire, smoke, water, structural integrity damage, trapped/injured individuals).
- **Severity Estimation**: Evaluates and reports hazard threat levels.
- **Damage Assessment**: Determines priority scores (0 to 100) using a deterministic backend risk engine.
- **Timeline Generation**: Records real-time triage processing history.
- **Operational Recommendation**: Suggests corresponding responder teams and equipment deployments (SCBA gear, boats, concrete saws, jaws of life).

---

## ✨ Features

### Authentication & Profiles
- **Supabase Auth Integration**: Secure email/password login, password recovery, and token validation.
- **Self-Healing Profile Creation**: Database trigger and backend validation automatically provision user profile rows, self-healing legacy accounts if profile mismatches are encountered.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions matching Viewer, Responder, and Admin workflows.

### Citizen / Viewer Portal
- **Report Emergency**: Upload disaster photos for instant analysis.
- **My History**: Track previous reports in a personalized list. Other users' reports are securely hidden from the citizen.
- **Interactive Reports**: Download authenticated PDF reports containing timeline events and contributing factors.

### Responder Dashboard
- **Emergency Ops Queue**: A real-time dispatch list detailing Type, Severity, Priority, Location, and Reported Date.
- **Active Operations Panel**: Tracks dispatches for Fire, Medical, Road Accident, and Flood dispatches.
- **Action Workflow**: Interactive *Accept*, *Dispatch*, and *Resolve* transitions backed by persistent Client-Side tracking state.
- **Distribution Analytics**: Pie charts and Area charts showing incident severity, categories, and triage frequency.
- **Case Profile Drawer**: View uploaded photos, AI summary metrics, and recommended equipment.

### Administrative Control Center
- **User Registers**: List registered profiles, last login times, and created dates.
- **Role Administration**: Promote or demote users directly from the user registry table.
- **Incident Inventory Audit**: Audit and delete incident records from the system.
- **System Settings**: Route active LLM models (e.g., Gemini 3.5 Flash) and monitor CPU/Database latency metrics.

---

## 🏗️ System Architecture

```text
       Users (Citizen, Responder, Admin)
                       │
                       ▼
            React + Vite (Frontend)
                       │
                     HTTPS
                       ▼
                FastAPI Backend
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
   Gemini AI   Supabase DB & RLS   Supabase Storage
```

---

## 💻 Tech Stack

- **Frontend**: React, Vite, Recharts, Lucide Icons, Tailwind CSS, Vanilla CSS.
- **Backend**: FastAPI, Python, Pydantic, Uvicorn, httpx.
- **Database & Storage**: Supabase PostgreSQL, Supabase Auth, Supabase Storage.
- **Artificial Intelligence**: Google GenAI SDK (Gemini Vision Model API).
- **Deployment**: Vercel (Frontend), Render (Backend).

---

## 🗄️ Database Schema

The database uses PostgreSQL schemas with the following components:
- **`user_profiles`**: Linked to `auth.users`, stores user names, metadata, emails, and active system roles.
- **`incidents`**: Stores image links, priority scores, severity levels, recommended teams, and timeline records. Includes `user_id` to establish granular report ownership.
- **`detections`**: Tracks specific threat flags (e.g., fire, smoke, trapped, injured).
- **`schema_info`**: Database view auditing triggers and table policies for the backend.

---

## 🛠️ Development Improvements

The project has been hardened with several production enhancements:
- **Automatic Database Schema Validation**: Startup validation checks confirm required columns exist, preventing runtime crashes.
- **Robust AI Response Containment**: A production-grade JSON parser parses raw outputs, extracts JSON objects from conversational text preambles, and retries the Gemini API once using a stricter prompt structure if parsing or validation fails.
- **API Error Handling**: Catches parsing, connection, and auth failures, transforming them into clean 502/403 status returns instead of leaving unhandled thread exceptions.
- **Supabase Row-Level Security (RLS)**: Enforces policies on the backend database so that Viewers can only select or write their own reports.

---

## ⚙️ Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Supabase Account

### 1. Database Setup
1. Run `docs/supabase_schema.sql` in the **Supabase SQL Editor**.
2. Run the migrations under `docs/migrations/` sequentially:
   - `001_add_incident_timeline.sql`
   - `002_add_user_profiles.sql`
   - `003_add_incident_user_relationship.sql`
3. Create a public storage bucket named `incident-images`.
4. In the SQL Editor, run:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

### 2. Backend Installation
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Unix: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in: GEMINI_API_KEY, SUPABASE_URL, and SUPABASE_SERVICE_KEY (service role)
uvicorn app.main:app --reload --port 8000
```
API docs are available at `http://localhost:8000/docs`.

### 3. Frontend Installation
```bash
cd frontend
npm install
cp .env.example .env
# Fill in: VITE_API_URL, VITE_SUPABASE_URL, and VITE_SUPABASE_ANON_KEY
npm run dev
```
Open `http://localhost:5173`.

---

## ☁️ Deployment

- **Frontend**: Deploy `frontend/` to **Vercel** (Vite framework preset). Set the same environment variables as your local `.env`.
- **Backend**: Deploy `backend/` to **Render** Web Service:
  - **Build Command**: `pip install -r requirements.txt`
  - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Set the matching environment variables.

---

## 🔒 Security
- **JWT Session Verification**: Access tokens are validated against Supabase Auth on every request.
- **Granular API Guarding**: Router endpoints use dependencies to check user permissions:
  - `CAN_ANALYZE`: Opens report submission.
  - `CAN_VIEW_ALL_INCIDENTS` & `CAN_MANAGE_INCIDENTS`: Grants responders and admins queue dispatches.
  - `CAN_MANAGE_USERS` & `CAN_MANAGE_ROLES`: Restricts system settings and user roles to admins only.

---

## 🚀 Future Enhancements
- **Live GIS Integration**: Map and coordinate locations on geospatial grids.
- **Multi-channel Notifications**: SMS dispatch warnings and mobile push notifications for responder networks.
- **Offline Sync**: Allow citizens to save incident details locally and sync automatically when internet is restored.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
