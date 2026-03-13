# BDLAG Utility

## 1. Description

Internal admin dashboard for Bato de Luna Art Gallery (BDLAG).

This is a modern full-stack application built with React (Vite) on the frontend and a Node.js/Express-based serverless API backend. It features a robust front-end structure utilizing context for state management (Authentication and Theming) and `react-router-dom` for client-side navigation. The project includes role-based access control (JWT) for protected routes, secure CRUD operations for employee data via serverless functions, and is styled with Tailwind CSS. The entire system is backed by Supabase for database and storage.

## 2. Features
- JWT login with role-based access (`superadmin`, `employee`, `viewer`)
- Protected routes and session persistence
- Client-side routing with `react-router-dom`
- Role-based access control for specific routes
- Global state management for Auth and Theming via React Context
- Employees CRUD via secure serverless API
- Employee values history (EE/ER totals over time)
- Supabase-backed data and storage

## 3. Tech Stack
- **Frontend**: React 19, Vite, React Router DOM v6
- **Backend**: Vercel Serverless Functions (Node.js/Express-like)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS, Bootstrap Icons
- **Linting**: ESLint

## 4. Project Structure
```
/
|-- api/                  # Vercel Serverless Functions (Backend)
|   |-- employee-values/  # Values history endpoint
|-- public/
|-- src/                  # React Frontend Source
|   |-- assets/
|   |-- components/
|   |   |-- auth/
|   |   |-- employee/
|   |   |-- layout/
|   |   |-- pages/
|   |   |-- ui/
|   |-- config/
|   |-- context/
|   |   |-- AuthContext.jsx
|   |   |-- ThemeContext.jsx
|   |-- hooks/
|   |-- utils/
|   |-- App.jsx            # Main application component with routing
|   |-- index.css          # Global styles
|   |-- main.jsx           # Application entry point
|-- supabase/              # SQL schemas and migrations
|-- .env.local             # Frontend environment variables
|-- .env.server            # Backend environment variables
|-- package.json
|-- vercel.json            # Vercel deployment configuration
```

## 5. Routing and Navigation (Frontend)
Routing is defined in `src/App.jsx` and managed by `react-router-dom`.

### Key Routing Components
- **`ProtectedRoute`**: Wraps routes that require authentication. It checks for a valid user session and can also enforce role-based access.
- **`PublicOnlyRoute`**: Wraps routes like `/login` to prevent access by already authenticated users, redirecting them to the dashboard.
- **`Layout`**: A wrapper component for protected pages, providing a consistent UI shell (e.g., sidebar, navbar).
- **`TitleUpdater`**: A utility component that dynamically updates the document title based on the current route.

#### Route Configuration
| Path | Component | Access | Notes |
| :--- | :--- | :--- | :--- |
| `/` | Redirect | - | Redirects to `/login` |
| `/login` | `Login` | Public Only | Accessible only if not logged in |
| `/dashboard` | `Dashboard` | Protected | Wrapped in `Layout` component |
| `/employees` | `Employees` | Protected | Wrapped in `Layout` component |
| `/settings` | `Settings` | Protected | Roles: `superadmin`, `viewer` |
| `/reports` | `Reports` | Protected | Roles: `superadmin`, `viewer` |
| `/hanachimo` | `HanachimoProfile` | Public | - |
| `*` | `NotFound` | Public | 404 Page |

## 6. State Management (Context)
Global state is managed via React's Context API.
- **`src/context/AuthContext.jsx`**: Provides authentication state (e.g., user object, login/logout functions) to the entire application.
- **`src/context/ThemeContext.jsx`**: Manages the application's theme (e.g., light/dark mode).

## 7. Quick Start (Local Development)

### 1. Install Dependencies
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
- `supabase/sql/2026_03_13_employee_schema_update.sql`
- (optional) `supabase/sql/employee_values_backfill.sql`

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
