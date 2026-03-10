import { getBearerToken, getSupabaseAdmin, parseJsonBody, verifyJwt } from '../_lib/auth.js';

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

export default async function handler(req, res) {
  const user = getAuthenticatedUser(req, res);
  if (!user) return;

  const supabaseAdmin = getSupabaseAdmin();

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('employees')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Employees GET error:', error);
      return res.status(500).json({ message: 'Failed to fetch employees.' });
    }

    const result = user.role === 'viewer' ? maskEmployeesForViewer(data || []) : (data || []);
    return res.status(200).json({ data: result });
  }

  if (req.method === 'POST') {
    if (user.role === 'viewer') {
      return res.status(403).json({ message: 'Viewer role is read-only.' });
    }
    const body = parseJsonBody(req);
    const newEmployee = toDbEmployee(body);

    if (!newEmployee.name) {
      return res.status(400).json({ message: 'Employee name is required.' });
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
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ message: 'Method not allowed.' });
}
