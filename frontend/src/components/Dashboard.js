import React, { useState, useEffect, useMemo, useCallback } from 'react';
import API, { BASE_API_URL } from '../api';
import CountdownCard from './CountdownCard';

const Dashboard = ({ onLogout }) => {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'expired'
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const username = localStorage.getItem('username') || 'User';

  const fetchEvents = useCallback(async () => {
    try {
      setErrorMessage('');
      const response = await API.get('events/');
      setEvents(response.data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setErrorMessage('Could not load events from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Quick preset helper
  const applyPreset = (type) => {
    const now = new Date();
    let target = new Date();

    if (type === '1h') {
      target.setHours(now.getHours() + 1);
    } else if (type === '1d') {
      target.setDate(now.getDate() + 1);
    } else if (type === '7d') {
      target.setDate(now.getDate() + 7);
    } else if (type === '30d') {
      target.setDate(now.getDate() + 30);
    } else if (type === 'newyear') {
      target = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0);
    }

    // Format to YYYY-MM-DDTHH:MM for datetime-local input
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const hours = String(target.getHours()).padStart(2, '0');
    const mins = String(target.getMinutes()).padStart(2, '0');

    setTargetDate(`${year}-${month}-${day}T${hours}:${mins}`);
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      const response = await API.post('events/', {
        title: title.trim(),
        target_date: new Date(targetDate).toISOString(),
      });
      setEvents((prev) => [...prev, response.data]);
      setTitle('');
      setTargetDate('');
    } catch (err) {
      console.error('Failed to create event:', err);
      setErrorMessage('Failed to save event. Please check backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await API.delete(`events/${id}/`);
      setEvents((prev) => prev.filter((evt) => evt.id !== id));
    } catch (err) {
      console.error('Failed to delete event:', err);
      setErrorMessage('Failed to delete event.');
    }
  };

  // Filter and search computation
  const filteredEvents = useMemo(() => {
    const now = new Date().getTime();
    return events.filter((evt) => {
      const isExpired = new Date(evt.target_date).getTime() <= now;
      if (filter === 'active' && isExpired) return false;
      if (filter === 'expired' && !isExpired) return false;

      if (searchQuery.trim()) {
        return evt.title.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [events, filter, searchQuery]);

  const activeCount = useMemo(() => {
    const now = new Date().getTime();
    return events.filter((evt) => new Date(evt.target_date).getTime() > now).length;
  }, [events]);

  const arrivedCount = events.length - activeCount;

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="brand-icon">⏳</div>
          <span className="brand-title">Event Countdown</span>
        </div>

        <div className="nav-actions">
          <div className="server-badge">
            <span className="status-dot"></span>
            <span>API: {BASE_API_URL.replace('http://', '').replace('https://', '').replace(/\/$/, '')}</span>
          </div>

          <button onClick={onLogout} className="btn-logout">
            Sign Out ({username})
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="main-content">
        {/* Dashboard Header & Stats */}
        <div className="dashboard-header">
          <h1>Welcome back, {username}!</h1>
          <p className="dashboard-subtitle">Track your upcoming launches, deadlines, and milestones in real-time.</p>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Events</span>
              <span className="stat-value">{events.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Active Countdowns</span>
              <span className="stat-value" style={{ color: '#60a5fa' }}>{activeCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Completed Milestones</span>
              <span className="stat-value" style={{ color: '#34d399' }}>{arrivedCount}</span>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="error-banner" style={{ marginBottom: '20px' }}>
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Create Event Card */}
        <div className="create-card">
          <h2 className="create-card-title">
            <span>✨</span>
            <span>Create New Countdown</span>
          </h2>

          <form onSubmit={handleAddEvent}>
            <div className="form-row">
              <div className="input-group">
                <label className="input-label" htmlFor="event-title">Event Title</label>
                <input
                  id="event-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Product Launch, Birthday, Final Exam"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="target-date">Target Date & Time</label>
                <input
                  id="target-date"
                  type="datetime-local"
                  className="form-input"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Adding...' : '+ Add Event'}
              </button>
            </div>

            {/* Presets */}
            <div className="presets-container">
              <span className="presets-label">Quick Presets:</span>
              <button type="button" className="preset-chip" onClick={() => applyPreset('1h')}>+1 Hour</button>
              <button type="button" className="preset-chip" onClick={() => applyPreset('1d')}>Tomorrow</button>
              <button type="button" className="preset-chip" onClick={() => applyPreset('7d')}>+1 Week</button>
              <button type="button" className="preset-chip" onClick={() => applyPreset('30d')}>+1 Month</button>
              <button type="button" className="preset-chip" onClick={() => applyPreset('newyear')}>New Year</button>
            </div>
          </form>
        </div>

        {/* Search & Filters */}
        <div className="controls-bar">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({events.length})
            </button>
            <button
              className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active ({activeCount})
            </button>
            <button
              className={`filter-tab ${filter === 'expired' ? 'active' : ''}`}
              onClick={() => setFilter('expired')}
            >
              Arrived ({arrivedCount})
            </button>
          </div>

          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search countdowns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p className="empty-text">Loading your countdowns...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎈</div>
            <p className="empty-text">
              {searchQuery ? 'No matching countdowns found.' : 'No countdown events yet.'}
            </p>
            <p style={{ fontSize: '0.875rem' }}>
              {searchQuery ? 'Try adjusting your search query.' : 'Add your first event using the form above to start tracking!'}
            </p>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((event) => (
              <CountdownCard key={event.id} event={event} onDelete={handleDeleteEvent} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;