import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formState, setFormState] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormState((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formState.phone.trim(), formState.password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-kicker">GDK Chit Fund</p>
        <h1>Admin Sign In</h1>
        <p className="auth-subtitle">Use your admin phone and password to continue.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Phone Number
            <input
              name="phone"
              type="tel"
              placeholder="Enter 10-digit phone"
              value={formState.phone}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              placeholder="Enter password"
              value={formState.password}
              onChange={handleChange}
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
      <div className="auth-panel">
        <div>
          <h2>Admin-only portal</h2>
          <p>Track collections, manage members, and create new groups from the web dashboard.</p>
          <ul>
            <li>Real-time group and user management</li>
            <li>Quick actions for new members</li>
            <li>Reports and payment monitoring</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
