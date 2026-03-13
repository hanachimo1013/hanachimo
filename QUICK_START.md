# Quick Start Guide - Supabase Integration

## TL;DR - Get Running in 5 Minutes

### 1. Create Supabase Project (2 min)
```
Go to supabase.com -> Sign up -> Create Project
```

### 2. Create Database Table (1 min)
```sql
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sss NUMERIC(10, 2) DEFAULT 0,
  pagibig NUMERIC(10, 2) DEFAULT 0,
  philhealth NUMERIC(10, 2) DEFAULT 0,
  eeShare NUMERIC(10, 2) DEFAULT 0,
  erShare NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
Run this in Supabase SQL Editor.

Then run the schema update:
```
supabase/sql/2026_03_13_employee_schema_update.sql
```

### 3. Get API Keys (1 min)
1. Settings -> API
2. Copy: Project URL
3. Copy: anon public key

### 4. Configure Environment (1 min)
Create `.env.local`:
```
VITE_SUPABASE_URL=https://[your-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 5. Start Dev Server
```bash
npm run dev
```

Done. Your app now connects to Supabase.

---

## Data Already in App

5 sample employees are automatically used if Supabase is offline:
- John Doe (PHP 8500 EE, PHP 12750 ER)
- Jane Smith (PHP 7200 EE, PHP 10800 ER)
- Mike Johnson (PHP 6500 EE, PHP 9750 ER)
- Sarah Williams (PHP 7000 EE, PHP 10500 ER)
- Tom Brown (PHP 8800 EE, PHP 13200 ER)

Add them to Supabase with this SQL:
```sql
INSERT INTO employees (name, sss, pagibig, philhealth, eeShare, erShare) VALUES
('John Doe', 1250, 500, 300, 8500, 12750),
('Jane Smith', 1100, 450, 280, 7200, 10800),
('Mike Johnson', 1000, 400, 250, 6500, 9750),
('Sarah Williams', 1050, 425, 265, 7000, 10500),
('Tom Brown', 1300, 520, 310, 8800, 13200);
```

---

## What Changed in Your App

**Dashboard**
- Status cards now show totals from database
- Employee directory pulls live data
- Receipt generation uses real values

**Employees Page**
- Shows SSS, PAG-IBIG, PhilHealth per employee
- EE/ER total columns
- All data from Supabase

**History**
- Values history modal (EE/ER totals over time)

**Reports**
- Insurance report uses live data
- Salary distribution uses live data
- Charts update automatically

---

## Using the Hook in Components

```jsx
import { useEmployees } from '../hooks/useEmployees';

export default function MyComponent() {
  const { employees, loading, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {employees.map(emp => <div key={emp.id}>{emp.name}</div>)}
    </div>
  );
}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No employees found" | Check .env.local has correct credentials |
| Using sample data | Supabase connection failed - check errors in console (F12) |
| Changes not showing | Click refresh or wait for auto-refetch |
| Table not found | Run CREATE TABLE SQL in Supabase SQL Editor |
| Can't modify data | Check Row Level Security (RLS) settings in Supabase |

---

## Files to Know

| File | Purpose |
|------|---------|
| `src/config/supabaseClient.js` | Database connection setup |
| `src/hooks/useEmployees.js` | Employee data management hook |
| `.env.local` | Your Supabase credentials (keep secret) |
| `SUPABASE_SETUP.md` | Detailed setup guide |

---

## Environment Variables

Only 2 variables needed:
```
VITE_SUPABASE_URL      -> From Supabase Settings
VITE_SUPABASE_ANON_KEY -> From Supabase Settings
```

Never commit `.env.local` to git.

---

## Next Level (Optional)

Want to add more functionality?

```javascript
// Add authentication
import { supabase } from './config/supabaseClient';
await supabase.auth.signInWithPassword({...})

// Real-time updates
const subscription = supabase
  .on('*', { event: 'INSERT', schema: 'public', table: 'employees' }, 
    (payload) => console.log('New employee:', payload))
  .subscribe()

// Row Level Security (RLS)
// Set policies per user in Supabase dashboard
```

See `SUPABASE_SETUP.md` for more security best practices.

---

## Deployed to Vercel?

If you deploy your app:

1. Add environment variables in Vercel dashboard:
   - Project Settings -> Environment Variables
   - Add VITE_SUPABASE_URL
   - Add VITE_SUPABASE_ANON_KEY

2. Deploy branches will automatically use these values

3. Supabase stays online so your app always has data
