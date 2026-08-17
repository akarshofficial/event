import React, { useState } from 'react';
import API, { BASE_API_URL } from '../api';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('token/', {
        username: username.trim(),
        password: password,
      });

      if (res.data && res.data.access) {
        localStorage.setItem('access_token', res.data.access);
        if (res.data.refresh) {
          localStorage.setItem('refresh_token', res.data.refresh);
        }
        localStorage.setItem('username', username.trim());
        onLoginSuccess();
      } else {
        setError('Authentication succeeded but no token received.');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.data) {
        const detail = err.response.data.detail || err.response.data.non_field_errors;
        setError(detail || 'Invalid username or password');
      } else if (err.message && err.message.includes('Network Error')) {
        setError(`Unable to connect to backend at ${BASE_API_URL}. Please ensure the server is running.`);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">⏳</div>
          <h1 className="auth-title">Event Countdown</h1>
          <p className="auth-subtitle">Sign in to manage your milestones and live countdowns</p>
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: '16px' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder="e.g. akarsh or admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Connected to API: <code>{BASE_API_URL}</code></p>
        </div>
      </div>
    </div>
  );
};

export default Login;