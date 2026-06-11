import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Smartphone as RiSmartphoneLine, Phone as RiPhoneLine, Lock as RiLockLine, Key as RiKeyLine,
  Eye as RiEyeLine, EyeOff as RiEyeOffLine, AlertTriangle as RiAlertLine, Loader2 as RiLoader4Line,
  ArrowRight as RiArrowRightLine, Shield as RiShieldLine, CircleDollarSign as RiMoneyDollarCircleLine,
  BarChart3 as RiBarChartLine,
} from 'lucide-react';

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
    <div className="login-container">
      {/* Left Side - Hero Section */}
      <div className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="logo-section">
            <div className="logo">
               <span style={{ fontSize: '26px', fontWeight: '800', color: '#059669', letterSpacing: '-1px' }}>GDK</span>
            </div>
          </div>
          <div className="company-name">GDK Chit Fund</div>
          <div className="hero-tagline">ஸ்ரீ பெரியநாயகி அம்மன் - Trusted Since 1999</div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-section">
        <div className="login-box">
          <div className="login-header">
            <h2 className="login-title">Sign in to Admin Portal</h2>
            <p className="login-subtitle">
              Enter your credentials to access the admin dashboard
            </p>
          </div>

          <div className="divider"><span>secure login</span></div>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="phone-input">
                <input 
                  type="text" 
                  className="country-code" 
                  value="+91" 
                  readOnly 
                />
                <input 
                  type="tel" 
                  className="form-input" 
                  name="phone"
                  placeholder="Enter 10-digit phone number" 
                  value={formState.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"}
                  className="form-input" 
                  name="password"
                  placeholder="Enter your password" 
                  value={formState.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <RiEyeOffLine size={20} /> : <RiEyeLine size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="sign-in-button" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="footer-text">
            Having trouble? <a href="#" className="footer-link">Contact system admin</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

export const NotAuthorized = () => (
  <div className="page center">
    <div className="panel">
      <h2>Access restricted</h2>
      <p className="muted">This portal is only available for admin accounts.</p>
      <Link to="/login" className="primary-button">
        Back to login
      </Link>
    </div>
  </div>
);

export const NotFound = () => (
  <div className="page center">
    <div className="panel">
      <h2>Page not found</h2>
      <p className="muted">The page you are looking for does not exist.</p>
      <Link to="/admin/dashboard" className="primary-button">
        Go to dashboard
      </Link>
    </div>
  </div>
);
