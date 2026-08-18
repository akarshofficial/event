const { readDB, verifyPassword, generateToken, verifyToken, setCors } = require('./_db');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  // Handle Token Refresh (POST /api/token/refresh/)
  if (req.url && req.url.includes('refresh')) {
    const { refresh } = req.body || {};
    if (!refresh) {
      return res.status(400).json({ detail: 'Refresh token is required.' });
    }
    const payload = verifyToken(refresh);
    if (!payload || payload.type !== 'refresh') {
      return res.status(401).json({ detail: 'Token is invalid or expired.' });
    }
    const access = generateToken({ id: payload.id, username: payload.username, type: 'access' });
    return res.status(200).json({ access });
  }

  // Handle Token Login (POST /api/token/)
  const { username, password } = req.body || {};
  const cleanUsername = (username || '').trim();

  if (!cleanUsername || !password) {
    return res.status(400).json({ detail: 'Username and password are required.' });
  }

  const db = readDB();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
  );

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ detail: 'No active account found with the given credentials' });
  }

  const access = generateToken({ id: user.id, username: user.username, type: 'access' });
  const refresh = generateToken({ id: user.id, username: user.username, type: 'refresh' }, 86400 * 30);

  return res.status(200).json({
    access,
    refresh,
    username: user.username,
  });
};
