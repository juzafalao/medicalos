# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MedicalOS is a multi-tenant SaaS platform for Brazilian medical clinic management. It handles scheduling, electronic health records, WhatsApp automation, and financial reporting, with tenant isolation enforced via PostgreSQL Row-Level Security.

## Commands

### Backend (NestJS — `backend/`)
```bash
npm run start:dev     # Watch mode dev server (port 3001)
npm run build         # Compile TypeScript to dist/
npm run test          # Jest unit tests
npm run test:watch    # Jest in watch mode
npm run test:cov      # Coverage report
npm run test:e2e      # End-to-end tests
npm run lint          # ESLint with auto-fix
npm run format        # Prettier formatting
```

### Frontend (Next.js — `frontend/`)
```bash
npm run dev           # Dev server (port 3000)
npm run build         # Production build
npm run type-check    # TypeScript check without emit
npm run lint          # ESLint check
```

### Full Stack (Docker)
```bash
docker-compose up -d   # Start all services: PostgreSQL 16, Redis 7, backend, frontend
docker-compose down    # Teardown
```

Swagger UI is available at `http://localhost:3001/api/docs` (non-production only).

## Architecture

### Multi-Tenancy
Tenant isolation is implemented at the database level using PostgreSQL RLS. `DatabaseService` (`backend/src/config/database.service.ts`) calls `SET LOCAL app.tenant_id = $1` before every query. The `tenant_id` is extracted from the JWT payload, so it flows transparently through all modules. Never bypass this by querying the database directly outside of `DatabaseService`.

### Backend Module Structure (`backend/src/modules/`)
Each feature is a self-contained NestJS module:
- `auth/` — JWT + Passport (local & JWT strategies), refresh token rotation
- `tenants/` — Clinic configuration, WhatsApp provider setup, LGPD consent
- `patients/` — CRUD, pre-registration via tokenized public link
- `appointments/` — Scheduling with conflict detection and status machine
- `medical-records/` — EHR with CID-10 codes and S3 document attachments
- `whatsapp/` — Bull queue-based async messaging (Twilio/Blip/MessageBird)
- `financial/` — Cash flow, physician payout calculation, monthly reports
- `dashboard/` — KPI aggregation across all modules
- `rooms/` — Room availability and blocking

Guards live in `common/guards/`: `JwtAuthGuard` + `RolesGuard`. Four roles: `admin`, `doctor`, `receptionist`, `financial`.

### Frontend Structure (`frontend/src/`)
- `app/dashboard/` — Protected area; all routes here require authentication
- `app/pre-cadastro/[token]/` — Public patient self-registration
- `lib/api.ts` — Axios instance with automatic JWT refresh on 401
- `lib/store/auth.store.ts` — Zustand store: current user, token, `tenant_slug`
- `components/providers/` — React Query + Zustand wiring

State split: Zustand owns auth state; React Query owns all server data (patients, appointments, etc.).

### Database
SQL migration files live in `supabase/` and must be applied in order:
1. `001_schema.sql` — 18 tables, RLS policies, indices
2. `002_seed.sql` — message templates, financial categories, defaults
3. `003_cid10_and_improvements.sql` — CID-10 codes, DB views, helper functions

### WhatsApp Automation
Bull queues (Redis-backed) send async messages. `AutomationScheduler` runs cron jobs for appointment confirmations, reminders, and follow-ups. If Redis is unavailable locally, comment out `BullModule` in `app.module.ts` — all other features will still work.

## Environment Setup

Copy `backend/.env.example` to `backend/.env`. Required variables:
- `DB_*` — PostgreSQL connection (provided by Docker Compose defaults for local dev)
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — minimum 32 characters each
- `REDIS_HOST` / `REDIS_PORT`
- `TWILIO_ACCOUNT_SID` — only needed for WhatsApp features
- `AWS_*` — only needed for document/attachment uploads
- `FRONTEND_URL` — used for CORS

Frontend: create `frontend/.env.local` with:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## First-Time Clinic Registration

The first user must register via POST (no existing admin required):
```
POST /api/v1/auth/register
{ "clinic_name", "slug", "email", "full_name", "password", "phone" }
```

## Known Gaps (see `GAPS.md`)

- `frontend/src/lib/api.ts` should be replaced with `api-complete.ts`
- `frontend/src/app/globals.css` is missing Tailwind directives
- Some module DTOs need splitting into dedicated files
- `/dashboard` middleware protection needs completion
