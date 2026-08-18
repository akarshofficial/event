import React, { useState, useEffect } from 'react';
import { downloadCalendarEvent, playCompletionChime } from '../api';

const SharedCountdown = ({ sharedData, onOpenApp }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  const [chimePlayed, setChimePlayed] = useState(false);
  const [copied, setCopied] = useState(false);

  const title = sharedData.title || 'Special Event';
  const targetDate = sharedData.date || new Date().toISOString();
  const notes = sharedData.notes || '';

  useEffect(() => {
    const calculateTime = () => {
      const targetTime = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true,
        });

        if (!chimePlayed) {
          playCompletionChime();
          setChimePlayed(true);
        }
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        expired: false,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate, chimePlayed]);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCalendar = () => {
    downloadCalendarEvent({
      title,
      target_date: targetDate,
      notes,
    });
  };

  return (
    <div className="shared-view-wrapper">
      <div className="shared-card">
        <div className="shared-header">
          <div className="shared-badge">
            <span>⏳</span>
            <span>Live Countdown Preview</span>
          </div>
          <h1 className="shared-title">{title}</h1>
          <p className="shared-date">
            📅 {new Date(targetDate).toLocaleString(undefined, {
              dateStyle: 'full',
              timeStyle: 'short',
            })}
          </p>
          {notes && <p className="shared-notes">"{notes}"</p>}
        </div>

        {timeLeft.expired ? (
          <div className="celebration-box" style={{ padding: '24px', margin: '24px 0' }}>
            <div className="celebration-title" style={{ fontSize: '1.4rem' }}>
              <span>🎉</span>
              <span>The Milestone Has Arrived!</span>
            </div>
            <p className="celebration-subtitle">This event has commenced.</p>
          </div>
        ) : (
          <div className="timer-container shared-timer" style={{ margin: '28px 0' }}>
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
              <span className="timer-unit">Minutes</span>
            </div>
            <div className="timer-box">
              <span className="timer-num seconds-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="timer-unit">Seconds</span>
            </div>
          </div>
        )}

        <div className="shared-actions">
          <button className="btn-secondary" onClick={handleCopyLink}>
            {copied ? '✓ Link Copied' : '🔗 Copy Share Link'}
          </button>
          <button className="btn-secondary" onClick={handleDownloadCalendar}>
            📅 Add to Calendar (.ics)
          </button>
          <button className="btn-primary" onClick={onOpenApp}>
            ✨ Open Full App & Track Countdowns
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharedCountdown;
