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
      .select('id, username, password_hash, role')
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
      role: req.user.role,
    },
  });
});

app.get('/api/auth/superadmin-only', requireAuth, requireRole('superadmin'), (_req, res) => {
  res.json({ message: 'You are a superadmin.' });
});

app.listen(PORT, () => {
  console.log(`Auth API running on http://localhost:${PORT}`);
});
