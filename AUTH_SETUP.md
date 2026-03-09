# Auth Setup (JWT + Supabase)

## 1) Create the auth table in Supabase
Run the SQL in:

- `supabase/sql/auth_schema.sql`

## 2) Create backend env file
Create `.env` in project root (or copy `.env.server.example`) and set:

- `PORT`
- `FRONTEND_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 3) Create users with bcrypt passwords
Generate a password hash:

```bash
node server/scripts/hashPassword.js yourpassword
```

Insert users in Supabase:

```sql
insert into public.app_users (username, password_hash, role)
values ('admin', '<bcrypt-hash>', 'superadmin');

insert into public.app_users (username, password_hash, role)
values ('emp001', '<bcrypt-hash>', 'employee');
```

## 4) Run app
Use two terminals:

```bash
npm run dev:server
npm run dev:client
```

Frontend route protection:
- Public: `/login`
- Protected (any authenticated role): `/dashboard`, `/employees`
- Superadmin only: `/settings`, `/reports`

## 5) Vercel deployment (frontend + API functions)
This repo now includes Vercel serverless auth endpoints:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/health`

Set these env vars in Vercel Project Settings:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server key, never expose to client code)
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL` (leave empty to use same-origin `/api`)

Notes:
- Keep `SUPABASE_SERVICE_ROLE_KEY` out of frontend env files.
- Local development can still use the Express server with `.env.server`.
