import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import SharedCountdown from './components/SharedCountdown';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('access_token')
  );

  const [sharedData, setSharedData] = useState(null);

  useEffect(() => {
    // Check if user navigated to a shared link
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('share') === 'true' && searchParams.get('title')) {
      setSharedData({
        title: searchParams.get('title'),
        date: searchParams.get('date'),
        category: searchParams.get('category'),
        notes: searchParams.get('notes'),
      });
    }

    const handleAuthChange = () => {
      setIsAuthenticated(!!localStorage.getItem('access_token'));
    };

    window.addEventListener('auth-changed', handleAuthChange);
    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
  };

  const handleOpenAppFromShare = () => {
    // Clear the share query param from URL without reloading
    const newUrl = window.location.origin + window.location.pathname;
    window.history.pushState({}, '', newUrl);
    setSharedData(null);
  };

  if (sharedData) {
    return <SharedCountdown sharedData={sharedData} onOpenApp={handleOpenAppFromShare} />;
  }

  return (
    <div className="App">
      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;