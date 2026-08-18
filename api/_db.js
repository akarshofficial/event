const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const DB_FILE = path.join(os.tmpdir(), 'events_db_v1.json');
const JWT_SECRET = process.env.JWT_SECRET || 'event-countdown-secret-jwt-key-2026';

function getDefaultDB() {
  return {
    users: [
      {
        id: 1,
        username: 'admin',
        passwordHash: hashPassword('admin123'),
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        username: 'akarsh',
        passwordHash: hashPassword('akarsh123'),
        createdAt: new Date().toISOString(),
      },
    ],
    events: [
      {
        id: 1,
        title: '🚀 Major Product Launch',
        target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ownerId: 1,
        username: 'admin',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: '🎉 New Year Celebration',
        target_date: new Date(new Date().getFullYear() + 1, 0, 1, 0, 0, 0).toISOString(),
        ownerId: 2,
        username: 'akarsh',
        created_at: new Date().toISOString(),
      },
    ],
  };
}

let inMemoryDB = getDefaultDB();

function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.events)) {
        inMemoryDB = parsed;
        return inMemoryDB;
      }
    }
  } catch (err) {
    // Fallback to inMemoryDB
  }

  writeDB(inMemoryDB);
  return inMemoryDB;
}

function writeDB(data) {
  inMemoryDB = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // In-memory keeps working
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_salt_2026').digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

function generateToken(payload, expiresInSeconds = 86400 * 7) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    })
  ).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');

  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

function getUserFromReq(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  return verifyToken(token);
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

module.exports = {
  readDB,
  writeDB,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  getUserFromReq,
  setCors,
};
