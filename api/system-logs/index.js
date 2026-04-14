import { getBearerToken, getSupabaseAdmin, verifyJwt } from '../_lib/auth.js';

function getAuthenticatedUser(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ message: 'Missing or invalid authorization token.' });
    return null;
  }

  try {
    return verifyJwt(token);
  } catch {
    res.status(401).json({ message: 'Session expired or invalid token.' });
    return null;
  }
}

function maskLogsForViewer(logs) {
  return logs.map((log) => ({
    ...log,
    entity_name: '***',
    performed_by: '***',
    details: {},
  }));
}

export default async function handler(req, res) {
  const user = getAuthenticatedUser(req, res);
  if (!user) return;

  const supabaseAdmin = getSupabaseAdmin();

  if (req.method === 'GET') {
    const limit = Math.min(Number(req.query?.limit || 50), 100);
    const offset = Math.max(Number(req.query?.offset || 0), 0);
    const entityType = req.query?.entity_type || null;

    let query = supabaseAdmin
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('System logs GET error:', error);
      return res.status(500).json({ message: 'Failed to fetch system logs.' });
    }

    const result = user.role === 'viewer' ? maskLogsForViewer(data || []) : (data || []);
    return res.status(200).json({ data: result });
  }

  if (req.method === 'POST') {
    // Only superadmin or internal calls can create logs
    if (user.role === 'viewer') {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { action, entity_type, entity_name, details } = body;

    if (!action || !entity_type) {
      return res.status(400).json({ message: 'action and entity_type are required.' });
    }

    const { data, error } = await supabaseAdmin
      .from('system_logs')
      .insert({
        action,
        entity_type,
        entity_name: entity_name || null,
        details: details || {},
        performed_by: user.name || user.username || 'unknown',
      })
      .select()
      .single();

    if (error) {
      console.error('System logs POST error:', error);
      return res.status(500).json({ message: 'Failed to create log entry.' });
    }

    return res.status(201).json({ data });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ message: 'Method not allowed.' });
}
