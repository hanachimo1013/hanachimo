import { getBearerToken, verifyJwt } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Missing or invalid authorization token.' });
    }

    const payload = verifyJwt(token);
    return res.status(200).json({
      user: {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
      },
    });
  } catch {
    return res.status(401).json({ message: 'Session expired or invalid token.' });
  }
}
