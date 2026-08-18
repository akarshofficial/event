import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import API, { getEngineMode, setEngineMode } from '../api';
import CountdownCard from './CountdownCard';

const Dashboard = ({ onLogout }) => {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('launch');
  const [notes, setNotes] = useState('');
  const [pinned, setPinned] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'expired', 'pinned'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('soonest'); // 'soonest', 'furthest', 'title', 'newest'
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [notification, setNotification] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [engineMode, setEngineModeState] = useState(getEngineMode());

  const fileInputRef = useRef(null);
  const username = localStorage.getItem('username') || 'Explorer';

  // Listen to engine mode changes
  useEffect(() => {
    const handleEngineChange = (e) => {
      setEngineModeState(e.detail || getEngineMode());
    };
    window.addEventListener('engine-mode-changed', handleEngineChange);
    return () => window.removeEventListener('engine-mode-changed', handleEngineChange);
  }, []);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const fetchEvents = useCallback(async () => {
    try {
      setErrorMessage('');
      const response = await API.get('events/');
      setEvents(response.data || []);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setErrorMessage('Could not connect to live server. Local client fallback is active.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Quick Preset Helper
  const applyPreset = (type) => {
    const now = new Date();
    let target = new Date();

    if (type === '10m') {
      target.setMinutes(now.getMinutes() + 10);
    } else if (type === '1h') {
      target.setHours(now.getHours() + 1);
    } else if (type === '1d') {
      target.setDate(now.getDate() + 1);
      target.setHours(9, 0, 0, 0); // 9 AM tomorrow
    } else if (type === '7d') {
      target.setDate(now.getDate() + 7);
    } else if (type === '30d') {
      target.setDate(now.getDate() + 30);
    } else if (type === 'newyear') {
      target = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0);
    }

    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const hours = String(target.getHours()).padStart(2, '0');
    const mins = String(target.getMinutes()).padStart(2, '0');

    setTargetDate(`${year}-${month}-${day}T${hours}:${mins}`);
  };

  // Add Event Handler
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;

    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        title: title.trim(),
        target_date: new Date(targetDate).toISOString(),
        category,
        notes: notes.trim(),
        color: 'blue',
        pinned,
      };

      const response = await API.post('events/', payload);
      setEvents((prev) => [response.data, ...prev]);
      setTitle('');
      setTargetDate('');
      setNotes('');
      setPinned(false);
      showNotification(`🎉 Added countdown for "${response.data.title}"!`);
    } catch (err) {
      console.error('Failed to create event:', err);
      setErrorMessage('Failed to save event.');
    } finally {
      setSubmitting(false);
    }
  };

  // Update Event
  const handleUpdateEvent = async (id, updatedData) => {
    try {
      const res = await API.put(`events/${id}/`, updatedData);
      setEvents((prev) => prev.map((evt) => (evt.id === id ? res.data || updatedData : evt)));
      showNotification('✓ Event updated successfully!');
    } catch (err) {
      console.error('Failed to update event:', err);
      setEvents((prev) => prev.map((evt) => (evt.id === id ? updatedData : evt)));
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id) => {
    const toDelete = events.find((e) => e.id === id);
    if (!toDelete) return;

    try {
      await API.delete(`events/${id}/`);
      setEvents((prev) => prev.filter((evt) => evt.id !== id));
      showNotification(`🗑️ Deleted "${toDelete.title}"`);
    } catch (err) {
      console.error('Failed to delete event:', err);
      setEvents((prev) => prev.filter((evt) => evt.id !== id));
      showNotification(`🗑️ Deleted "${toDelete.title}"`);
    }
  };

  // Export Events to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `countdown_events_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('📥 Backup exported as JSON!');
  };

  // Import Events from JSON
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        if (Array.isArray(imported)) {
          let count = 0;
          for (const item of imported) {
            if (item.title && item.target_date) {
              const res = await API.post('events/', {
                title: item.title,
                target_date: item.target_date,
                category: item.category || 'milestone',
                notes: item.notes || '',
                color: item.color || 'blue',
                pinned: !!item.pinned,
              });
              setEvents((prev) => [res.data, ...prev]);
              count++;
            }
          }
          showNotification(`✨ Successfully imported ${count} events!`);
        }
      } catch (err) {
        setErrorMessage('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Toggle Engine Mode (Live Server vs Offline Storage)
  const toggleEngineMode = () => {
    const nextMode = engineMode === 'live' ? 'client' : 'live';
    setEngineMode(nextMode);
    setEngineModeState(nextMode);
    fetchEvents();
    showNotification(`Switched to ${nextMode === 'live' ? 'Live API' : 'Offline Client Engine'}`);
  };

  // Filter & Search computation
  const filteredEvents = useMemo(() => {
    const now = Date.now();
    return events
      .filter((evt) => {
        const isExpired = new Date(evt.target_date).getTime() <= now;

        if (filter === 'active' && isExpired) return false;
        if (filter === 'expired' && !isExpired) return false;
        if (filter === 'pinned' && !evt.pinned) return false;

        if (categoryFilter !== 'all' && evt.category !== categoryFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            evt.title?.toLowerCase().includes(q) ||
            evt.notes?.toLowerCase().includes(q) ||
            evt.category?.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy !== 'title') {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
        }

        if (sortBy === 'soonest') {
          return new Date(a.target_date) - new Date(b.target_date);
        }
        if (sortBy === 'furthest') {
          return new Date(b.target_date) - new Date(a.target_date);
        }
        if (sortBy === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }
        if (sortBy === 'newest') {
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }
        return 0;
      });
  }, [events, filter, categoryFilter, sortBy, searchQuery]);

  const activeCount = useMemo(() => {
    const now = Date.now();
    return events.filter((evt) => new Date(evt.target_date).getTime() > now).length;
  }, [events]);

  const arrivedCount = events.length - activeCount;

  // Next upcoming event
  const nextUpcoming = useMemo(() => {
    const now = Date.now();
    const future = events.filter((e) => new Date(e.target_date).getTime() > now);
    if (future.length === 0) return null;
    return future.sort((a, b) => new Date(a.target_date) - new Date(b.target_date))[0];
  }, [events]);

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {notification && (
        <div className="toast-notification">
          <span>{notification}</span>
        </div>
      )}

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="brand-icon">⏳</div>
          <div>
            <span className="brand-title">Event Countdown</span>
            <span className="brand-badge">PRO</span>
          </div>
        </div>

        <div className="nav-actions">
          {/* Engine Mode Pill */}
          <button
            onClick={toggleEngineMode}
            className="engine-toggle-badge"
            title="Click to toggle between Live Server API and Offline Local Engine"
          >
            <span className={`status-dot ${engineMode === 'live' ? 'online' : 'offline'}`}></span>
            <span>{engineMode === 'live' ? 'API: Connected' : 'Offline Mode (Local Storage)'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="btn-icon"
            title={soundEnabled ? 'Completion Sound: ON' : 'Completion Sound: MUTED'}
          >
            {soundEnabled ? '🔔' : '🔕'}
          </button>

          {/* Backup / Restore Menu */}
          <button
            onClick={handleExportJSON}
            className="btn-icon"
            title="Export Backups (.JSON)"
          >
            📥
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-icon"
            title="Import Backups (.JSON)"
          >
            📤
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={handleImportJSON}
          />

          {/* Logout */}
          <button onClick={onLogout} className="btn-logout">
            Sign Out ({username})
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Next Up Highlight Banner */}
        {nextUpcoming && (
          <div className="spotlight-banner">
            <div className="spotlight-left">
              <span className="spotlight-tag">⚡ NEXT UPCOMING MILESTONE</span>
              <h2 className="spotlight-title">{nextUpcoming.title}</h2>
              <span className="spotlight-date">
                📅 {new Date(nextUpcoming.target_date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <button
              className="btn-primary spotlight-btn"
              onClick={() => {
                setSearchQuery(nextUpcoming.title);
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
            >
              Focus Countdown 🎯
            </button>
          </div>
        )}

        {/* Dashboard Header & Stats */}
        <div className="dashboard-header">
          <div className="header-text">
            <h1>Welcome back, {username}!</h1>
            <p className="dashboard-subtitle">Track your upcoming launches, deadlines, celebrations, and personal milestones in real-time.</p>
          </div>

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
            <div className="form-grid">
              <div className="input-group">
                <label className="input-label" htmlFor="event-title">Event Title</label>
                <input
                  id="event-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 🚀 Version 2.0 Launch, 🎂 Birthday, 🎓 Final Exam"
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

              <div className="input-group">
                <label className="input-label" htmlFor="event-category">Category</label>
                <select
                  id="event-category"
                  className="form-input form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="launch">🚀 Product Launch</option>
                  <option value="celebration">🎉 Celebration / Party</option>
                  <option value="birthday">🎂 Birthday / Anniversary</option>
                  <option value="exam">🎓 Exam / Deadline</option>
                  <option value="travel">✈️ Travel / Holiday</option>
                  <option value="work">💼 Work / Project</option>
                  <option value="milestone">🏆 Milestone / Goal</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="event-notes">Notes / Goals (Optional)</label>
                <input
                  id="event-notes"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Prepare presentation slides & invite team"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Presets & Actions Row */}
            <div className="form-footer-row">
              <div className="presets-container">
                <span className="presets-label">Quick Presets:</span>
                <button type="button" className="preset-chip" onClick={() => applyPreset('10m')}>+10 Mins</button>
                <button type="button" className="preset-chip" onClick={() => applyPreset('1h')}>+1 Hour</button>
                <button type="button" className="preset-chip" onClick={() => applyPreset('1d')}>Tomorrow 9 AM</button>
                <button type="button" className="preset-chip" onClick={() => applyPreset('7d')}>+1 Week</button>
                <button type="button" className="preset-chip" onClick={() => applyPreset('30d')}>+1 Month</button>
                <button type="button" className="preset-chip" onClick={() => applyPreset('newyear')}>New Year</button>
              </div>

              <div className="form-submit-actions">
                <label className="pin-checkbox-label">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                  />
                  <span>📌 Pin to Top</span>
                </label>

                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Adding...' : '+ Add Countdown'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Controls Bar (Filter, Category, Sort, Search) */}
        <div className="controls-bar">
          <div className="filter-group">
            {/* Status Filter Tabs */}
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
              <button
                className={`filter-tab ${filter === 'pinned' ? 'active' : ''}`}
                onClick={() => setFilter('pinned')}
              >
                📌 Pinned
              </button>
            </div>

            {/* Category Filter */}
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="launch">🚀 Launches</option>
              <option value="celebration">🎉 Celebrations</option>
              <option value="birthday">🎂 Birthdays</option>
              <option value="exam">🎓 Exams / Deadlines</option>
              <option value="travel">✈️ Travel</option>
              <option value="work">💼 Work</option>
              <option value="milestone">🏆 Milestones</option>
            </select>
          </div>

          <div className="search-and-sort">
            {/* Sort Dropdown */}
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="soonest">Sort: Soonest First ⏳</option>
              <option value="furthest">Sort: Furthest First 📅</option>
              <option value="title">Sort: Title (A-Z) 🔤</option>
              <option value="newest">Sort: Recently Added 🕒</option>
            </select>

            {/* Search Box */}
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search countdowns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>
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
              {searchQuery || categoryFilter !== 'all' || filter !== 'all'
                ? 'No matching countdowns found.'
                : 'No countdown events yet.'}
            </p>
            <p style={{ fontSize: '0.875rem' }}>
              {searchQuery || categoryFilter !== 'all' || filter !== 'all'
                ? 'Try resetting filters or adjusting search terms.'
                : 'Create your first event above to start tracking time!'}
            </p>
            {(searchQuery || categoryFilter !== 'all' || filter !== 'all') && (
              <button
                className="btn-secondary"
                style={{ marginTop: '16px' }}
                onClick={() => {
                  setFilter('all');
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((event) => (
              <CountdownCard
                key={event.id}
                event={event}
                onUpdate={handleUpdateEvent}
                onDelete={handleDeleteEvent}
                soundEnabled={soundEnabled}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;