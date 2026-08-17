import React, { useState, useEffect } from 'react';

const CountdownCard = ({ event, onDelete }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(event.target_date) - new Date();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        expired: false,
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [event.target_date]);

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={{ margin: 0 }}>{event.title}</h3>
        <button onClick={() => onDelete(event.id)} style={styles.deleteBtn}>✕</button>
      </div>
      <p style={styles.targetDate}>
        Target: {new Date(event.target_date).toLocaleString()}
      </p>

      {timeLeft.expired ? (
        <div style={styles.expiredBadge}>🎉 Event Arrived!</div>
      ) : (
        <div style={styles.grid}>
          <div style={styles.timeBox}><span style={styles.number}>{timeLeft.days}</span><label>Days</label></div>
          <div style={styles.timeBox}><span style={styles.number}>{timeLeft.hours}</span><label>Hours</label></div>
          <div style={styles.timeBox}><span style={styles.number}>{timeLeft.minutes}</span><label>Mins</label></div>
          <div style={styles.timeBox}><span style={styles.number}>{timeLeft.seconds}</span><label>Secs</label></div>
        </div>
      )}
    </div>
  );
};

const styles = {
  card: { border: '1px solid #ddd', borderRadius: '8px', padding: '16px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  deleteBtn: { background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '18px' },
  targetDate: { fontSize: '12px', color: '#666', marginBottom: '16px' },
  expiredBadge: { padding: '8px', background: '#e6fffa', color: '#234e52', fontWeight: 'bold', textAlign: 'center', borderRadius: '4px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' },
  timeBox: { background: '#f7fafc', padding: '8px', borderRadius: '4px', border: '1px solid #edf2f7', display: 'flex', flexDirection: 'column' },
  number: { fontSize: '18px', fontWeight: 'bold' }
};

export default CountdownCard;