/* global process */
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import fetchMangaHandler from '../api/fetch-manga/index.js';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.server' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const missingEnvKeys = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET']
  .filter((key) => !process.env[key]);

if (missingEnvKeys.length > 0) {
  throw new Error(`Missing required env keys: ${missingEnvKeys.join(', ')}. Add them to .env or .env.server`);
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, options = {}) => {
        // Set connection timeout for Supabase requests
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });
      },
    },
  }
);

// Allow all subdomains of batodeluna-lu.art + localhost for dev
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. curl, server-to-server)
    if (!origin) return cb(null, true);
    const allowed = [
      FRONTEND_URL,
      /^https?:\/\/(.+\.)?batodeluna-lu\.art$/,
      /^http:\/\/localhost(:\d+)?$/,
      /^http:\/\/127\.0\.0\.1(:\d+)?$/,
    ];
    const isAllowed = allowed.some((a) =>
      a instanceof RegExp ? a.test(origin) : a === origin
    );
    cb(null, isAllowed);
  },
}));
app.use(express.json());

function createToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      username: user.username,
      name: user.user_name || user.name || user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Missing or invalid authorization token.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Session expired or invalid token.' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden for your role.' });
    }
    return next();
  };
}

function toDbEmployee(payload) {
  return {
    name: String(payload.name || '').trim(),
    designation: String(payload.designation || '').trim(),
    sss_number: payload.sssNumber ? String(payload.sssNumber).trim() : null,
    pagibig_number: payload.pagibigNumber ? String(payload.pagibigNumber).trim() : null,
    philhealth_number: payload.philhealthNumber ? String(payload.philhealthNumber).trim() : null,
    salary_per_day: Number(payload.salaryPerDay ?? payload.salary_per_day ?? 0) || 0,
    status: payload.status ? String(payload.status).trim() : 'employed',
    photo_url: payload.photoUrl ? String(payload.photoUrl) : (payload.photo_url ? String(payload.photo_url) : null),
  };
}

function toEmployeeValues(payload) {
  const values = {
    ee_total: Number(payload.eeTotal ?? payload.ee_total ?? payload.eeShare ?? payload.eeshare ?? 0),
    er_total: Number(payload.erTotal ?? payload.er_total ?? payload.erShare ?? payload.ershare ?? 0),
    sss_ee: Number(payload.sssEe ?? payload.sss_ee ?? 0),
    sss_er: Number(payload.sssEr ?? payload.sss_er ?? 0),
    pagibig_ee: Number(payload.pagibigEe ?? payload.pagibig_ee ?? 0),
    pagibig_er: Number(payload.pagibigEr ?? payload.pagibig_er ?? 0),
    philhealth_ee: Number(payload.philhealthEe ?? payload.philhealth_ee ?? 0),
    philhealth_er: Number(payload.philhealthEr ?? payload.philhealth_er ?? 0),
  };

  const hasValues = [
    values.ee_total,
    values.er_total,
    values.sss_ee,
    values.sss_er,
    values.pagibig_ee,
    values.pagibig_er,
    values.philhealth_ee,
    values.philhealth_er,
  ].some((value) => Number(value) > 0);

  if (!hasValues) return null;

  if (payload.effectiveDate) {
    values.effective_date = String(payload.effectiveDate);
  } else if (payload.effective_date) {
    values.effective_date = String(payload.effective_date);
  }

  return values;
}

function maskText(value) {
  const text = String(value || '');
  if (text.length <= 2) return '*'.repeat(text.length);
  return `${text.slice(0, 2)}${'*'.repeat(Math.max(1, text.length - 3))}${text.slice(-1)}`;
}

function maskEmployeesForViewer(list) {
  return list.map((emp) => ({
    ...emp,
    name: maskText(emp.name),
    designation: maskText(emp.designation || '-'),
    ee_total: 0,
    er_total: 0,
    sss_ee: 0,
    sss_er: 0,
    pagibig_ee: 0,
    pagibig_er: 0,
    philhealth_ee: 0,
    philhealth_er: 0,
    sss_number: null,
    pagibig_number: null,
    philhealth_number: null,
    photo_url: null,
  }));
}

function maskValuesForViewer(list) {
  return list.map((row) => ({
    ...row,
    ee_total: 0,
    er_total: 0,
    sss_ee: 0,
    sss_er: 0,
    pagibig_ee: 0,
    pagibig_er: 0,
    philhealth_ee: 0,
    philhealth_er: 0,
  }));
}

function buildEmployeeKey(employee) {
  const name = String(employee?.name || '').trim();
  const designation = String(employee?.designation || '').trim();
  return `${name}||${designation}`;
}

function mergeEmployeeValues(employee, values) {
  if (!values) return employee;
  return {
    ...employee,
    ee_total: values.ee_total ?? employee.ee_total,
    er_total: values.er_total ?? employee.er_total,
    sss_ee: values.sss_ee ?? employee.sss_ee,
    sss_er: values.sss_er ?? employee.sss_er,
    pagibig_ee: values.pagibig_ee ?? employee.pagibig_ee,
    pagibig_er: values.pagibig_er ?? employee.pagibig_er,
    philhealth_ee: values.philhealth_ee ?? employee.philhealth_ee,
    philhealth_er: values.philhealth_er ?? employee.philhealth_er,
  };
}

app.get('/api/health', async (_req, res) => {
  try {
    // Verify database connectivity with a simple query
    const { data, error } = await supabaseAdmin
      .from('app_users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('[health] Database check failed:', error);
      return res.status(503).json({ status: 'unhealthy', reason: 'Database unavailable' });
    }
    
    return res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[health] Error:', err);
    return res.status(503).json({ status: 'unhealthy', reason: 'Health check failed' });
  }
});

app.get('/api/fetch-manga', fetchMangaHandler);

app.get('/api/employee-values', requireAuth, async (req, res) => {
  const name = String(req.query?.name || '').trim();
  const designation = String(req.query?.designation || '').trim();
  const limit = Number(req.query?.limit || 10);
  const offset = Number(req.query?.offset || 0);

  if (!name || !designation) {
    return res.status(400).json({ message: 'name and designation are required.' });
  }

  const { data, error } = await supabaseAdmin
    .from('employee_values')
    .select('*')
    .eq('employee_name', name)
    .eq('employee_designation', designation)
    .order('effective_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(
      Math.max(0, offset),
      Math.max(0, offset) + Math.max(1, Math.min(limit, 50)) - 1
    );

  if (error) {
    console.error('Employee values GET error:', error);
    return res.status(500).json({ message: 'Failed to fetch employee values.' });
  }

  const result = req.user?.role === 'viewer' ? maskValuesForViewer(data || []) : (data || []);
  return res.json({ data: result });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const userid = String(req.body?.userid || '').trim();
    const password = String(req.body?.password || '');

    if (!userid || !password) {
      return res.status(400).json({ message: 'userid and password are required.' });
    }

    const { data: user, error } = await supabaseAdmin
      .from('app_users')
      .select('id, username, user_name, password_hash, role')
      .eq('username', userid)
      .maybeSingle();

    if (error) {
      console.error('Supabase login query error:', error);
      return res.status(500).json({ message: 'Login failed due to server error.' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid userid or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid userid or password.' });
    }

    const token = createToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.user_name || user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Unexpected login error:', err);
    return res.status(500).json({ message: 'Unexpected server error.' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user.sub,
      username: req.user.username,
      name: req.user.name || req.user.username,
      role: req.user.role,
    },
  });
});

app.get('/api/auth/superadmin-only', requireAuth, requireRole('superadmin'), (_req, res) => {
  res.json({ message: 'You are a superadmin.' });
});

app.get('/api/employees', requireAuth, async (req, res) => {
  const { data: employees, error } = await supabaseAdmin
    .from('employees')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Employees GET error:', error);
    return res.status(500).json({ message: 'Failed to fetch employees.' });
  }

  const { data: valuesRows, error: valuesError } = await supabaseAdmin
    .from('employee_values')
    .select('*')
    .order('effective_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (valuesError) {
    console.error('Employee values GET error:', valuesError);
    return res.status(500).json({ message: 'Failed to fetch employee values.' });
  }

  const valuesByKey = new Map();
  (valuesRows || []).forEach((row) => {
    const key = `${String(row.employee_name || '').trim()}||${String(row.employee_designation || '').trim()}`;
    if (!valuesByKey.has(key)) {
      valuesByKey.set(key, row);
    }
  });

  const merged = (employees || []).map((emp) => {
    const key = buildEmployeeKey(emp);
    return mergeEmployeeValues(emp, valuesByKey.get(key));
  });

  const result = req.user?.role === 'viewer' ? maskEmployeesForViewer(merged) : merged;
  return res.json({ data: result });
});

app.post('/api/employees', requireAuth, async (req, res) => {
  if (req.user?.role === 'viewer') {
    return res.status(403).json({ message: 'Viewer role is read-only.' });
  }
  const newEmployee = toDbEmployee(req.body || {});
  if (!newEmployee.name) {
    return res.status(400).json({ message: 'Employee name is required.' });
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('employees')
    .select('id')
    .ilike('name', newEmployee.name)
    .ilike('designation', newEmployee.designation)
    .limit(1);

  if (existingError) {
    console.error('Employees POST duplicate check error:', existingError);
    return res.status(500).json({ message: 'Failed to validate employee.' });
  }

  if (existing && existing.length > 0) {
    return res.status(409).json({ message: 'Employee record already exists.' });
  }

  const { data, error } = await supabaseAdmin
    .from('employees')
    .insert([newEmployee])
    .select('*')
    .single();

  if (error) {
    console.error('Employees POST error:', error);
    return res.status(500).json({ message: 'Failed to create employee.' });
  }

  const valuesPayload = toEmployeeValues(req.body || {});
  if (valuesPayload) {
    const { error: valuesError } = await supabaseAdmin
      .from('employee_values')
      .upsert([{
        ...valuesPayload,
        employee_name: data.name,
        employee_designation: data.designation || '',
      }], { onConflict: 'employee_name,employee_designation' });

    if (valuesError) {
      console.error('Employees POST values error:', valuesError);
      await supabaseAdmin.from('employees').delete().eq('id', data.id);
      return res.status(500).json({ message: 'Failed to create employee values.' });
    }
  }

  return res.status(201).json({ data });
});

app.patch('/api/employees/:id', requireAuth, async (req, res) => {
  if (req.user?.role === 'viewer') {
    return res.status(403).json({ message: 'Viewer role is read-only.' });
  }
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid employee id.' });
  }

  const updateData = toDbEmployee(req.body || {});
  if (!updateData.name) {
    return res.status(400).json({ message: 'Employee name is required.' });
  }

  const { data, error } = await supabaseAdmin
    .from('employees')
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Employees PATCH error:', error);
    return res.status(500).json({ message: 'Failed to update employee.' });
  }

  const valuesPayload = toEmployeeValues(req.body || {});
  if (valuesPayload) {
    const { error: valuesError } = await supabaseAdmin
      .from('employee_values')
      .upsert([{
        ...valuesPayload,
        employee_name: data.name,
        employee_designation: data.designation || '',
      }], { onConflict: 'employee_name,employee_designation' });

    if (valuesError) {
      console.error('Employees PATCH values error:', valuesError);
      return res.status(500).json({ message: 'Failed to create employee values.' });
    }
  }

  return res.json({ data });
});

app.delete('/api/employees/:id', requireAuth, async (req, res) => {
  if (req.user?.role === 'viewer') {
    return res.status(403).json({ message: 'Viewer role is read-only.' });
  }
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid employee id.' });
  }

  const { data: employee, error: fetchError } = await supabaseAdmin
    .from('employees')
    .select('name, designation')
    .eq('id', id)
    .single();

  if (fetchError || !employee) {
    console.error('Employees DELETE fetch error:', fetchError);
    return res.status(404).json({ message: 'Employee not found.' });
  }

  const { error: valuesError } = await supabaseAdmin
    .from('employee_values')
    .delete()
    .eq('employee_name', employee.name)
    .eq('employee_designation', employee.designation);

  if (valuesError) {
    console.error('Employees DELETE values error:', valuesError);
    return res.status(500).json({ message: 'Failed to delete employee values.' });
  }

  const { error } = await supabaseAdmin
    .from('employees')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Employees DELETE error:', error);
    return res.status(500).json({ message: 'Failed to delete employee.' });
  }

  return res.json({ success: true });
});

/* ──────────────────────────────────────────────
   Static file serving for production
   Serves the Vite-built files from dist/ so that
   the Express server handles both API and frontend.
   ────────────────────────────────────────────── */
const distPath = path.resolve(__dirname, '..', 'dist');
const indexHtml = path.resolve(distPath, 'index.html');
console.log('[static] Serving from:', distPath);
console.log('[static] index.html at:', indexHtml);

app.use(express.static(distPath));

// SPA fallback — serve index.html for any non-API request
// so that React Router handles client-side routing
app.use((req, res) => {
  console.log('[fallback] Serving index.html for:', req.method, req.url);
  res.sendFile(indexHtml, (err) => {
    if (err) {
      console.error('[fallback] sendFile error:', err);
      res.status(500).send('Server error');
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} (API + static)`);
});

// Configure server timeouts and keepalive for Cloudflare tunnel stability
server.keepAliveTimeout = 120000; // 120 seconds (greater than Cloudflare's 100s default to prevent 502s)
server.headersTimeout = 121000; // Must be > keepAliveTimeout
server.requestTimeout = 300000; // 5 minute timeout to allow downloading large PDF mangas
