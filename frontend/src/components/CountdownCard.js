import React, { useState, useEffect } from 'react';

const CountdownCard = ({ event, onDelete }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
    totalSecondsRemaining: 0,
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const targetTime = new Date(event.target_date).getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
          totalSecondsRemaining: 0,
        });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        expired: false,
        totalSecondsRemaining: Math.floor(difference / 1000),
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [event.target_date]);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleShare = () => {
    const text = `Countdown for "${event.title}": ${
      timeLeft.expired
        ? 'Event has arrived!'
        : `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s remaining`
    }`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`event-card ${timeLeft.expired ? 'expired' : ''}`}>
      <div>
        <div className="card-top">
          <h3 className="event-title">{event.title}</h3>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={handleShare}
              className="delete-btn"
              title="Copy countdown summary"
              style={{ fontSize: '0.9rem' }}
            >
              {copied ? '✓' : '🔗'}
            </button>
            <button
              onClick={() => onDelete(event.id)}
              className="delete-btn"
              title="Delete Event"
              aria-label="Delete Event"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="target-meta">
          <span>📅</span>
          <span>{formatDate(event.target_date)}</span>
        </div>
      </div>

      {timeLeft.expired ? (
        <div className="celebration-box">
          <div className="celebration-title">
            <span>🎉</span>
            <span>Event Arrived!</span>
          </div>
          <p className="celebration-subtitle">This milestone has been reached.</p>
        </div>
      ) : (
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
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        <span>ID #{event.id}</span>
        <span>{timeLeft.expired ? 'Status: Completed' : 'Status: In Progress'}</span>
      </div>
    </div>
  );
};

export default CountdownCard;