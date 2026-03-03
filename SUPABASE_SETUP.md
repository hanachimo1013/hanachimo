# Supabase Integration Guide

## Overview
This application uses **Supabase** (a PostgreSQL database service) to manage employee data dynamically. All employee information is fetched from Supabase instead of being hardcoded.

## Setup Instructions

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account (or log in if you already have one)
3. Create a new project:
   - Click "New project"
   - Enter a project name (e.g., "BDLAG Utility")
   - Choose a strong database password
   - Select your preferred region
   - Click "Create new project"

### Step 2: Create the Employees Table
1. In your Supabase project dashboard, go to **SQL Editor** (or use **Table Editor**)
2. Click "New Query" and run this SQL:

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

3. Click "Run" to execute the query

### Step 3: Add Sample Data (Optional)
Run this SQL to populate with sample employees:

```sql
INSERT INTO employees (name, sss, pagibig, philhealth, eeShare, erShare) VALUES
('John Doe', 1250, 500, 300, 8500, 12750),
('Jane Smith', 1100, 450, 280, 7200, 10800),
('Mike Johnson', 1000, 400, 250, 6500, 9750),
('Sarah Williams', 1050, 425, 265, 7000, 10500),
('Tom Brown', 1300, 520, 310, 8800, 13200);
```

### Step 4: Get Your API Credentials
1. In Supabase dashboard, go to **Settings** → **API**
2. You'll see:
   - **Project URL** (copy this)
   - **anon public** key (copy this)
3. Copy both values

### Step 5: Configure Environment Variables
1. Open or create `.env.local` file in your project root
2. Add your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Replace the values with your actual credentials from Step 4
4. Save the file

### Step 6: Test the Integration
1. Start your development server:
   ```
   npm run dev
   ```
2. Open the application in your browser
3. Check:
   - **Dashboard**: Should show status cards with totals from your database
   - **Employees**: Should display employee list from Supabase
   - **Reports**: Should generate reports with your data

## Features

### Dynamic Employee Data
- ✅ All employee data is fetched from Supabase on app load
- ✅ Fallback data is used if database is unavailable
- ✅ Real-time updates when you modify employee records

### Available Operations
- **Read**: Fetch all employees from the database
- **Create**: Add new employees (use the `useEmployees()` hook)
- **Update**: Modify employee information (use the `useEmployees()` hook)
- **Delete**: Remove employees (use the `useEmployees()` hook)

## Using the useEmployees Hook

In any React component, you can use the `useEmployees` hook:

```jsx
import { useEmployees } from '../hooks/useEmployees';

export default function MyComponent() {
  const { employees, loading, error, addEmployee, updateEmployee, deleteEmployee, refetch } = useEmployees();
  
  // Handle loading state
  if (loading) return <div>Loading...</div>;
  
  // Use employees data
  return (
    <div>
      {employees.map(emp => (
        <div key={emp.id}>{emp.name}</div>
      ))}
    </div>
  );
}
```

## Troubleshooting

### "No employees found" or using fallback data?
1. Check that `.env.local` file exists with correct Supabase credentials
2. Verify the `employees` table exists in your Supabase project
3. Check browser console for error messages (F12 → Console tab)

### Database operations not working?
1. Go to Supabase dashboard → Authentication → Policies
2. Ensure Row Level Security (RLS) allows public read/write (for development)
3. Or set up specific policies for your needs

### Still having issues?
1. Check that you're using the public/anon key (not the service role secret)
2. Verify table name is exactly `employees` (case-sensitive)
3. Ensure column names match: id, name, sss, pagibig, philhealth, eeShare, erShare

## Security Note
⚠️ The current setup uses the public anon key for development convenience. For production:
- Implement proper authentication
- Use Row Level Security (RLS) policies to restrict data access
- Use the service role key only on the backend
- Never commit `.env.local` to version control
