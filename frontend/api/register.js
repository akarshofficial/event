const { readDB, writeDB, hashPassword, generateToken, setCors } = require('./_db');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ detail: 'Method not allowed' });
  }

  const { username, password } = req.body || {};
  const cleanUsername = (username || '').trim();

  if (!cleanUsername || !password) {
    return res.status(400).json({ detail: 'Username and password are required.' });
  }

  if (password.length < 4) {
    return res.status(400).json({ detail: 'Password must be at least 4 characters long.' });
  }

  const db = readDB();
  const existingUser = db.users.find(
    (u) => u.username.toLowerCase() === cleanUsername.toLowerCase()
  );

  if (existingUser) {
    return res.status(400).json({ detail: 'Username already exists. Please choose a different username.' });
  }

  const newUser = {
    id: db.users.length > 0 ? Math.max(...db.users.map((u) => u.id)) + 1 : 1,
    username: cleanUsername,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDB(db);

  const access = generateToken({ id: newUser.id, username: cleanUsername, type: 'access' });
  const refresh = generateToken({ id: newUser.id, username: cleanUsername, type: 'refresh' }, 86400 * 30);

  return res.status(201).json({
    access,
    refresh,
    username: cleanUsername,
    message: 'Account created successfully!',
  });
};
