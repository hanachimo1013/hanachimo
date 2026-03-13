/* global process */
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.server' });

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
  { auth: { persistSession: false, autoRefreshToken: false } }
);

app.use(cors({ origin: FRONTEND_URL }));
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
    sss: Number(payload.sss || 0),
    pagibig: Number(payload.pagibig || 0),
    philhealth: Number(payload.philhealth || 0),
    eeshare: Number(payload.eeShare ?? payload.eeshare ?? 0),
    ershare: Number(payload.erShare ?? payload.ershare ?? 0),
    photo_url: payload.photoUrl ? String(payload.photoUrl) : null,
  };
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
    sss: 0,
    pagibig: 0,
    philhealth: 0,
    eeshare: 0,
    ershare: 0,
    photo_url: null,
  }));
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
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

app.get('/api/employees', requireAuth, async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('employees')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('Employees GET error:', error);
    return res.status(500).json({ message: 'Failed to fetch employees.' });
  }

  const result = req.user?.role === 'viewer' ? maskEmployeesForViewer(data || []) : (data || []);
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

app.listen(PORT, () => {
  console.log(`Auth API running on http://localhost:${PORT}`);
});
