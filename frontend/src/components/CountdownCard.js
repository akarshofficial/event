import React, { useState, useEffect } from 'react';
import { downloadCalendarEvent, playCompletionChime } from '../api';

const CATEGORY_MAP = {
  launch: { icon: '🚀', label: 'Launch', color: '#3b82f6' },
  celebration: { icon: '🎉', label: 'Celebration', color: '#a855f7' },
  birthday: { icon: '🎂', label: 'Birthday', color: '#ec4899' },
  exam: { icon: '🎓', label: 'Exam / Deadline', color: '#f59e0b' },
  travel: { icon: '✈️', label: 'Travel', color: '#06b6d4' },
  work: { icon: '💼', label: 'Work', color: '#6366f1' },
  milestone: { icon: '🏆', label: 'Milestone', color: '#10b981' },
};

const CountdownCard = ({ event, onUpdate, onDelete, soundEnabled }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
    percentElapsed: 0,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(event.title || '');
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState(event.category || 'milestone');
  const [editNotes, setEditNotes] = useState(event.notes || '');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chimeFired, setChimeFired] = useState(false);

  useEffect(() => {
    // Format for datetime-local input
    if (event.target_date) {
      const d = new Date(event.target_date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      setEditDate(`${year}-${month}-${day}T${hours}:${mins}`);
    }
  }, [event.target_date]);

  useEffect(() => {
    const calculate = () => {
      const target = new Date(event.target_date).getTime();
      const created = event.created_at ? new Date(event.created_at).getTime() : target - 7 * 86400000;
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
          percentElapsed: 100,
        });

        if (!chimeFired && soundEnabled) {
          playCompletionChime();
          setChimeFired(true);
        }
        return;
      }

      const totalSpan = target - created;
      const elapsedSpan = now - created;
      const percent = totalSpan > 0 ? Math.min(100, Math.max(0, Math.round((elapsedSpan / totalSpan) * 100))) : 0;

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        expired: false,
        percentElapsed: percent,
      });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [event.target_date, event.created_at, chimeFired, soundEnabled]);

  const categoryMeta = CATEGORY_MAP[event.category] || CATEGORY_MAP.milestone;

  const handleTogglePin = () => {
    if (onUpdate) {
      onUpdate(event.id, { ...event, pinned: !event.pinned });
    }
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDate) return;

    if (onUpdate) {
      onUpdate(event.id, {
        ...event,
        title: editTitle.trim(),
        target_date: new Date(editDate).toISOString(),
        category: editCategory,
        notes: editNotes.trim(),
      });
    }
    setIsEditing(false);
  };

  const getShareUrl = () => {
    const origin = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
      share: 'true',
      title: event.title,
      date: event.target_date,
      category: event.category || 'milestone',
      notes: event.notes || '',
    });
    return `${origin}?${params.toString()}`;
  };

  const handleCopyShare = () => {
    navigator.clipboard?.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadICS = () => {
    downloadCalendarEvent(event);
  };

  return (
    <div className={`event-card ${timeLeft.expired ? 'expired' : ''} ${event.pinned ? 'pinned' : ''}`}>
      {/* Pinned Marker */}
      {event.pinned && (
        <div className="pinned-badge" title="Pinned to top">
          📌 Pinned
        </div>
      )}

      {/* Card Header */}
      <div className="card-top">
        <div>
          <div className="category-pill" style={{ color: categoryMeta.color }}>
            <span>{categoryMeta.icon}</span>
            <span>{categoryMeta.label}</span>
          </div>
          <h3 className="event-title">{event.title}</h3>
        </div>

        {/* Action icons */}
        <div className="card-actions">
          <button
            onClick={handleTogglePin}
            className={`action-btn ${event.pinned ? 'active' : ''}`}
            title={event.pinned ? 'Unpin event' : 'Pin to top'}
          >
            📌
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="action-btn"
            title="Share countdown"
          >
            🔗
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="action-btn"
            title="Edit event"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="action-btn delete-btn"
            title="Delete event"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Target Date & Meta */}
      <div className="target-meta">
        <span>📅</span>
        <span>
          {new Date(event.target_date).toLocaleDateString(undefined, {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Notes if present */}
      {event.notes && (
        <p className="card-notes">"{event.notes}"</p>
      )}

      {/* Timer or Arrived Celebration */}
      {timeLeft.expired ? (
        <div className="celebration-box">
          <div className="celebration-title">
            <span>🎉</span>
            <span>Milestone Reached!</span>
          </div>
          <p className="celebration-subtitle">This event has commenced.</p>
        </div>
      ) : (
        <>
          <div className="timer-container">
            <div className="timer-box">
              <span className="timer-num">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="timer-unit">Days</span>
            </div>
            <div className="timer-box">
              <span className="timer-num">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="timer-unit">Hours</span>
            </div>
            <div className="timer-box">
              <span className="timer-num">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="timer-unit">Mins</span>
            </div>
            <div className="timer-box">
              <span className="timer-num seconds-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="timer-unit">Secs</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-wrapper">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${timeLeft.percentElapsed}%` }}
              ></div>
            </div>
            <span className="progress-text">{timeLeft.percentElapsed}% elapsed</span>
          </div>
        </>
      )}

      {/* Card Footer */}
      <div className="card-footer">
        <button className="btn-chip" onClick={handleDownloadICS} title="Add to Calendar">
          📅 .ics Calendar
        </button>
        <button className="btn-chip" onClick={handleCopyShare}>
          {copied ? '✓ Copied' : '🔗 Share'}
        </button>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit Countdown</h3>
              <button className="modal-close" onClick={() => setIsEditing(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="input-group">
                <label className="input-label">Event Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Target Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Category</label>
                <select
                  className="form-input form-select"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  <option value="launch">🚀 Product Launch</option>
                  <option value="celebration">🎉 Celebration / Party</option>
                  <option value="birthday">🎂 Birthday / Anniversary</option>
                  <option value="exam">🎓 Exam / Academic Deadline</option>
                  <option value="travel">✈️ Travel / Vacation</option>
                  <option value="work">💼 Work / Meeting</option>
                  <option value="milestone">🏆 Milestone / Personal Goal</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Notes & Description (Optional)</label>
                <textarea
                  className="form-input form-textarea"
                  rows="2"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add details, location, or goals..."
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔗 Share "{event.title}"</h3>
              <button className="modal-close" onClick={() => setShowShareModal(false)}>✕</button>
            </div>
            <p className="modal-description">
              Anyone with this link can view this live countdown directly without having to sign up!
            </p>

            <div className="share-box">
              <input
                type="text"
                readOnly
                className="form-input"
                value={getShareUrl()}
              />
              <button className="btn-primary" onClick={handleCopyShare}>
                {copied ? '✓ Copied' : 'Copy Link'}
              </button>
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn-secondary" onClick={handleDownloadICS}>
                📅 Download .ICS File
              </button>
              <button className="btn-secondary" onClick={() => setShowShareModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CountdownCard;