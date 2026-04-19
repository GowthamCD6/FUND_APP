import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  RiSmartphoneLine, RiPhoneLine, RiLockLine, RiKeyLine,
  RiEyeLine, RiEyeOffLine, RiAlertLine, RiLoader4Line,
  RiArrowRightLine, RiShieldLine, RiMoneyDollarCircleLine,
  RiBarChartLine,
} from '../../icons.jsx';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formState, setFormState] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const FEATURES = [
    { Icon: RiShieldLine,               title: 'Real-time Management', desc: 'Track collections, manage members, and create new groups from the dashboard.' },
    { Icon: RiMoneyDollarCircleLine,    title: 'Payment Monitoring',   desc: 'View paid, partial, and overdue statuses with instant reports.' },
    { Icon: RiBarChartLine,             title: 'Reports & Analytics',  desc: 'Monthly collection reports and group performance insights.' },
  ];

  return (
    <div className="auth-page">
      {/* ── Left: Form ── */}
      <div className="auth-card">
        {/* Brand badge */}
        <div className="auth-logo-badge">
          <span />
          GDK Admin Portal
        </div>

        <h1 className="auth-heading">Welcome Back!</h1>
        <p className="auth-subheading">Login to continue your journey</p>
        <div className="auth-line" />

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Phone */}
          <div className="auth-field">
            <label htmlFor="login-phone" className="auth-label">
              <span className="auth-label-icon"><RiSmartphoneLine size={14} /></span>
              Mobile Number
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon" aria-hidden="true"><RiPhoneLine size={16} /></span>
              <input
                id="login-phone"
                name="phone"
                type="tel"
                placeholder="Enter 10-digit phone number"
                value={formState.phone}
                onChange={handleChange}
                required
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field">
            <label htmlFor="login-password" className="auth-label">
              <span className="auth-label-icon"><RiLockLine size={14} /></span>
              Password
            </label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon" aria-hidden="true"><RiKeyLine size={16} /></span>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formState.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot */}
          <div className="auth-forgot">
            <a href="#">Forgot Password?</a>
          </div>

          {/* Error */}
          {error && (
            <p className="form-error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RiAlertLine size={15} style={{ flexShrink: 0 }} /> {error}
            </p>
          )}

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <RiLoader4Line size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                Signing in...
              </>
            ) : (
              <>
                LOGIN <RiArrowRightLine size={18} />
              </>
            )}
          </button>
        </form>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .auth-submit { display:flex; align-items:center; justify-content:center; gap:8px; }
          .auth-label-icon { display:inline-flex; align-items:center; }
        `}</style>
      </div>

      {/* ── Right: Info Panel ── */}
      <div className="auth-panel">
        <div className="auth-panel-inner">
          <p className="auth-panel-company">GDK Chit Fund</p>
          <h2 className="auth-panel-name">ஸ்ரீ பெரியநாயகி அம்மன்</h2>
          <p className="auth-panel-tagline">Admin-only portal — Trusted Since 1999</p>

          <div className="auth-panel-features">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="auth-panel-feature">
                <div className="auth-panel-feature-icon">
                  <Icon size={22} />
                </div>
                <div>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="auth-stats">
            {[
              { value: '500+', label: 'Active Members' },
              { value: '₹50Cr+', label: 'Funds Managed' },
              { value: '25+', label: 'Years Legacy' },
              { value: '100%', label: 'Trust Score' },
            ].map(s => (
              <div key={s.label} className="auth-stat">
                <div className="auth-stat-value">{s.value}</div>
                <div className="auth-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
