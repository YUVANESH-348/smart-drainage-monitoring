import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        onLogin(data.user);
      } else {
        setError(data.message || 'Invalid username or password');
      }
    } catch (err) {
      setError('Cannot connect to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-logo">
          SD
        </div>

        <h1 className="login-title">
          SmartDrain
        </h1>

        <p className="login-subtitle">
          Smart Drainage Monitoring System
        </p>

        <form onSubmit={handleLogin}>

          <label className="login-label">
            Username
          </label>

          <input
            className="login-input"
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label className="login-label">
            Password
          </label>

          <input
            className="login-input"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? 'AUTHENTICATING...' : 'LOGIN'}
          </button>

        </form>

        <div className="login-footer">
          Secure Monitoring Portal · ESP32 Enabled
        </div>

      </div>
    </div>
  );
}

export default Login;