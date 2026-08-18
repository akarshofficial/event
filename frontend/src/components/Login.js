import React, { useState } from 'react';
import API, { BASE_API_URL } from '../api';

const Login = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (mode === 'register') {
      if (password.length < 4) {
        setError('Password must be at least 4 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await API.post('register/', {
          username: username.trim(),
          password: password,
        });

        if (res.data && res.data.access) {
          localStorage.setItem('access_token', res.data.access);
          if (res.data.refresh) {
            localStorage.setItem('refresh_token', res.data.refresh);
          }
          localStorage.setItem('username', res.data.username || username.trim());
          setSuccessMessage('Account created successfully! Logging you in...');
          setTimeout(() => {
            onLoginSuccess();
          }, 400);
        } else {
          setSuccessMessage('Account created successfully! Please sign in.');
          setMode('login');
          setPassword('');
          setConfirmPassword('');
        }
      } else {
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
          setError('Authentication succeeded but no token was returned.');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err.response && err.response.data) {
        const detail =
          err.response.data.detail ||
          err.response.data.non_field_errors ||
          (Array.isArray(err.response.data.detail) ? err.response.data.detail[0] : null);
        setError(detail || (mode === 'register' ? 'Registration failed. Username may be taken.' : 'Invalid username or password.'));
      } else if (err.message && err.message.includes('Network Error')) {
        setError(`Unable to connect to backend server at ${BASE_API_URL}. Please check server status.`);
      } else {
        setError(mode === 'register' ? 'Failed to create account.' : 'Login failed. Please verify your credentials.');
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
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Sign in to manage your milestones and live countdowns'
              : 'Create an account to track your upcoming launches & events'}
          </p>
        </div>

        {/* Auth Mode Toggle */}
        <div className="auth-tabs" style={{ display: 'flex', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className={`filter-tab ${mode === 'login' ? 'active' : ''}`}
            style={{ flex: 1, textAlign: 'center' }}
            onClick={() => {
              setMode('login');
              setError('');
              setSuccessMessage('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`filter-tab ${mode === 'register' ? 'active' : ''}`}
            style={{ flex: 1, textAlign: 'center' }}
            onClick={() => {
              setMode('register');
              setError('');
              setSuccessMessage('');
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: '16px' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="celebration-box" style={{ marginBottom: '16px', padding: '10px 14px' }}>
            <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem' }}>✓ {successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder="e.g. akarsh or alex"
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

          {mode === 'register' && (
            <div className="input-group">
              <label className="input-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
            {loading
              ? mode === 'login'
                ? 'Signing in...'
                : 'Creating account...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Free Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {mode === 'login' ? (
              <>Don't have an account? <span style={{ color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setMode('register')}>Sign up now</span></>
            ) : (
              <>Already have an account? <span style={{ color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setMode('login')}>Sign in</span></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;