# Trackify

Trackify is a desktop-first app for tracking shifts, hours, and pay.

## Features

- Work entries (create / edit / delete)
- Dashboard calendar + monthly summary
- Pay calculator (monthly + yearly) with CSV/PDF export
- Profile + settings (work defaults, profile image upload)
- Optional AI image analysis to extract shift details from a schedule screenshot

## Repo Structure

- `server/` Express API + Supabase
- `public/` Vite + React UI

## Requirements

- Node.js
- A Supabase project (Database + Auth + Storage)

## Setup

### 1) Backend (`server/`)

1. Create `server/.env` from `server/.env.example`
2. Install dependencies and start the API:

```bash
cd server
npm install
npm run dev
```

Backend runs on `http://localhost:4000` by default.

### 2) Frontend (`public/`)

1. Create `public/.env` from `public/.env.example`
2. Install dependencies and start the UI:

```bash
cd public
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Environment Variables

### Backend (`server/.env`)

| Name | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | Yes | Runtime environment (`development`/`production`) |
| `PORT` | Yes | API port (default `4000`) |
| `CORS_ORIGIN` | No | Allowed frontend origin (default `http://localhost:5173` in dev, `*` in production) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key (used to validate auth tokens) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only DB + storage access) |
| `MOCK_USER_ID` | No (dev) | Dev-only fallback user id when not using Bearer tokens |
| `OPENAI_API_KEY` | No (only for AI) | OpenAI key for `/api/ai/analyze-work-image` |
| `OPENAI_MODEL` | No | Model name (default `gpt-4o-mini`) |

### Frontend (`public/.env`)

| Name | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | No | API origin (default `http://localhost:4000`) |
| `VITE_USE_MOCK_USER` | No (dev) | If `true`, sends `x-user-id` when no session token exists |

Notes:
- The frontend API client uses `VITE_API_URL` as the origin and automatically calls `/api/...`.
- For dev mock mode, set `localStorage.trackify_mock_user_id` (or rely on `MOCK_USER_ID` server env fallback).

## Auth Flow (Development)

- Preferred: login to obtain a Supabase session `access_token`, stored in `localStorage` under `trackify_session`.
- API calls include `Authorization: Bearer <access_token>` automatically.
- Optional fallback: when `VITE_USE_MOCK_USER=true` and not logged in, the client can send `x-user-id` (dev only).

## Supabase Notes

- Storage: profile images upload to the `profile-images` bucket.
- Work defaults: apply `server/db/user_work_settings.sql` to create the `user_work_settings` table and policies.

## Commands

### Full app (root)

```bash
npm install
npm run dev
```

### Backend

```bash
cd server
npm run dev
```

### Frontend

```bash
cd public
npm run dev
```

## Deployment

### Render (single service: API + frontend)

This repo can be deployed as a single Render Web Service. The backend serves the built frontend (`public/dist`) in production.

- Root Directory: empty (repo root)
- Build Command: `npm run render-build`
- Start Command: `npm start`
- Health Check Path: `/api/health`
- Environment variables:
  - `NODE_ENV=production`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY` (only if using AI)
  - `OPENAI_MODEL` (optional)
  - `CORS_ORIGIN` (optional; defaults to `*` in production)

### Frontend (Vercel)

- Set Vercel project root directory to `public/`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables:
  - `VITE_API_URL=https://<your-backend-domain>`
  - `VITE_USE_MOCK_USER=false`

Note: `public/vercel.json` includes an SPA rewrite so React Router routes work on refresh.

### Backend (Docker-compatible hosts)

The API is a standard Node/Express server and can be deployed to any host that supports Node or Docker.

- Dockerfile: `server/Dockerfile`
- Required environment variables on the host:
  - `PORT`
  - `CORS_ORIGIN` (comma-separated list of allowed frontend origins, or `*`)
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY` (only if using AI image analysis)

### CORS

- `CORS_ORIGIN` supports multiple origins via comma-separated list.
- If you set `CORS_ORIGIN=*`, credentials are disabled automatically.
