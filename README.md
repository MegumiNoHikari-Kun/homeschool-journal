# Jurnal Belajar Rumah

- `frontend/` — Next.js 14 (App Router) + Tailwind. Login dan unggah foto lewat Supabase, data jurnal lewat API Go.
- `backend/` — API Go (chi + pgx) yang membaca/menulis Postgres Supabase dan memvalidasi token login Supabase.
- `supabase/schema.sql` — tabel, trigger profil, RLS, dan bucket foto.

## Jalankan lokal
1. Supabase: jalankan `supabase/schema.sql` di SQL Editor.
2. Backend: `cd backend && cp .env.example .env`, isi nilainya (DATABASE_URL dari Project Settings → Database).
   Lalu `go mod tidy && export $(grep -v '^#' .env | xargs) && go run ./cmd/server`
3. Frontend: `cd frontend && cp .env.example .env.local`, isi nilainya, lalu `npm install && npm run dev`.

## Deploy
1. Push ke GitHub.
2. Backend: deploy folder `backend/` (memakai Dockerfile) ke Railway, Render, atau Cloud Run. Isi env dari `backend/.env.example`; `ALLOWED_ORIGIN` = domain Vercel Anda.
3. Frontend: di Vercel impor repo, atur **Root Directory** ke `frontend`, isi env dan `NEXT_PUBLIC_API_URL` = URL backend.
4. Supabase → Authentication → URL Configuration: isi Site URL dengan domain Vercel.

## Endpoint
`GET /api/categories` · `GET /api/activities?category=ID` · `POST /api/activities/{id}/like`
Perlu login: `POST /api/activities` · `PUT /api/activities/{id}` · `DELETE /api/activities/{id}`
