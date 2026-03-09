import { getSupabaseAdmin, parseJsonBody, signJwt, verifyPassword } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  try {
    const body = parseJsonBody(req);
    const userid = String(body.userid || '').trim();
    const password = String(body.password || '');

    if (!userid || !password) {
      return res.status(400).json({ message: 'userid and password are required.' });
    }

    const supabaseAdmin = getSupabaseAdmin();
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

    const passwordMatch = await verifyPassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid userid or password.' });
    }

    const token = signJwt(user);
    return res.status(200).json({
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
}
