# BDLAG Utility

Internal admin dashboard for Bato de Luna Art Gallery (BDLAG). Built with React, Vite, Tailwind CSS, Supabase, and a JWT-based login flow.

## Features
- JWT login with role-based access (`superadmin`, `employee`)
- Protected routes and session persistence
- Employees CRUD via secure serverless API
- Supabase-backed data and storage

## Tech Stack
- React 19 + Vite
- Tailwind CSS
- Supabase
- Vercel serverless functions (`/api/*`)

## Quick Start (Local)

Install dependencies:
```bash
npm install
```

Create backend env file in project root (`.env.server`):
```env
PORT=4000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=8h
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Create frontend env file in project root (`.env.local`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_BASE_URL=
```

Run SQL in Supabase:
- `supabase/sql/auth_schema.sql`

Start dev servers (two terminals):
```bash
npm run dev:server
npm run dev:client
```

## Create Users
Generate bcrypt hash:
```bash
node server/scripts/hashPassword.js yourpassword
```

Insert a user in Supabase:
```sql
insert into public.app_users (username, password_hash, role)
values ('admin', '<bcrypt-hash>', 'superadmin');
```

## Vercel Deployment
Set env vars in Vercel Project Settings:
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
JWT_EXPIRES_IN
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_API_BASE_URL
```

Notes:
- Keep `SUPABASE_SERVICE_ROLE_KEY` out of frontend env files.
- `VITE_API_BASE_URL` should be empty for same-origin `/api`.

## Security: Lock Down Employees RLS
After API CRUD is live, run:
- `supabase/sql/employees_rls_lockdown.sql`

This removes direct `anon/authenticated` access for `public.employees`.
