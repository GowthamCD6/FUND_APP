import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiAddLine, RiArrowLeftSLine, RiArrowRightSLine,
  RiGroupLine, RiTimeLine, RiBarChartLine,
  RiShieldCheckLine, RiTrendingUpLine, RiHeartLine,
  RiCheckLine,
} from '../../icons.jsx';

const PLANS = [
  {
    id: 1, name: '1 Lakh Plan', badge: 'Popular',
    amount: 100000, monthly: 5000, duration: 20, members: 20,
    color: '#FFD700', lightColor: '#FFF7CC',
    description: 'Perfect for first-time investors and small businesses',
    idealFor: ['First-time investors', 'Small business owners', 'Emergency fund builders', 'Short-term goals'],
    highlights: ['Low monthly commitment', 'Quick returns possible', 'Build credit history', 'Flexible bidding options'],
  },
  {
    id: 2, name: '2 Lakh Plan', badge: 'Best Value',
    amount: 200000, monthly: 10000, duration: 20, members: 20,
    color: '#C0C0C0', lightColor: '#F5F5F4',
    description: 'Ideal for medium-term savings and expansion needs',
    idealFor: ['Business expansion', 'Home renovation', 'Vehicle purchase', 'Education funding'],
    highlights: ['Balanced commitment', 'Higher savings potential', 'Medium-term goals', 'Better returns'],
  },
  {
    id: 3, name: '3 Lakh Plan', badge: 'Trending',
    amount: 300000, monthly: 15000, duration: 20, members: 20,
    color: '#4FC3F7', lightColor: '#E0F8FF',
    description: 'Great for substantial investments and long-term goals',
    idealFor: ['Property investment', 'Major renovations', 'Business capital', 'Long-term savings'],
    highlights: ['Substantial returns', 'Long-term wealth building', 'Major investment needs', 'Premium benefits'],
  },
  {
    id: 4, name: '5 Lakh Plan', badge: 'Premium',
    amount: 500000, monthly: 25000, duration: 20, members: 20,
    color: '#CE93D8', lightColor: '#F5D4F5',
    description: 'Premium option for maximum returns and large projects',
    idealFor: ['Large investments', 'Property purchase', 'Major business ventures', 'Wealth creation'],
    highlights: ['Maximum returns', 'Premium member status', 'Priority support', 'Exclusive benefits'],
  },
];

const formatCur = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const isLight = (hex) => {
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0,2), 16);
  const g = parseInt(c.slice(2,4), 16);
  const b = parseInt(c.slice(4,6), 16);
  return 0.299*r + 0.587*g + 0.114*b > 186;
};

const BENEFITS = [
  { Icon: RiShieldCheckLine, color: '#10B981', title: 'Safe & Regulated',  desc: 'Complies with Chit Funds Act' },
  { Icon: RiTrendingUpLine,  color: '#3B82F6', title: 'Higher Returns',    desc: 'Better than traditional savings' },
  { Icon: RiHeartLine,       color: '#8B5CF6', title: 'Community Trust',   desc: 'Build relationships while investing' },
];

const Groups = () => {
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState(0);

  const plan = PLANS[currentPlan];
  const textColor = isLight(plan.color) ? '#1F2937' : '#FFFFFF';
  const subColor  = isLight(plan.color) ? 'rgba(31,41,55,0.75)' : 'rgba(255,255,255,0.85)';

  return (
    <div className="rn-page">
      <style>{`
        .cp-hero { border-radius:var(--radius-xl); padding:32px 28px; position:relative; overflow:hidden; transition:background 0.4s; }
        .cp-hero::before { content:''; position:absolute; top:-40px; right:-40px; width:160px; height:160px; border-radius:50%; background:rgba(255,255,255,0.12); }
        .cp-hero::after  { content:''; position:absolute; bottom:-60px; left:-30px; width:200px; height:200px; border-radius:50%; background:rgba(255,255,255,0.08); }
        .cp-badge { display:inline-block; background:rgba(255,255,255,0.25); padding:5px 18px; border-radius:100px; font-size:12px; font-weight:700; margin-bottom:16px; }
        .cp-hero-name { font-size:30px; font-weight:800; margin:0 0 8px; }
        .cp-hero-desc { font-size:14px; margin:0 0 20px; line-height:1.5; }
        .cp-hero-amount { font-size:44px; font-weight:900; margin:0 0 4px; }
        .cp-hero-amount-label { font-size:13px; margin:0 0 24px; }
        .cp-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; position:relative; z-index:1; }
        .cp-stat { background:rgba(255,255,255,0.92); border-radius:var(--radius); padding:12px; text-align:center; }
        .cp-stat-value { font-size:15px; font-weight:800; color:#1F2937; }
        .cp-stat-label { font-size:10px; color:#6B7280; margin-top:2px; text-transform:uppercase; letter-spacing:0.05em; }
        .cp-dots { display:flex; justify-content:center; gap:8px; margin:4px 0; }
        .cp-dot { width:8px; height:8px; border-radius:50%; background:var(--border); border:none; cursor:pointer; padding:0; transition:all 0.2s; }
        .cp-dot.active { width:24px; border-radius:4px; background:var(--primary); }
        .cp-arrows { display:flex; justify-content:space-between; }
        .cp-arrow { background:var(--surface); border:1px solid var(--border); border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.18s; }
        .cp-arrow:hover { background:var(--primary); color:#fff; border-color:var(--primary); }
        .cp-arrow:disabled { opacity:0.3; cursor:default; }
        .cp-ideal-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .cp-ideal-item { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text); }
        .cp-highlight { display:flex; align-items:center; gap:12px; padding:12px; border-radius:var(--radius); margin-bottom:8px; }
        .cp-hl-icon { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .cp-pay-row { display:flex; justify-content:space-between; align-items:center; padding:14px 16px; background:var(--bg); border-radius:var(--radius); margin-bottom:8px; }
        .cp-pay-highlight { border:2px solid; }
        .cp-benefit { display:flex; gap:14px; align-items:flex-start; padding:14px; border-radius:var(--radius); background:var(--bg); border-left:3px solid var(--border); margin-bottom:10px; }
      `}</style>

      {/* Header */}
      <div className="rn-header">
        <div>
          <h2 className="rn-title">Chit Plans</h2>
          <p className="rn-subtitle">Explore our available investment plans</p>
        </div>
        <button className="rn-primary" style={{ padding: '10px 18px', fontSize: 13, width: 'auto', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => navigate('/admin/actions/create-group')}>
          <RiAddLine size={16} /> Create Group
        </button>
      </div>

      {/* Hero Card */}
      <div className="cp-hero" style={{ background: plan.color }}>
        <span className="cp-badge" style={{ color: textColor }}>{plan.badge} — Plan {plan.id} of {PLANS.length}</span>
        <h2 className="cp-hero-name" style={{ color: textColor }}>{plan.name}</h2>
        <p className="cp-hero-desc" style={{ color: subColor }}>{plan.description}</p>
        <div className="cp-hero-amount" style={{ color: textColor }}>{formatCur(plan.amount)}</div>
        <p className="cp-hero-amount-label" style={{ color: subColor }}>Total Chit Value</p>
        <div className="cp-stats">
          {[
            { label: 'Monthly', value: formatCur(plan.monthly) },
            { label: 'Months',  value: plan.duration },
            { label: 'Members', value: plan.members },
          ].map(s => (
            <div key={s.label} className="cp-stat">
              <div className="cp-stat-value">{s.value}</div>
              <div className="cp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots + Arrows */}
      <div className="cp-dots">
        {PLANS.map((_, i) => (
          <button key={i} className={`cp-dot${i === currentPlan ? ' active' : ''}`} onClick={() => setCurrentPlan(i)} />
        ))}
      </div>
      <div className="cp-arrows">
        <button className="cp-arrow" disabled={currentPlan === 0} onClick={() => setCurrentPlan((p) => p - 1)}>
          <RiArrowLeftSLine size={22} />
        </button>
        <button className="cp-arrow" disabled={currentPlan === PLANS.length - 1} onClick={() => setCurrentPlan((p) => p + 1)}>
          <RiArrowRightSLine size={22} />
        </button>
      </div>

      {/* Ideal For */}
      <div className="rn-card">
        <h3 className="rn-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RiGroupLine size={17} color={plan.color} /> Ideal For
        </h3>
        <div className="cp-ideal-grid">
          {plan.idealFor.map((item, i) => (
            <div key={i} className="cp-ideal-item">
              <RiCheckLine size={16} color={plan.color} style={{ flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Key Highlights */}
      <div className="rn-card">
        <h3 className="rn-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RiBarChartLine size={17} color={plan.color} /> Key Highlights
        </h3>
        {plan.highlights.map((h, i) => (
          <div key={i} className="cp-highlight" style={{ background: plan.lightColor }}>
            <div className="cp-hl-icon" style={{ background: plan.color }}>
              <RiCheckLine size={16} color={isLight(plan.color) ? '#1F2937' : '#fff'} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{h}</span>
          </div>
        ))}
      </div>

      {/* Payment Breakdown */}
      <div className="rn-card">
        <h3 className="rn-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RiTimeLine size={17} color={plan.color} /> Payment Breakdown
        </h3>
        {[
          { label: 'Monthly Contribution', value: formatCur(plan.monthly) },
          { label: 'Total Months',         value: plan.duration },
          { label: 'Group Members',        value: `${plan.members} People` },
        ].map(r => (
          <div key={r.label} className="cp-pay-row">
            <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>{r.label}</span>
            <strong style={{ fontSize: 15 }}>{r.value}</strong>
          </div>
        ))}
        <div className="cp-pay-row cp-pay-highlight" style={{ background: plan.lightColor, borderColor: plan.color }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Total Pool Amount</span>
          <strong style={{ fontSize: 22 }}>{formatCur(plan.amount)}</strong>
        </div>
      </div>

      {/* Why This Plan */}
      <div className="rn-card">
        <h3 className="rn-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RiShieldCheckLine size={17} color={plan.color} /> Why This Plan?
        </h3>
        {BENEFITS.map((b) => (
          <div key={b.title} className="cp-benefit" style={{ borderLeftColor: b.color }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${b.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <b.Icon size={20} color={b.color} />
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{b.title}</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        className="rn-primary"
        style={{ background: plan.color, color: isLight(plan.color) ? '#1F2937' : '#fff', boxShadow: `0 8px 24px ${plan.color}60`, fontSize: 16, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
        onClick={() => navigate('/admin/actions/create-group')}
      >
        <RiAddLine size={20} /> Create Group with {plan.name}
      </button>
    </div>
  );
};

export default Groups;
