import axios from 'axios';

// Determine backend base URL:
let rawBaseURL = process.env.REACT_APP_API_URL;

if (!rawBaseURL) {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    rawBaseURL = '/api/';
  } else {
    rawBaseURL = 'http://127.0.0.1:8000/api/';
  }
}

if (!rawBaseURL.endsWith('/')) {
  rawBaseURL += '/';
}

export const BASE_API_URL = rawBaseURL;

// Client-Side Offline / LocalStorage Database
const STORAGE_KEY_DB = 'event_countdown_client_db_v2';
const STORAGE_KEY_MODE = 'event_countdown_force_offline';

function createApiError(status, detail) {
  const err = new Error(detail);
  err.response = { status, data: { detail } };
  return err;
}

function getDefaultLocalDB() {
  const now = Date.now();
  return {
    users: [
      { id: 1, username: 'admin', password: 'admin123', name: 'Admin User' },
      { id: 2, username: 'guest', password: 'guest123', name: 'Guest Explorer' },
      { id: 3, username: 'akarsh', password: 'akarsh123', name: 'Akarsh' },
    ],
    events: [
      {
        id: 1,
        title: '🚀 Major Product Launch',
        target_date: new Date(now + 6 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
        category: 'launch',
        notes: 'Global public release of version 2.0 with live demo.',
        color: 'blue',
        pinned: true,
        username: 'admin',
        created_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        title: '🎉 New Year 2027 Countdown',
        target_date: new Date(new Date().getFullYear() + 1, 0, 1, 0, 0, 0).toISOString(),
        category: 'celebration',
        notes: 'Ring in the brand new year with excitement and fireworks!',
        color: 'purple',
        pinned: true,
        username: 'admin',
        created_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        title: '🎂 Team Milestone Celebration',
        target_date: new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'milestone',
        notes: 'Celebrating 100k active users together.',
        color: 'emerald',
        pinned: false,
        username: 'admin',
        created_at: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 4,
        title: '✈️ Summer Vacation Trip',
        target_date: new Date(now + 28 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'travel',
        notes: 'Beach resort getaway and hiking trip.',
        color: 'cyan',
        pinned: false,
        username: 'admin',
        created_at: new Date().toISOString(),
      },
      {
        id: 5,
        title: '🎓 Final Project Presentation',
        target_date: new Date(now + 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(),
        category: 'exam',
        notes: 'Final presentation and submission deadline.',
        color: 'amber',
        pinned: false,
        username: 'guest',
        created_at: new Date().toISOString(),
      },
    ],
  };
}

export function getLocalDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DB);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.events)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed reading local DB:', e);
  }
  const defaultDB = getDefaultLocalDB();
  saveLocalDB(defaultDB);
  return defaultDB;
}

export function saveLocalDB(data) {
  try {
    localStorage.setItem(STORAGE_KEY_DB, JSON.stringify(data));
  } catch (e) {
    console.error('Failed saving local DB:', e);
  }
}

// Client-side simulated auth tokens
function generateLocalToken(username) {
  return `client_token_${username}_${Date.now()}`;
}

// Local mock execution handlers
function handleLocalAuth(endpoint, data) {
  const db = getLocalDB();
  const cleanUser = (data?.username || '').trim().toLowerCase();
  const password = data?.password || '';

  if (endpoint.includes('register')) {
    if (!cleanUser || !password) {
      throw createApiError(400, 'Username and password are required.');
    }
    const exists = db.users.some((u) => u.username.toLowerCase() === cleanUser);
    if (exists) {
      throw createApiError(400, 'Username is already taken in client storage.');
    }
    const newUser = {
      id: db.users.length > 0 ? Math.max(...db.users.map((u) => u.id)) + 1 : 1,
      username: data.username.trim(),
      password: password,
      name: data.username.trim(),
    };
    db.users.push(newUser);
    saveLocalDB(db);

    const token = generateLocalToken(newUser.username);
    return {
      status: 201,
      data: {
        access: token,
        refresh: token,
        username: newUser.username,
        message: 'Account created in Client Engine!',
      },
    };
  }

  // Token Login
  if (!cleanUser || !password) {
    throw createApiError(400, 'Username and password are required.');
  }

  let user = db.users.find((u) => u.username.toLowerCase() === cleanUser);
  
  // If user doesn't exist, create it on the fly for seamless first-time experience if password length >= 4
  if (!user) {
    if (password.length >= 4) {
      user = {
        id: db.users.length > 0 ? Math.max(...db.users.map((u) => u.id)) + 1 : 1,
        username: data.username.trim(),
        password: password,
        name: data.username.trim(),
      };
      db.users.push(user);
      saveLocalDB(db);
    } else {
      throw createApiError(401, 'Invalid credentials. User not found.');
    }
  } else if (user.password !== password) {
    throw createApiError(401, 'Incorrect password for this account.');
  }

  const token = generateLocalToken(user.username);
  return {
    status: 200,
    data: {
      access: token,
      refresh: token,
      username: user.username,
    },
  };
}

function handleLocalEvents(method, endpoint, data) {
  const db = getLocalDB();
  const currentUsername = localStorage.getItem('username') || 'admin';
  const cleanEndpoint = endpoint.replace(/^\//, '').replace(/\/$/, '');
  const parts = cleanEndpoint.split('/');
  const isIdRoute = parts.length > 1 && !isNaN(parseInt(parts[1], 10));
  const eventId = isIdRoute ? parseInt(parts[1], 10) : null;

  if (method === 'GET') {
    if (isIdRoute) {
      const evt = db.events.find((e) => e.id === eventId);
      if (!evt) throw createApiError(404, 'Event not found.');
      return { status: 200, data: evt };
    }

    const userEvents = db.events
      .filter((e) => !e.username || e.username.toLowerCase() === currentUsername.toLowerCase())
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(a.target_date) - new Date(b.target_date);
      });
    return { status: 200, data: userEvents };
  }

  if (method === 'POST') {
    const { title, target_date, category, notes, color, pinned } = data || {};
    if (!title || !target_date) {
      throw createApiError(400, 'Title and target_date are required.');
    }

    const newEvent = {
      id: db.events.length > 0 ? Math.max(...db.events.map((e) => e.id)) + 1 : 1,
      title: title.trim(),
      target_date: new Date(target_date).toISOString(),
      category: category || 'milestone',
      notes: (notes || '').trim(),
      color: color || 'blue',
      pinned: !!pinned,
      username: currentUsername,
      created_at: new Date().toISOString(),
    };

    db.events.unshift(newEvent);
    saveLocalDB(db);
    return { status: 201, data: newEvent };
  }

  if (method === 'PUT' || method === 'PATCH') {
    const evtIndex = db.events.findIndex((e) => e.id === eventId);
    if (evtIndex === -1) {
      throw createApiError(404, 'Event not found.');
    }

    const existing = db.events[evtIndex];
    const { title, target_date, category, notes, color, pinned } = data || {};

    const updatedEvent = {
      ...existing,
      ...(title !== undefined && { title: title.trim() }),
      ...(target_date !== undefined && { target_date: new Date(target_date).toISOString() }),
      ...(category !== undefined && { category }),
      ...(notes !== undefined && { notes: notes.trim() }),
      ...(color !== undefined && { color }),
      ...(pinned !== undefined && { pinned: !!pinned }),
      updated_at: new Date().toISOString(),
    };

    db.events[evtIndex] = updatedEvent;
    saveLocalDB(db);
    return { status: 200, data: updatedEvent };
  }

  if (method === 'DELETE') {
    const initialLength = db.events.length;
    db.events = db.events.filter((e) => e.id !== eventId);
    if (db.events.length === initialLength) {
      throw createApiError(404, 'Event not found.');
    }
    saveLocalDB(db);
    return { status: 204, data: null };
  }

  throw createApiError(405, 'Method not allowed');
}

// Axios instance with graceful offline fallback
const axiosInstance = axios.create({
  baseURL: BASE_API_URL,
  timeout: 4500,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && !token.startsWith('client_token_')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mode status notifier
let isClientModeActive = localStorage.getItem(STORAGE_KEY_MODE) === 'true';

export function getEngineMode() {
  return isClientModeActive ? 'client' : 'live';
}

export function setEngineMode(mode) {
  isClientModeActive = mode === 'client';
  localStorage.setItem(STORAGE_KEY_MODE, isClientModeActive ? 'true' : 'false');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('engine-mode-changed', { detail: mode }));
  }
}

// Universal API wrapper
const API = {
  get: async (url, config) => {
    if (isClientModeActive) {
      return handleLocalEvents('GET', url);
    }
    try {
      return await axiosInstance.get(url, config);
    } catch (err) {
      if (shouldFallback(err)) {
        console.info('Backend unreachable, using Client Mode fallback');
        setEngineMode('client');
        return handleLocalEvents('GET', url);
      }
      throw err;
    }
  },

  post: async (url, data, config) => {
    if (isClientModeActive) {
      if (url.includes('register') || url.includes('token')) {
        return handleLocalAuth(url, data);
      }
      return handleLocalEvents('POST', url, data);
    }
    try {
      return await axiosInstance.post(url, data, config);
    } catch (err) {
      if (shouldFallback(err)) {
        console.info('Backend unreachable, handling POST in Client Mode');
        setEngineMode('client');
        if (url.includes('register') || url.includes('token')) {
          return handleLocalAuth(url, data);
        }
        return handleLocalEvents('POST', url, data);
      }
      throw err;
    }
  },

  put: async (url, data, config) => {
    if (isClientModeActive) {
      return handleLocalEvents('PUT', url, data);
    }
    try {
      return await axiosInstance.put(url, data, config);
    } catch (err) {
      if (shouldFallback(err)) {
        setEngineMode('client');
        return handleLocalEvents('PUT', url, data);
      }
      throw err;
    }
  },

  patch: async (url, data, config) => {
    if (isClientModeActive) {
      return handleLocalEvents('PATCH', url, data);
    }
    try {
      return await axiosInstance.patch(url, data, config);
    } catch (err) {
      if (shouldFallback(err)) {
        setEngineMode('client');
        return handleLocalEvents('PATCH', url, data);
      }
      throw err;
    }
  },

  delete: async (url, config) => {
    if (isClientModeActive) {
      return handleLocalEvents('DELETE', url);
    }
    try {
      return await axiosInstance.delete(url, config);
    } catch (err) {
      if (shouldFallback(err)) {
        setEngineMode('client');
        return handleLocalEvents('DELETE', url);
      }
      throw err;
    }
  },
};

function shouldFallback(err) {
  if (!err) return false;
  return (
    !err.response ||
    err.code === 'ECONNABORTED' ||
    err.message?.includes('Network Error') ||
    err.message?.includes('timeout') ||
    [404, 500, 502, 503, 504].includes(err.response?.status)
  );
}

// Audio Chime Synthesizer using Web Audio API
export function playCompletionChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 chord arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.7);
    });
  } catch (e) {
    console.log('Audio playback prevented by browser:', e);
  }
}

// iCalendar (.ics) File Generator
export function downloadCalendarEvent(event) {
  const title = event.title || 'Event Countdown';
  const description = event.notes ? event.notes.replace(/\n/g, '\\n') : 'Countdown milestone tracked via Event Countdown';
  const targetDate = new Date(event.target_date);
  
  const formatDateToICS = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startTime = formatDateToICS(targetDate);
  const endTime = formatDateToICS(new Date(targetDate.getTime() + 60 * 60 * 1000));
  const nowTime = formatDateToICS(new Date());

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Event Countdown//Live Milestone Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id || Date.now()}@eventcountdown.app`,
    `DTSTAMP:${nowTime}`,
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default API;