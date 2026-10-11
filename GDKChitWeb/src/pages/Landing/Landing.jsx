import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  ShieldCheck as RiShieldUserLine, Check as RiCheckLine, Clock as RiTimeLine,
  Users as RiGroupLine, CircleDollarSign as RiMoneyDollarCircleLine, ChevronRight as RiArrowRightSLine,
  Camera as RiInstagramLine, Play as RiYoutubeLine, MessageCircle as RiWhatsappLine,
  Building2, TrendingUp, HandCoins, User as RiUserLine
} from 'lucide-react';
import './Landing.css';
import aboutFamilyImage from '../../assets/about-us-family.png';
import heroFamilyImage from '../../assets/hero_family_success.png';

const plans = [
  { id: 1, name: 'Standard Plan', badge: 'Popular', amount: '₹1,00,000', monthly: '₹5,000/month', duration: '20 Months', returnAmt: '₹95,000', color: '#0F172A' },
  { id: 2, name: 'Silver Plan', badge: 'Best Value', amount: '₹2,00,000', monthly: '₹10,000/month', duration: '20 Months', returnAmt: '₹1,90,000', color: '#0F172A' },
  { id: 3, name: 'Gold Plan', badge: 'Trending', amount: '₹3,00,000', monthly: '₹15,000/month', duration: '20 Months', returnAmt: '₹2,85,000', color: '#0F172A' },
  { id: 4, name: 'Platinum Plan', badge: 'Premium', amount: '₹5,00,000', monthly: '₹25,000/month', duration: '20 Months', returnAmt: '₹4,75,000', color: '#0F172A' },
];

const features = [
  { title: 'RBI Registered', desc: 'Fully compliant with Reserve Bank of India regulations for chit funds', icon: Building2 },
  { title: 'Transparent Auctions', desc: 'Live monthly auctions with complete transparency and fair bidding', icon: HandCoins },
  { title: 'Guaranteed Payouts', desc: 'On-time prize money disbursement with zero delays', icon: RiShieldUserLine },
  { title: 'Digital Tracking', desc: 'Track your investments, payments and returns in real-time', icon: TrendingUp },
];

const stats = [
  { value: '500+', label: 'Active Members' },
  { value: '₹50Cr+', label: 'Funds Managed' },
  { value: '25+', label: 'Years Legacy' },
  { value: '100%', label: 'Trust Score' },
];

const Landing = () => {
  const navigate = useNavigate();
  const { user, status, isAdminRole } = useAuth();
  const isAuthed = status === 'authed';
  const isAdmin = isAdminRole(user?.role);

  return (
    <div className="landing">
      {/* ── Navbar ── */}
      <nav className="land-nav">
        <div className="land-nav-brand">
          <div className="land-nav-logo">G</div>
          <span className="land-nav-name">GDK Chit Fund</span>
        </div>
        <div className="land-nav-links">
          <button className="land-nav-link" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>About</button>
          <button className="land-nav-link" onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}>Plans</button>
          <button className="land-nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button>
          {isAuthed ? (
            <button className="land-login-btn" onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/user/home')}>
              Open {isAdmin ? 'Admin' : 'Member'} Portal <RiArrowRightSLine size={16} />
            </button>
          ) : (
            <button className="land-login-btn" onClick={() => navigate('/login')}>
              Sign In <RiArrowRightSLine size={16} />
            </button>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="land-hero">
        <div className="land-hero-content">
          <div className="land-hero-tamil-brand">
            <h2>ஸ்ரீ பெரியநாயகி அம்மன்</h2>
            <p>CHITFUNDS</p>
          </div>
          <div className="land-hero-badge">
            <RiShieldUserLine size={16} /> Trusted Financial Partner Since 1999
          </div>
          <h1>
            Secure Your Future With India's Premier Chit Fund
          </h1>
          <p className="land-hero-sub">
            Join thousands of families in a secure, RBI-registered community. Maximize your savings with transparent auctions and guaranteed on-time payouts.
          </p>
          <div className="land-hero-btns">
            <button className="land-cta-primary" onClick={() => navigate(isAuthed ? (isAdmin ? '/admin/dashboard' : '/user/home') : '/login')}>
              Member Portal <RiArrowRightSLine size={18} />
            </button>
            <button className="land-cta-secondary" onClick={() => navigate(isAuthed && isAdmin ? '/admin/dashboard' : '/login')}>
              Admin Portal
            </button>
            <button className="land-cta-secondary" style={{ background: '#f1f5f9', color: '#334155' }} onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}>
              View Plans
            </button>
          </div>
          <div className="land-hero-social-proof">
            <div className="hero-avatars">
              <div className="avatar" style={{ backgroundColor: '#10B981' }}></div>
              <div className="avatar" style={{ backgroundColor: '#3B82F6' }}></div>
              <div className="avatar" style={{ backgroundColor: '#F59E0B' }}></div>
              <div className="avatar" style={{ backgroundColor: '#8B5CF6' }}></div>
              <div className="avatar avatar-text">500+</div>
            </div>
            <p className="hero-proof-text">
              Trusted by <strong>500+ families</strong> for securing their financial future.
            </p>
          </div>
        </div>
        <div className="land-hero-image">
          <div className="hero-image-wrapper">
            <img src={heroFamilyImage} alt="Couple reviewing their financial growth" className="hero-img" />
          </div>
        </div>
      </section>

      {/* ── About Us ── */}
      <section className="land-about" id="about">
        <div className="land-about-grid">
          <div className="land-about-text">
            <div className="land-about-tag">Who We Are</div>
            <h2 className="land-about-title">Building Wealth & Trust Since 1999</h2>
            <p className="land-about-desc">
              GDK Chit Fund (ஸ்ரீ பெரியநாயகி அம்மன்) has been a cornerstone of financial growth and security for families for over two decades. As a fully RBI-registered and compliant institution, we blend traditional trust with modern transparency.
            </p>
            <p className="land-about-desc">
              Our mission is to empower our members with reliable savings and borrowing solutions, ensuring that your financial goals are met with integrity and excellence.
            </p>
            <ul className="land-about-list">
              <li><RiCheckLine size={20} color="#059669" /> RBI Registered & Compliant</li>
              <li><RiCheckLine size={20} color="#059669" /> Transparent Monthly Auctions</li>
              <li><RiCheckLine size={20} color="#059669" /> Guaranteed On-time Payouts</li>
            </ul>
          </div>
          <div className="land-about-visual">
            <div className="about-image-wrapper">
              <img src={aboutFamilyImage} alt="Happy family securing their future" className="about-image" />
              <div className="about-image-badge">
                <RiShieldUserLine size={24} color="#059669" />
                <span>100% Secured Family Future</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="land-stats" id="stats">
        <div className="land-stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="land-stat-card">
              <div className="land-stat-val">{s.value}</div>
              <div className="land-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Plans ── */}
      <section className="land-plans" id="plans">
        <div className="land-section-header">
          <h2 className="land-section-title">Structured Investment Plans</h2>
          <p className="land-section-sub">Flexible financial solutions tailored to help you meet your wealth goals securely.</p>
        </div>
        <div className="land-plans-grid">
          {plans.map(plan => (
            <div key={plan.id} className="land-plan-card" onClick={() => navigate('/login')}>
              {plan.badge === 'Popular' && <div className="land-plan-popular-ribbon">Most Popular</div>}
              <div className="land-plan-header">
                <h3 className="land-plan-name">{plan.name}</h3>
                <div className="land-plan-amount">{plan.amount}</div>
                <div className="land-plan-label">Total Chit Value</div>
              </div>
              <div className="land-plan-body">
                <div className="plan-detail-row">
                  <span>Monthly Contribution</span>
                  <strong>{plan.monthly}</strong>
                </div>
                <div className="plan-detail-row">
                  <span>Duration</span>
                  <strong>{plan.duration}</strong>
                </div>
                <div className="plan-divider"></div>
                <div className="plan-detail-row highlight-row">
                  <span>Expected Return</span>
                  <strong>{plan.returnAmt}</strong>
                </div>
              </div>
              <button className="land-plan-btn">Invest Now</button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="land-features" id="features">
        <div className="land-section-header">
          <h2 className="land-section-title">Why Choose GDK Chit Fund?</h2>
          <p className="land-section-sub">A legacy of trust, driven by modern financial standards and complete transparency.</p>
        </div>
        <div className="land-features-grid">
          {features.map((f, i) => (
            <div key={i} className="land-feature-card">
              <div className="land-feature-icon">
                <f.icon size={28} />
              </div>
              <h3 className="land-feature-title">{f.title}</h3>
              <p className="land-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="land-cta-banner">
        <div className="land-cta-content">
          <h2>Ready to Build Your Wealth?</h2>
          <p>Join India's most trusted chit fund and take control of your financial future today.</p>
          <button className="land-cta-solid" onClick={() => navigate('/login')}>
            Start Investing Now
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="land-footer">
        <div className="land-footer-top">
          <div className="land-footer-brand">
            <div className="footer-logo-wrap">
              <div className="land-nav-logo" style={{ background: '#059669', color: '#fff' }}>G</div>
              <h3>GDK Chit Funds</h3>
            </div>
            <p className="land-footer-desc">Empowering families through secure, transparent, and profitable financial solutions since 1999.</p>
          </div>
          <div className="land-footer-links">
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#stats">About Us</a>
              <a href="#features">Why Us</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="#">Terms & Conditions</a>
              <a href="#">Privacy Policy</a>
              <a href="#">RBI Guidelines</a>
            </div>
          </div>
        </div>
        <div className="land-footer-bottom">
          <div className="land-footer-copy">
            © {new Date().getFullYear()} GDK Chit Funds (ஸ்ரீ பெரியநாயகி அம்மன்). All rights reserved.
          </div>
          <div className="land-footer-socials">
            <button className="land-social-btn"><RiInstagramLine size={18} /></button>
            <button className="land-social-btn"><RiYoutubeLine size={18} /></button>
            <button className="land-social-btn"><RiWhatsappLine size={18} /></button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

