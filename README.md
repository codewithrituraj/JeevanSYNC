# JeevanSYNC — Mobile-First Healthcare Coordination Platform

[![CI Pipeline](https://github.com/riturajsanjay/JeevanSYNC/actions/workflows/ci.yml/badge.svg)](https://github.com/riturajsanjay/JeevanSYNC/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Node: v20+](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-blue.svg)](https://www.postgresql.org/)

**JeevanSYNC** is a production-grade, secure, mobile-first healthcare coordination platform designed to unify emergency response, hospital operations, diagnostics, and patient care into one synchronized ecosystem.

---

## 1. Architecture Diagram

```
                                  [ INTERNET / CLIENTS ]
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     │                                             │
            [ Mobile / Web SPA ]                         [ WhatsApp Users ]
            (React + Vite + Tailwind)                   (Meta WhatsApp Cloud API)
                     │                                             │
                     └──────────────────────┬──────────────────────┘
                                            │
                                            ▼
                              ┌───────────────────────────┐
                              │    Nginx Reverse Proxy    │
                              │  (TLS, Rate Limiting,     │
                              │   Security Headers, CSP)  │
                              └─────────────┬─────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     │                                             │
                     ▼                                             ▼
       ┌───────────────────────────┐                 ┌───────────────────────────┐
       │   Static Asset Container  │                 │    Express Backend API    │
       │    (Nginx SPA Runner)     │                 │   (Domain-Organized ESM)  │
       └───────────────────────────┘                 └─────────────┬─────────────┘
                                                                   │
       ┌───────────────────────────────────────────────────────────┼────────────────────────────────────────┐
       │                           │                               │                                        │
       ▼                           ▼                               ▼                                        ▼
┌──────────────┐          ┌─────────────────┐             ┌─────────────────┐                     ┌──────────────────┐
│   Auth &     │          │ Reception &     │             │ Emergency Coor- │                     │  MonikaCare AI   │
│   RBAC       │          │ Doctor Slots    │             │ dination (Beds  │                     │  Service Layer   │
│ (JWT + Http- │          │ (Haversine GPS, │             │  & Ambulances)  │                     │ (Gemini Free +   │
│  Only Cookie)│          │  Conflict Gate) │             │ (Live Tracker)  │                     │  Clinical Triage)│
└──────────────┘          └─────────────────┘             └─────────────────┘                     └─────────┬────────┘
       │                           │                               │                                        │
       │                           │                               │                                        ▼
       │                           │                               │                              ┌──────────────────┐
       │                           │                               │                              │ Google Gemini API│
       │                           │                               │                              │ (Free Tier LLM)  │
       │                           │                               │                              └──────────────────┘
       └───────────────────────────┼───────────────────────────────┘
                                   │
                                   ▼
                      ┌───────────────────────────┐
                      │    Prisma ORM Layer       │
                      │ (Parameterized, Enums,    │
                      │  Indexes, Foreign Keys)   │
                      └─────────────┬─────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │   PostgreSQL 16 Engine    │
                      │  (Encrypted PHI, Audit    │
                      │   Trail, Internal Network)│
                      └───────────────────────────┘
```

---

## 2. Core & Supporting Modules

1. **Reception & WhatsApp Bot** — Meta WhatsApp Cloud API integration with webhook HMAC SHA-256 signature verification, interactive button/list menus, appointment booking, and nearby hospital discovery via Haversine distance.
2. **Blood Bank** — Real-time verified blood unit availability filterable by blood group (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) and city with hospital contact integration.
3. **MonikaCare AI** — Clinical triage doctor's assistant powered by Google Gemini API (with fallback provider abstraction). Enforces strict medical guardrails: never gives a definitive diagnosis, refuses drug dosages, outputs structured urgency tiers, and triggers immediate 1-tap Ambulance dispatch hooks upon detecting red-flag symptoms.
4. **Diagnostic Test Availability & Pricing** — Search tests across multi-facility labs, compare prices, check turnaround hours, sample types, and fasting prerequisites.
5. **Emergency Coordination (Ambulance + Beds)** — 1-Tap emergency ambulance dispatch with GPS autofill + live bed availability across ICU, HDU, Emergency, General, NICU, and Pediatric wards with visual occupancy tracking.
6. **Medicine Inventory & Generic Matching** — Pharmacy inventory search that automatically suggests verified generic & brand alternatives when a medicine is out of stock.
7. **Digital Patient Referrals** — Frictionless cross-hospital transfer where a patient's case sheets, diagnosis history, and queue priority move with them.
8. **Insurance Network Lookup** — Check cashless empanelment, TPA desks, and coverage terms before hospital admission.
9. **Patient History & Audit Log** — AES-256 encrypted storage for clinical notes with strict HIPAA-style access audit logging (`AuditLog` table).
10. **Automated Reminders** — Background `node-cron` scheduler delivering medication and appointment notifications via In-App alerts and WhatsApp.

---

## 3. Quick Start & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v20+
- [Docker](https://www.docker.com/) & Docker Compose (optional for Docker setup)
- [Git](https://git-scm.com/)

### Option A: Running with Docker Compose (Recommended for Full Stack)

```bash
# 1. Clone the repository
git clone https://github.com/riturajsanjay/JeevanSYNC.git
cd JeevanSYNC

# 2. Copy environment template
cp .env.example .env

# 3. Start all services (Postgres, Express API, Vite Client, Nginx)
docker compose up -d --build

# 4. Initialize Database Schema & Seed Data
docker compose exec server npx prisma db push
docker compose exec server node prisma/seed.js

# 5. Access the application
# Frontend: http://localhost:80
# Backend API Health: http://localhost:80/health
```

### Option B: Running Locally with Node.js & SQLite

```bash
# 1. Install dependencies
cd JeevanSYNC/server && npm install
cd ../client && npm install

# 2. Seed database
cd ../server
npx prisma generate
npx prisma db push --schema=prisma/schema.sqlite.prisma
node prisma/seed.js

# 3. Start backend API server (Port 5000)
npm run dev

# 4. Start frontend Vite dev server (Port 3000)
# (In a separate terminal)
cd ../client
npm run dev
```

Visit **http://localhost:3000** in your browser.

---

## 4. Demo Login Credentials

The seed script initializes the following pre-configured user accounts with password `Password@123`:

| Role | Name | Phone / Identifier | Purpose |
|---|---|---|---|
| **Patient** | Rohan Mehra | `9811223344` | Book slots, view encrypted records, chat with Monika AI |
| **Doctor** | Dr. Ananya Sen (Cardiology) | `9876543213` | Clinical consultations, view patient queue, write records |
| **Hospital Admin** | Vikram Malhotra (Max Saket) | `9876543211` | Manage beds, blood units, medicine stock, referrals |
| **Reception Staff** | Pooja Sharma | `9876543212` | Schedule slots, handle walk-in emergency admissions |
| **Super Admin** | Dr. Rajesh Verma | `9876543210` | Full administrative oversight and audit logs |

---

## 5. Environment Variables Guide

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Express server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/jeevansync` |
| `JWT_ACCESS_SECRET` | Secret key for signing 15-min JWT access tokens | String (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret key for signing 7-day refresh tokens | String (min 32 chars) |
| `ENCRYPTION_KEY` | AES-256 key for field-level clinical notes encryption | Exact 32 bytes |
| `WHATSAPP_API_URL` | Meta Graph API endpoint | `https://graph.facebook.com/v20.0` |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business Phone ID | Provided by Meta Dashboard |
| `WHATSAPP_ACCESS_TOKEN` | System User Permanent Access Token | Provided by Meta Dashboard |
| `WHATSAPP_VERIFY_TOKEN` | Custom string for Meta Webhook challenge | `jeevansync_whatsapp_verify_token_2026` |
| `WHATSAPP_APP_SECRET` | Meta App Secret for SHA-256 HMAC verification | Provided by Meta Dashboard |
| `AI_PROVIDER` | AI provider selector (`gemini`, `groq`, `mock`) | `gemini` |
| `GEMINI_API_KEY` | Google AI Studio API key (free tier) | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini LLM model identifier | `gemini-1.5-flash` |

---

## 6. API Endpoints Summary (`/api/v1`)

### Authentication (`/api/v1/auth`)
- `POST /register` — Register user (`PATIENT`, `DOCTOR`, etc.) with validation
- `POST /login` — Authenticate and receive access token + secure httpOnly cookie
- `POST /refresh` — Rotate refresh token
- `POST /logout` — Revoke active sessions
- `GET /me` — Current authenticated user profile

### Reception & Doctors (`/api/v1/reception`)
- `GET /hospitals/nearby?lat=...&lng=...&radiusKm=...` — Haversine GPS hospital search
- `GET /hospitals` — List all empanelled hospitals
- `GET /doctors` — Search doctors by specialty/city
- `GET /doctors/:doctorId/slots?date=YYYY-MM-DD` — Real-time slot availability
- `POST /appointments/book` — Reserve consultation slot

### MonikaCare AI Triage (`/api/v1/monika-ai`)
- `POST /chat` — Triage consultation query with clinical guardrails and urgency rating
- `GET /history/:sessionId` — Retrieve multi-turn chat history

### Emergency Coordination (`/api/v1/coordination`)
- `POST /ambulance/request` — 1-Tap ambulance dispatch with GPS coordinates
- `GET /ambulance/requests` — Active fleet tracking
- `PATCH /ambulance/:id/status` — Status transition (`REQUESTED` -> `DISPATCHED` -> `EN_ROUTE` -> `COMPLETED`)
- `GET /beds` — Live ward vacancy breakdown (ICU, HDU, General, etc.)
- `POST /beds/update` — Update hospital bed vacancy

### Blood Bank (`/api/v1/bloodbank`)
- `GET /availability` — Public real-time blood unit search
- `POST /update` — Update hospital blood units (Admin/Staff only)

### Diagnostics (`/api/v1/diagnostics`)
- `GET /search` — Search lab tests with sort (price / turnaround time)
- `GET /compare?name=...` — Compare test cost across all hospital labs
- `POST /` — Add diagnostic test listing

### Medicine Inventory (`/api/v1/inventory`)
- `GET /search?query=...` — Pharmacy inventory check with automatic generic alternative suggestions
- `POST /` — Add medicine with generic alternatives mapping

### Digital Referrals (`/api/v1/referrals`)
- `POST /` — Create digital patient transfer between hospitals
- `GET /my` — View referral status and transferred case sheets

### Insurance (`/api/v1/insurance`)
- `GET /providers` — List recognized insurance carriers
- `GET /check` — Verify cashless coverage eligibility per hospital

### Encrypted Patient History (`/api/v1/patient-history`)
- `POST /` — Create clinical note with AES-256 encryption
- `GET /my-history` — Retrieve patient timeline with audit logging

### WhatsApp Cloud API (`/api/v1/whatsapp`)
- `GET /webhook` — Meta verification challenge
- `POST /webhook` — Inbound WhatsApp message receiver with SHA-256 HMAC verification
- `POST /simulate` — Local simulation test endpoint

---

## 7. Production Deployment (Self-Hosted VPS)

### Production Deployment Steps
1. Provision an Ubuntu 22.04 / 24.04 LTS VPS (2 vCPU, 4GB RAM recommended).
2. Install Docker, Docker Compose, and Certbot for SSL.
3. Configure DNS records (`A` record pointing `jeevansync.yourdomain.com` to VPS IP).
4. Obtain Let's Encrypt SSL certificate:
   ```bash
   sudo certbot certonly --standalone -d jeevansync.yourdomain.com
   ```
5. Clone repo to `/opt/jeevansync`, populate production `.env` with strong keys.
6. Launch with production compose overrides:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```
7. Run database migration and seed:
   ```bash
   docker compose exec server npx prisma migrate deploy
   ```

### Zero-Downtime Redeploy Script
```bash
#!/bin/bash
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps server client
docker system prune -f
```

---

## 8. Security Hardening & Compliance

1. **SQL Injection Prevention**: 100% parameterized queries via Prisma ORM.
2. **Access Control**: Strict Role-Based Access Control (RBAC) with default-deny on all routes.
3. **Data Protection at Rest**: Sensitive clinical notes encrypted using AES-256-GCM before DB insertion.
4. **Audit Trail**: Every read/write operation on patient medical history is logged with IP address and user ID.
5. **Token Security**: Short-lived JWTs (15 min) + httpOnly, secure, rotated refresh tokens.
6. **Network Isolation**: Postgres and internal APIs run in private Docker networks; only Nginx is exposed publicly.
7. **Rate Limiting**: Multi-tiered rate limiting on authentication (`5 req/min`), AI triage (`30 req/min`), and public endpoints.
8. **WhatsApp Signature Verification**: Inbound webhooks are validated against `X-Hub-Signature-256` HMAC.

---

## 9. Contributing & License

Contributions are welcome! Please open an issue or submit a PR.
This project is licensed under the [MIT License](LICENSE).
