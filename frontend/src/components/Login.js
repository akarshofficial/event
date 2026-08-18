import React, { useState } from 'react';
import API, { setEngineMode } from '../api';

const Login = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInstantGuest = async () => {
    setLoading(true);
    setError('');
    try {
      localStorage.setItem('access_token', 'client_guest_demo_token');
      localStorage.setItem('username', 'guest');
      setSuccessMessage('Welcome! Starting Instant Guest Session...');
      setTimeout(() => {
        onLoginSuccess();
      }, 350);
    } catch (e) {
      setError('Could not start guest session.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrefillAdmin = () => {
    setUsername('admin');
    setPassword('admin123');
    setMode('login');
    setError('');
  };

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
          }, 350);
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
          localStorage.setItem('username', res.data.username || username.trim());
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
      } else {
        setEngineMode('client');
        setError('Connected in offline client mode. You can sign in or use guest access!');
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
              ? 'Sign in to track deadlines, celebrations, and launches in real-time.'
              : 'Create an account to start organizing your personal milestones.'}
          </p>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="quick-access-box">
          <button
            type="button"
            className="btn-guest"
            onClick={handleInstantGuest}
            disabled={loading}
          >
            ⚡ Instant Demo / Guest Mode
          </button>
          <button
            type="button"
            className="btn-link-subtle"
            onClick={handlePrefillAdmin}
          >
            👤 Autofill Admin (admin/admin123)
          </button>
        </div>

        <div className="auth-divider">
          <span>OR SIGN IN WITH USERNAME</span>
        </div>

        {/* Auth Mode Toggle */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`filter-tab ${mode === 'login' ? 'active' : ''}`}
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
          <div className="error-banner">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="celebration-box" style={{ padding: '10px 14px', marginBottom: '16px' }}>
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
              placeholder="e.g. admin or akarsh"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label" htmlFor="password">Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn-link-subtle"
                style={{ fontSize: '0.75rem', padding: 0 }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
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
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '6px' }}>
            {loading
              ? mode === 'login'
                ? 'Authenticating...'
                : 'Creating account...'
              : mode === 'login'
              ? 'Sign In to Dashboard'
              : 'Create Free Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {mode === 'login' ? (
              <>New here? <span className="auth-switch-link" onClick={() => setMode('register')}>Create an account</span></>
            ) : (
              <>Have an account? <span className="auth-switch-link" onClick={() => setMode('login')}>Sign in</span></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;