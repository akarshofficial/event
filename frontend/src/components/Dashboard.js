import React, { useState, useEffect } from 'react';
import API from '../api';
import CountdownCard from './CountdownCard';

const Dashboard = ({ onLogout }) => {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');

  const fetchEvents = async () => {
    try {
      const response = await API.get('events/');
      setEvents(response.data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!title || !targetDate) return;

    try {
      const response = await API.post('events/', {
        title,
        target_date: new Date(targetDate).toISOString(),
      });
      setEvents([...events, response.data]);
      setTitle('');
      setTargetDate('');
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await API.delete(`events/${id}/`);
      setEvents(events.filter((evt) => evt.id !== id));
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>⏰ Event Countdown Dashboard</h2>
        <button onClick={onLogout} style={{ padding: '8px 16px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      <form onSubmit={handleAddEvent} style={styles.form}>
        <input
          type="text"
          placeholder="Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="datetime-local"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Add Event</button>
      </form>

      <div style={styles.grid}>
        {events.map((event) => (
          <CountdownCard key={event.id} event={event} onDelete={handleDeleteEvent} />
        ))}
      </div>
    </div>
  );
};

const styles = {
  form: { display: 'flex', gap: '10px', marginBottom: '30px' },
  input: { flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' },
  button: { padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }
};

export default Dashboard;