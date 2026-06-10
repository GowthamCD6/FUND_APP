import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck as RiShieldUserLine, Check as RiCheckLine, Clock as RiTimeLine,
  Users as RiGroupLine, CircleDollarSign as RiMoneyDollarCircleLine, ChevronRight as RiArrowRightSLine,
  Camera as RiInstagramLine, Play as RiYoutubeLine, MessageCircle as RiWhatsappLine,
} from 'lucide-react';
import './Landing.css';

const plans = [
  { id: 1, name: '1 Lakh Plan', badge: 'Popular', amount: '₹1,00,000', monthly: '₹5,000/month', duration: '20 Months', returnAmt: '₹95,000', color: '#FFD700' },
  { id: 2, name: '2 Lakh Plan', badge: 'Best Value', amount: '₹2,00,000', monthly: '₹10,000/month', duration: '20 Months', returnAmt: '₹1,90,000', color: '#C0C0C0' },
  { id: 3, name: '3 Lakh Plan', badge: 'Trending', amount: '₹3,00,000', monthly: '₹15,000/month', duration: '20 Months', returnAmt: '₹2,85,000', color: '#87CEEB' },
  { id: 4, name: '5 Lakh Plan', badge: 'Premium', amount: '₹5,00,000', monthly: '₹25,000/month', duration: '20 Months', returnAmt: '₹4,75,000', color: '#DA70D6' },
];

const features = [
  { title: 'RBI Registered', desc: 'Fully compliant with Reserve Bank of India regulations for chit funds', icon: RiShieldUserLine, color: '#10B981', bg: '#ecfdf5' },
  { title: 'Transparent Auctions', desc: 'Live monthly auctions with complete transparency and fair bidding', icon: RiCheckLine, color: '#2842C4', bg: '#eff6ff' },
  { title: 'Guaranteed Payouts', desc: 'On-time prize money disbursement with zero delays', icon: RiMoneyDollarCircleLine, color: '#F59E0B', bg: '#fffbeb' },
  { title: 'Digital Tracking', desc: 'Track your investments, payments and returns in real-time', icon: RiTimeLine, color: '#6B46C1', bg: '#f5f3ff' },
];

const stats = [
  { value: '500+', label: 'Active Members' },
  { value: '₹50Cr+', label: 'Funds Managed' },
  { value: '25+', label: 'Years Legacy' },
  { value: '100%', label: 'Trust Score' },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* ── Navbar ── */}
      <nav className="land-nav">
        <div className="land-nav-brand">
          <div className="land-nav-logo">G</div>
          <span className="land-nav-name">GDK Chit Fund</span>
        </div>
        <div className="land-nav-links">
          <button className="land-nav-link" onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}>Plans</button>
          <button className="land-nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button>
          <button className="land-nav-link" onClick={() => document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' })}>About</button>
          <button className="land-login-btn" onClick={() => navigate('/login')}>Login</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="land-hero">
        <div className="land-hero-badge">
          <RiShieldUserLine size={14} /> Trusted Since 1999
        </div>
        <h1>
          Grow Your Savings with <span>India's Most Trusted</span> Chit Fund
        </h1>
        <p className="land-hero-sub">
          Join 500+ families in our trusted chit fund community. Get up to 95% returns with RBI registered, transparent operations.
        </p>
        <div className="land-hero-btns">
          <button className="land-cta-primary" onClick={() => navigate('/login')}>
            Get Started <RiArrowRightSLine size={18} />
          </button>
          <button className="land-cta-secondary" onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}>
            Explore Plans
          </button>
        </div>
        <div className="land-hero-pills">
          <div className="land-hero-pill">
            <RiCheckLine size={14} color="#10B981" /> Up to 95% Returns
          </div>
          <div className="land-hero-pill">
            <RiShieldUserLine size={14} color="#2842C4" /> RBI Registered
          </div>
          <div className="land-hero-pill">
            <RiGroupLine size={14} color="#6B46C1" /> 500+ Members
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
        <div style={{ textAlign: 'center' }}>
          <div className="land-section-tag"><RiMoneyDollarCircleLine size={14} /> Investment Plans</div>
          <h2 className="land-section-title">Choose Your Chit Fund Plan</h2>
          <p className="land-section-sub">Flexible plans designed for every budget. Start growing your savings today.</p>
        </div>
        <div className="land-plans-grid">
          {plans.map(plan => (
            <div key={plan.id} className="land-plan-card" onClick={() => navigate('/login')}>
              <div className="land-plan-deco" style={{ background: plan.color }} />
              <div className="land-plan-badge" style={{ background: plan.color }}>{plan.badge}</div>
              <h3 className="land-plan-name">{plan.name}</h3>
              <div className="land-plan-amount" style={{ color: plan.color === '#C0C0C0' ? '#6B7280' : plan.color }}>{plan.amount}</div>
              <div className="land-plan-label">Total Value</div>
              <p className="land-plan-info">{plan.monthly} for {plan.duration}</p>
              <div className="land-plan-return">
                <div className="land-plan-return-label">Expected Return</div>
                <div className="land-plan-return-val">{plan.returnAmt}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="land-features" id="features">
        <div style={{ textAlign: 'center' }}>
          <div className="land-section-tag"><RiCheckLine size={14} /> Why Choose Us</div>
          <h2 className="land-section-title">Built on Trust & Transparency</h2>
          <p className="land-section-sub">Decades of reliable service, backed by modern technology and regulatory compliance.</p>
        </div>
        <div className="land-features-grid">
          {features.map((f, i) => (
            <div key={i} className="land-feature-card">
              <div className="land-feature-icon" style={{ background: f.bg }}>
                <f.icon size={24} color={f.color} />
              </div>
              <h3 className="land-feature-title">{f.title}</h3>
              <p className="land-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="land-cta-banner">
        <h2>Ready to Start Growing Your Savings?</h2>
        <p>Join thousands of families who trust GDK Chit Fund for their financial growth.</p>
        <button className="land-cta-white" onClick={() => navigate('/login')}>
          Join Now — It's Free
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="land-footer">
        <div className="land-footer-top">
          <div className="land-footer-brand">
            <h3>ஸ்ரீ பெரியநாயகி அம்மன் ChitFunds</h3>
            <p>Trusted Since 1999 · RBI Registered</p>
          </div>
          <div className="land-footer-socials">
            <button className="land-social-btn"><RiInstagramLine size={18} /></button>
            <button className="land-social-btn"><RiYoutubeLine size={18} /></button>
            <button className="land-social-btn"><RiWhatsappLine size={18} /></button>
          </div>
        </div>
        <div className="land-footer-copy">
          © 2025 ஸ்ரீ பெரியநாயகி அம்மன் ChitFunds. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
