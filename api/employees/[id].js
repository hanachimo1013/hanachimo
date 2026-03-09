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

export default async function handler(req, res) {
  const user = getAuthenticatedUser(req, res);
  if (!user) return;

  const id = Number(req.query?.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid employee id.' });
  }

  const supabaseAdmin = getSupabaseAdmin();

  if (req.method === 'PATCH') {
    const body = parseJsonBody(req);
    const updateData = toDbEmployee(body);

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

    return res.status(200).json({ data });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Employees DELETE error:', error);
      return res.status(500).json({ message: 'Failed to delete employee.' });
    }

    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ message: 'Method not allowed.' });
}
