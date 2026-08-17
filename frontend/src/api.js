import axios from 'axios';

// Dynamically determine backend base URL:
// Priority:
// 1. REACT_APP_API_URL environment variable (from Vercel / .env)
// 2. Relative '/api/' in production if same origin / monorepo
// 3. 'http://127.0.0.1:8000/api/' during local development
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

const API = axios.create({
  baseURL: BASE_API_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (localStorage.getItem('access_token')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.dispatchEvent(new Event('auth-changed'));
      }
    }
    return Promise.reject(error);
  }
);

export default API;