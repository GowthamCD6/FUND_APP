import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { makeRequest } from '../../../api/apiClient.js';
import {
  Bell as RiNotificationLine, ChevronRight as RiArrowRightSLine, ShieldCheck as RiShieldUserLine,
  Check as RiCheckLine, Users as RiGroupLine, CircleDollarSign as RiMoneyDollarCircleLine,
  Clock as RiTimeLine, X as RiCloseLine, AlertTriangle as RiAlertLine,
  Camera as RiInstagramLine, Play as RiYoutubeLine, MessageCircle as RiWhatsappLine,
} from 'lucide-react';
import './Home.css';

const plans = [
  { id: 1, name: '1 Lakh Plan', badge: 'Popular', amount: '₹1,00,000', monthly: '₹5,000', duration: '20 Months', returnAmt: '₹95,000', color: '#FFD700' },
  { id: 2, name: '2 Lakh Plan', badge: 'Best Value', amount: '₹2,00,000', monthly: '₹10,000', duration: '20 Months', returnAmt: '₹1,90,000', color: '#C0C0C0' },
  { id: 3, name: '3 Lakh Plan', badge: 'Trending', amount: '₹3,00,000', monthly: '₹15,000', duration: '20 Months', returnAmt: '₹2,85,000', color: '#87CEEB' },
  { id: 4, name: '5 Lakh Plan', badge: 'Premium', amount: '₹5,00,000', monthly: '₹25,000', duration: '20 Months', returnAmt: '₹4,75,000', color: '#DA70D6' },
];

const features = [
  { title: 'RBI Registered', desc: 'Fully compliant with Reserve Bank of India regulations for chit funds', Icon: RiShieldUserLine, color: '#10B981', bg: '#ecfdf5' },
  { title: 'Transparent Auctions', desc: 'Live monthly auctions with complete transparency and fair bidding', Icon: RiCheckLine, color: '#2842C4', bg: '#eff6ff' },
  { title: 'Guaranteed Payouts', desc: 'On-time prize money disbursement with zero delays', Icon: RiMoneyDollarCircleLine, color: '#F59E0B', bg: '#fffbeb' },
  { title: 'Digital Tracking', desc: 'Track your investments, payments and returns in real-time', Icon: RiTimeLine, color: '#6B46C1', bg: '#f5f3ff' },
];

const stats = [
  { value: '500+', label: 'Active Members', Icon: RiGroupLine },
  { value: '₹50Cr+', label: 'Funds Managed', Icon: RiMoneyDollarCircleLine },
  { value: '25+', label: 'Years Legacy', Icon: RiTimeLine },
  { value: '100%', label: 'Trust Score', Icon: RiShieldUserLine },
];

const UserHome = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [activePlan, setActivePlan] = useState(0);
  const carouselRef = useRef(null);
  const timerRef = useRef(null);

  const displayName = user?.name || user?.username || 'User';

  // Fetch notifications
  useEffect(() => {
    const fetchNotif = async () => {
      try {
        const res = await makeRequest('/user/notifications');
        const data = await res.json();
        if (data.success) setNotifications(data.data || []);
      } catch (e) { /* silent */ }
    };
    fetchNotif();
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActivePlan(prev => (prev + 1) % plans.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (carouselRef.current) {
      const card = carouselRef.current.children[activePlan];
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activePlan]);

  const [selectedPlan, setSelectedPlan] = useState(null);

  return (
    <div className="uh-page">
      {/* Header */}
      <div className="uh-header">
        <div>
          <p className="uh-welcome">Welcome Back!</p>
          <h2 className="uh-name">{displayName}</h2>
        </div>
        <button className="uh-notif-btn" onClick={() => setShowNotif(true)}>
          <RiNotificationLine size={22} />
          {notifications.length > 0 && <span className="uh-notif-dot">{notifications.length}</span>}
        </button>
      </div>

      {/* Company Branding */}
      <div className="uh-brand-card">
        <h2 className="uh-brand-tamil">ஸ்ரீ பெரியநாயகி அம்மன்</h2>
        <p className="uh-brand-sub">CHITFUNDS</p>
        <p className="uh-brand-tag">Trusted Since 1999</p>
      </div>

      {/* Hero Banner */}
      <div className="uh-hero">
        <div className="uh-hero-deco1" />
        <div className="uh-hero-deco2" />
        <h2 className="uh-hero-title">Grow Your Savings</h2>
        <p className="uh-hero-sub">Join 500+ families in our trusted chit fund community</p>
        <div className="uh-hero-pills">
          <span className="uh-pill"><RiCheckLine size={12} color="#6B46C1" /> Up to 95% Returns</span>
          <span className="uh-pill"><RiShieldUserLine size={12} color="#10B981" /> RBI Registered</span>
        </div>
        <button className="uh-hero-btn" onClick={() => document.getElementById('uh-plans')?.scrollIntoView({ behavior: 'smooth' })}>
          Explore Plans <RiArrowRightSLine size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="uh-stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="uh-stat">
            <s.Icon size={20} color="#6B46C1" />
            <div className="uh-stat-val">{s.value}</div>
            <div className="uh-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Plans Carousel */}
      <div id="uh-plans" className="uh-plans-section">
        <div className="uh-plans-header">
          <h3 className="uh-section-title">Popular Plans</h3>
          <button className="uh-view-all" onClick={() => setSelectedPlan(plans[0])}>View All</button>
        </div>
        <div className="uh-carousel" ref={carouselRef}>
          {plans.map((plan, i) => (
            <div key={plan.id} className={`uh-plan-card ${activePlan === i ? 'active' : ''}`} onClick={() => setSelectedPlan(plan)}>
              <div className="uh-plan-deco" style={{ background: plan.color }} />
              <span className="uh-plan-badge" style={{ background: plan.color }}>{plan.badge}</span>
              <h4 className="uh-plan-name">{plan.name}</h4>
              <div className="uh-plan-amount" style={{ color: plan.color === '#C0C0C0' ? '#6B7280' : plan.color }}>{plan.amount}</div>
              <p className="uh-plan-label">Total Value</p>
              <p className="uh-plan-info">{plan.monthly}/month for {plan.duration}</p>
              <div className="uh-plan-return">
                <span className="uh-plan-return-label">Expected Return</span>
                <span className="uh-plan-return-val">{plan.returnAmt}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Dots */}
        <div className="uh-dots">
          {plans.map((_, i) => (
            <button key={i} className={`uh-dot ${activePlan === i ? 'active' : ''}`} onClick={() => setActivePlan(i)} />
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="uh-features">
        <h3 className="uh-section-title">Why Choose Us?</h3>
        <div className="uh-features-grid">
          {features.map((f, i) => (
            <div key={i} className="uh-feature-card">
              <div className="uh-feature-icon" style={{ background: f.bg }}>
                <f.Icon size={22} color={f.color} />
              </div>
              <div>
                <h4 className="uh-feature-title">{f.title}</h4>
                <p className="uh-feature-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="uh-footer">
        <div className="uh-footer-socials">
          <button className="uh-social"><RiInstagramLine size={20} /></button>
          <button className="uh-social"><RiYoutubeLine size={20} /></button>
          <button className="uh-social"><RiWhatsappLine size={20} /></button>
        </div>
        <p className="uh-copy">© 2025 ஸ்ரீ பெரியநாயகி அம்மன் ChitFunds. All rights reserved.</p>
      </div>

      {/* Plan Detail Modal */}
      {selectedPlan && (
        <div className="uh-modal-backdrop" onClick={() => setSelectedPlan(null)}>
          <div className="uh-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{selectedPlan.name}</h3>
              <button onClick={() => setSelectedPlan(null)} style={{ background: 'var(--surface2)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RiCloseLine size={18} />
              </button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: selectedPlan.color === '#C0C0C0' ? '#6B7280' : selectedPlan.color }}>{selectedPlan.amount}</div>
              <p style={{ color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>TOTAL VALUE</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Monthly', val: selectedPlan.monthly },
                { label: 'Duration', val: selectedPlan.duration },
                { label: 'Expected Return', val: selectedPlan.returnAmt },
                { label: 'Members', val: '20 per group' },
              ].map((item, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 12, background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{item.val}</div>
                </div>
              ))}
            </div>
            <button style={{ width: '100%', padding: 14, borderRadius: 12, background: 'linear-gradient(135deg, #2842C4, #1e33a8)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
              Contact Admin to Join
            </button>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotif && (
        <div className="uh-modal-backdrop" onClick={() => setShowNotif(false)}>
          <div className="uh-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Notifications</h3>
              <button onClick={() => setShowNotif(false)} style={{ background: 'var(--surface2)', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RiCloseLine size={18} />
              </button>
            </div>
            {notifications.length > 0 ? notifications.map((n, i) => (
              <div key={i} style={{ padding: 14, borderRadius: 12, background: n.type === 'danger' ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${n.type === 'danger' ? '#FECACA' : '#FEF3C7'}`, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <RiAlertLine size={16} color={n.type === 'danger' ? '#EF4444' : '#F59E0B'} />
                  <span style={{ fontWeight: 600, color: n.type === 'danger' ? '#991B1B' : '#B45309' }}>{n.title}</span>
                </div>
                <p style={{ margin: 0, fontSize: 14, color: '#4B5563', lineHeight: 1.5 }}>{n.message}</p>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: 32, color: '#9ca3af' }}>
                <RiNotificationLine size={40} color="#d1d5db" />
                <p style={{ marginTop: 12 }}>No new notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserHome;
