/* global process */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export function getSupabaseAdmin() {
  const url = getRequiredEnv('SUPABASE_URL');
  const serviceKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function signJwt(user) {
  const secret = getRequiredEnv('JWT_SECRET');
  return jwt.sign(
    {
      sub: String(user.id),
      username: user.username,
      role: user.role,
    },
    secret,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyJwt(token) {
  const secret = getRequiredEnv('JWT_SECRET');
  return jwt.verify(token, secret);
}

export async function verifyPassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

export function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export function parseJsonBody(req) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body || {};
}
