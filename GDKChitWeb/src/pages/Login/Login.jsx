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
  const { login, isAdminRole } = useAuth();
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
      const apiUser = await login(formState.phone.trim(), formState.password);
      const role = localStorage.getItem('userRole') || apiUser?.role;
      if (isAdminRole(role)) {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/home');
      }
    } catch (err) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="panel" style={{ textAlign: 'center', padding: '40px 24px', maxWidth: '440px', margin: '60px auto', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <RiShieldLine size={48} color="#EF4444" style={{ margin: '0 auto 16px' }} />
      <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px', color: '#111827' }}>Access Restricted</h2>
      <p style={{ color: '#6B7280', margin: '0 0 20px', fontSize: '14.5px' }}>This area requires administrative privileges.</p>
      <Link to="/user/home" style={{ display: 'inline-block', padding: '11px 24px', background: '#059669', color: '#fff', borderRadius: '8px', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
        Back to Member Portal
      </Link>
    </div>
  </div>
);

export const NotFound = () => (
  <div className="page center">
    <div className="panel" style={{ textAlign: 'center', padding: '40px 24px', maxWidth: '440px', margin: '60px auto', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px', color: '#111827' }}>Page Not Found</h2>
      <p style={{ color: '#6B7280', margin: '0 0 20px', fontSize: '14.5px' }}>The requested page could not be located.</p>
      <Link to="/" style={{ display: 'inline-block', padding: '11px 24px', background: '#059669', color: '#fff', borderRadius: '8px', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
        Return to Home
      </Link>
    </div>
  </div>
);
