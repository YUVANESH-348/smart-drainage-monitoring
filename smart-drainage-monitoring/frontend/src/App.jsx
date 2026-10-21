import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Alerts from './pages/Alerts';
import Login from './pages/Login';
import SystemInfo from './pages/SystemInfo';

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('drainageUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogin = (loggedInUser) => {
    localStorage.setItem(
      'drainageUser',
      JSON.stringify(loggedInUser)
    );

    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('drainageUser');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <Sidebar user={user} onLogout={handleLogout} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/system" element={<SystemInfo />} />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </main>
    </div>
  );
}