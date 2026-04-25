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

export default async function handler(req, res) {
  const user = getAuthenticatedUser(req, res);
  if (!user) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const name = String(req.query?.name || '').trim();
  const designation = String(req.query?.designation || '').trim();
  const limit = Number(req.query?.limit || 10);
  const offset = Number(req.query?.offset || 0);

  if (!name || !designation) {
    return res.status(400).json({ message: 'name and designation are required.' });
  }

  const supabaseAdmin = getSupabaseAdmin();
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

  const result = user.role === 'viewer' ? maskValuesForViewer(data || []) : (data || []);
  return res.status(200).json({ data: result });
}
