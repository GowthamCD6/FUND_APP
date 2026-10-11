import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useLanguage } from '../../../context/LanguageContext.jsx';
import { makeRequest } from '../../../api/apiClient.js';

import {
  Bell, Landmark, Gavel, Coins, Users, ArrowRight,
  TrendingUp, ShieldCheck, CheckCircle2, AlertCircle, Clock,
  FileText, Calendar, X, RefreshCw, MapPin, Key, Lock, Unlock,
  CreditCard, Globe, Sparkles, ExternalLink, HelpCircle, Phone,
  Mail, Award, Check, ChevronRight, Share2, Info
} from 'lucide-react';
import './Home.css';

// Import high-resolution illustrative assets
import activeMembersImg from '../../../assets/UserHomePage/ActiveMembers.png';
import trustImg from '../../../assets/UserHomePage/trust.png';
import yearsLegacyImg from '../../../assets/UserHomePage/YearsLegacy.png';
import fundMgmtImg from '../../../assets/UserHomePage/FundManagement.png';
import locationImg from '../../../assets/UserHomePage/Location.png';
import biometricImg from '../../../assets/UserHomePage/Biometric.png';
import onlineImg from '../../../assets/UserHomePage/OnlineTransation.png';
import languageImg from '../../../assets/UserHomePage/DuelLanguage.png';
import bankLockerImg from '../../../assets/UserHomePage/banklocker.png';

const formatINR = (amt) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amt) || 0);

// Comprehensive chit plans matching mobile ChitPlans.jsx
const ALL_CHIT_PLANS = [
  {
    id: 1,
    name: '1 Lakh Plan',
    filterKey: '1lakh',
    badge: 'Popular',
    badgeColor: '#D97706',
    amount: '₹1,00,000',
    totalValue: 100000,
    monthly: '₹5,000',
    monthlyNum: 5000,
    duration: '20 Months',
    members: '20 Members',
    returnAmt: '₹95,000',
    description: 'Perfect for first-time investors, emergency cash cushions, and micro-business starters.',
    idealFor: [
      'First-time chit fund investors',
      'Small retail & shop owners',
      'Emergency fund builders',
      'Short-term financial goals'
    ],
    highlights: [
      'Accessible monthly commitment of ₹5,000',
      'Quick reverse auction returns possible in early cycles',
      'Builds verifiable community financial standing',
      'Flexible monthly reverse-bidding options'
    ]
  },
  {
    id: 2,
    name: '2 Lakh Plan',
    filterKey: '2lakh',
    badge: 'Best Value',
    badgeColor: '#0D9488',
    amount: '₹2,00,000',
    totalValue: 200000,
    monthly: '₹10,000',
    monthlyNum: 10000,
    duration: '20 Months',
    members: '20 Members',
    returnAmt: '₹1,90,000',
    description: 'Ideal for medium-term household savings, vehicle down-payments, and shop expansion.',
    idealFor: [
      'Business working capital expansion',
      'Home renovation & appliances',
      'Vehicle purchase planning',
      'Family educational reserve fund'
    ],
    highlights: [
      'Balanced monthly investment of ₹10,000',
      'Substantial return potential upon maturity',
      'Monthly dividend credited each cycle',
      'Priority settlement via direct bank NEFT'
    ]
  },
  {
    id: 3,
    name: '3 Lakh Plan',
    filterKey: '3lakh',
    badge: 'Trending',
    badgeColor: '#1E40AF',
    amount: '₹3,00,000',
    totalValue: 300000,
    monthly: '₹15,000',
    monthlyNum: 15000,
    duration: '20 Months',
    members: '20 Members',
    returnAmt: '₹2,85,000',
    description: 'Designed for substantial savings, inventory procurement, and family milestone events.',
    idealFor: [
      'Property advance deposits',
      'Major family ceremonies & weddings',
      'Commercial equipment purchase',
      'Structured long-term capital creation'
    ],
    highlights: [
      'Substantial financial pool of ₹3,00,000',
      'High auction dividend distribution among 20 members',
      'Full protection under Tamil Nadu Chit Funds Act',
      'Online digital passbook tracking & SMS receipts'
    ]
  },
  {
    id: 4,
    name: '5 Lakh Plan',
    filterKey: '5lakh',
    badge: 'Premium',
    badgeColor: '#7C3AED',
    amount: '₹5,00,000',
    totalValue: 500000,
    monthly: '₹25,000',
    monthlyNum: 25000,
    duration: '20 Months',
    members: '20 Members',
    returnAmt: '₹4,75,000',
    description: 'Tailored for commercial traders, enterprise owners, and high-yield disciplined savers.',
    idealFor: [
      'Bulk inventory purchase & trading',
      'Commercial expansion & renovations',
      'Higher education funding abroad',
      'High-yield community fund building'
    ],
    highlights: [
      'High-value ₹5,00,000 capital safety net',
      'Attractive auction dividend payouts to non-bidders',
      'Complete GST invoice & digital ledger',
      'Dedicated relationship manager support'
    ]
  },
  {
    id: 5,
    name: '10 Lakh Plan',
    filterKey: '10lakh',
    badge: 'Elite Commercial',
    badgeColor: '#0F172A',
    amount: '₹10,00,000',
    totalValue: 1000000,
    monthly: '₹50,000',
    monthlyNum: 50000,
    duration: '20 Months',
    members: '20 Members',
    returnAmt: '₹9,50,000',
    description: 'Premier institutional chit circle for large-scale enterprise cashflow and major assets.',
    idealFor: [
      'Large commercial capital projects',
      'Real estate & land acquisition',
      'Industrial working capital liquidity',
      'High net-worth community circles'
    ],
    highlights: [
      'Maximum pool liquidity of ₹10,00,000',
      'Exceptional dividend returns over 20 months',
      'Mandatory bank guarantee backing',
      'Instant RTGS prize money transfer upon auction win'
    ]
  }
];

const UserHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, changeLanguage, t } = useLanguage();

  // State
  const [portfolio, setPortfolio] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active scheme filter tab
  const [activePlanTab, setActivePlanTab] = useState('all');

  // Modals state
  const [selectedSchemeDetail, setSelectedSchemeDetail] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Security Passcode Settings
  const [passcodeEnabled, setPasscodeEnabled] = useState(
    localStorage.getItem('webPasscodeEnabled') === 'true'
  );
  const [pinInput, setPinInput] = useState(
    localStorage.getItem('webPasscodePIN') || '1234'
  );
  const [securitySavedToast, setSecuritySavedToast] = useState(false);

  // Language state
  const [currentLang, setCurrentLang] = useState(
    localStorage.getItem('app_language') || 'en'
  );
  const [langToast, setLangToast] = useState(false);

  const displayName = user?.name || user?.username || 'Member';

  // Load user data & portfolio
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [resPort, resNotif] = await Promise.all([
          makeRequest('/user/portfolio'),
          makeRequest('/user/notifications')
        ]);
        const dataPort = await resPort.json();
        const dataNotif = await resNotif.json();

        if (dataPort.success && Array.isArray(dataPort.data)) {
          setPortfolio(dataPort.data);
        }
        if (dataNotif.success && Array.isArray(dataNotif.data)) {
          setNotifications(dataNotif.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Compute metrics
  const totalPaid = portfolio.reduce(
    (acc, g) => acc + (Number(g.totalPaid) || Number(g.groupCollectedAmount) || 0),
    0
  );
  const activeCount = portfolio.filter((g) => g.paymentStatus !== 'completed').length;
  const primaryGroup = portfolio[0];
  const nextDue = primaryGroup
    ? formatINR(primaryGroup.monthlyContribution || Math.round((Number(primaryGroup.investmentAmount) || 100000) / 20))
    : 'All Accounts Paid';

  // Filter schemes
  const filteredSchemes = activePlanTab === 'all'
    ? ALL_CHIT_PLANS
    : ALL_CHIT_PLANS.filter((p) => p.filterKey === activePlanTab);

  // Handle security pin save
  const handleSaveSecurity = (e) => {
    e.preventDefault();
    if (pinInput.length === 4) {
      localStorage.setItem('webPasscodeEnabled', String(passcodeEnabled));
      localStorage.setItem('webPasscodePIN', pinInput);
      setSecuritySavedToast(true);
      setTimeout(() => {
        setSecuritySavedToast(false);
        setShowSecurityModal(false);
      }, 1500);
    }
  };

  // Handle language switch
  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    setLangToast(true);
    setTimeout(() => {
      setLangToast(false);
      setShowLanguageModal(false);
    }, 1200);
  };

  return (
    <div className="uh-page">
      {/* ── TOP HEADER & GREETING ── */}
      <div className="uh-header">
        <div className="uh-header-left">
          <div className="uh-welcome-pill">
            <Sparkles size={13} />
            <span>ஸ்ரீ பெரியநாயகி அம்மன் CHIT FUNDS • Est. 1999</span>
          </div>
          <h1 className="uh-name">{t('Welcome Back!')} {displayName}</h1>
        </div>

        <div className="uh-header-actions">
          {/* Investment Summary Pill */}
          <div
            className="uh-portfolio-pill"
            onClick={() => navigate('/user/portfolio')}
            title="Inspect your Chit Portfolio"
          >
            <div>
              <div className="uh-portfolio-pill-label">{t('Total Amount Invested')}</div>
              <div className="uh-portfolio-pill-value">{formatINR(totalPaid)}</div>
            </div>
            <ArrowRight size={16} color="var(--primary)" />
          </div>

          {/* Notifications Center */}
          <button
            className="uh-notif-btn"
            onClick={() => setShowNotifModal(true)}
            title={t('Notifications')}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="uh-notif-dot">{notifications.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* ── ACCOUNT OVERVIEW METRICS (4 CARDS) ── */}
      <div className="uh-metrics-grid">
        <div className="uh-metric-card" onClick={() => navigate('/user/group-card')} style={{ cursor: 'pointer' }}>
          <div className="uh-metric-head">
            <span className="uh-metric-label">{t('Active Groups')}</span>
            <div className="uh-metric-icon">
              <Users size={18} />
            </div>
          </div>
          <div className="uh-metric-value">{activeCount} {t('active')}</div>
          <p className="uh-metric-subtext">
            <span>{t('Total Groups')}: {portfolio.length}</span>
            <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
          </p>
        </div>

        <div className="uh-metric-card">
          <div className="uh-metric-head">
            <span className="uh-metric-label">{t('Total Paid Amount')}</span>
            <div className="uh-metric-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="uh-metric-value" style={{ color: '#059669' }}>
            {formatINR(totalPaid)}
          </div>
          <p className="uh-metric-subtext">
            <CheckCircle2 size={13} color="#059669" />
            <span>{t('Audited & verified against ledger')}</span>
          </p>
        </div>

        <div className="uh-metric-card">
          <div className="uh-metric-head">
            <span className="uh-metric-label">{t('Next Due:')}</span>
            <div className="uh-metric-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="uh-metric-value">{nextDue}</div>
          <p className="uh-metric-subtext">
            {primaryGroup ? primaryGroup.groupName || t('Primary Group') : t('All accounts settled')}
          </p>
        </div>

        <div className="uh-metric-card">
          <div className="uh-metric-head">
            <span className="uh-metric-label">{t('Member Standing')}</span>
            <div className="uh-metric-icon" style={{ background: '#eff6ff', color: '#1e40af' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="uh-metric-value" style={{ color: '#1e40af', fontSize: '20px' }}>
            {t('Verified / Eligible')}
          </div>
          <p className="uh-metric-subtext">
            {t('Eligible for monthly reverse auctions')}
          </p>
        </div>
      </div>

      {/* ── CHIT FUND CORE OPERATIONS (4 ACTION CARDS) ── */}
      <div>
        <h2 className="uh-section-title">
          <Landmark size={20} color="var(--primary)" />
          <span>Chit Fund Core Operations</span>
        </h2>
        <div className="uh-actions-grid">
          <div className="uh-action-card" onClick={() => navigate('/user/join-group')}>
            <div className="uh-action-card-top">
              <div className="uh-action-icon" style={{ background: '#eff6ff', color: '#1e40af' }}>
                <Users size={22} />
              </div>
              <ArrowRight size={18} color="var(--subtle)" />
            </div>
            <div>
              <h3 className="uh-action-title">Join a Chit Group</h3>
              <p className="uh-action-desc">Enroll in new chit circles using your administrator invitation code or browse open groups.</p>
            </div>
            <div className="uh-action-footer">
              <span>Open Registration</span>
              <ArrowRight size={14} />
            </div>
          </div>

          <div className="uh-action-card" onClick={() => navigate('/user/group-card')}>
            <div className="uh-action-card-top">
              <div className="uh-action-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                <FileText size={22} />
              </div>
              <ArrowRight size={18} color="var(--subtle)" />
            </div>
            <div>
              <h3 className="uh-action-title">Digital Passbook & Ledger</h3>
              <p className="uh-action-desc">Inspect your complete 20-month installments, dividend distribution, and print official statements.</p>
            </div>
            <div className="uh-action-footer" style={{ color: '#059669' }}>
              <span>View Passbook</span>
              <ArrowRight size={14} />
            </div>
          </div>

          <div className="uh-action-card" onClick={() => navigate('/user/auction')}>
            <div className="uh-action-card-top">
              <div className="uh-action-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                <Gavel size={22} />
              </div>
              <ArrowRight size={18} color="var(--subtle)" />
            </div>
            <div>
              <h3 className="uh-action-title">Live Reverse Auction</h3>
              <p className="uh-action-desc">Enter the real-time bidding console to bid down for this month's prize money payout.</p>
            </div>
            <div className="uh-action-footer" style={{ color: '#dc2626' }}>
              <span>Auction Arena</span>
              <ArrowRight size={14} />
            </div>
          </div>

          <div className="uh-action-card" onClick={() => navigate('/user/finance')}>
            <div className="uh-action-card-top">
              <div className="uh-action-icon" style={{ background: '#f5f3ff', color: '#6d28d9' }}>
                <Coins size={22} />
              </div>
              <ArrowRight size={18} color="var(--subtle)" />
            </div>
            <div>
              <h3 className="uh-action-title">Smart Finance & Loans</h3>
              <p className="uh-action-desc">Micro-credit solutions for shopkeeper 100-day cash flow and personal 10-week needs.</p>
            </div>
            <div className="uh-action-footer" style={{ color: '#6d28d9' }}>
              <span>Calculate Loan</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* ── CHIT SCHEMES CATALOG & DETAILED SHOWCASE (PARITY WITH CHITPLANS) ── */}
      <div className="uh-schemes-section">
        <div className="uh-schemes-header-row">
          <div>
            <h2 className="uh-section-title" style={{ margin: 0 }}>
              <Award size={20} color="var(--primary)" />
              <span>Official 20-Month Chit Schemes</span>
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
              Fully audited chit investment cycles regulated under the Reserve Bank of India & Chit Funds Act
            </p>
          </div>

          {/* Scheme Filter Tabs */}
          <div className="uh-schemes-tabs">
            {[
              { id: 'all', label: 'All Schemes' },
              { id: '1lakh', label: '1 Lakh' },
              { id: '2lakh', label: '2 Lakh' },
              { id: '3lakh', label: '3 Lakh' },
              { id: '5lakh', label: '5 Lakh' },
              { id: '10lakh', label: '10 Lakh' }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`uh-schemes-tab-btn ${activePlanTab === tab.id ? 'active' : ''}`}
                onClick={() => setActivePlanTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Schemes Grid */}
        <div className="uh-schemes-grid">
          {filteredSchemes.map((plan) => (
            <div key={plan.id} className="uh-scheme-card">
              <div>
                <div
                  className="uh-scheme-card-badge"
                  style={{
                    backgroundColor: `${plan.badgeColor}15`,
                    color: plan.badgeColor,
                    border: `1px solid ${plan.badgeColor}30`
                  }}
                >
                  <Sparkles size={11} />
                  <span>{plan.badge}</span>
                </div>

                <h3 className="uh-scheme-name">{plan.name}</h3>
                <p className="uh-scheme-desc">{plan.description}</p>

                <div className="uh-scheme-financials">
                  <div>
                    <div className="uh-scheme-fin-lbl">Total Chit Pool</div>
                    <div className="uh-scheme-fin-val" style={{ color: 'var(--primary)' }}>
                      {plan.amount}
                    </div>
                  </div>
                  <div>
                    <div className="uh-scheme-fin-lbl">Monthly Deposit</div>
                    <div className="uh-scheme-fin-val">
                      {plan.monthly} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)' }}>/mo</span>
                    </div>
                  </div>
                  <div>
                    <div className="uh-scheme-fin-lbl">Duration</div>
                    <div className="uh-scheme-fin-val">{plan.duration}</div>
                  </div>
                  <div>
                    <div className="uh-scheme-fin-lbl">Est. Payout</div>
                    <div className="uh-scheme-fin-val" style={{ color: '#059669' }}>
                      {plan.returnAmt}
                    </div>
                  </div>
                </div>
              </div>

              <div className="uh-scheme-actions">
                <button
                  className="uh-scheme-btn-details"
                  onClick={() => setSelectedSchemeDetail(plan)}
                >
                  <Info size={14} />
                  <span>View Breakdown</span>
                </button>
                <button
                  className="uh-scheme-btn-join"
                  onClick={() => navigate('/user/join-group')}
                >
                  <span>Enroll</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── EXPLORE GDK CHITFUNDS (4 CARDS WITH ASSETS) ── */}
      <div>
        <h2 className="uh-section-title">
          <Globe size={20} color="var(--primary)" />
          <span>Explore GDK ChitFunds Portal</span>
        </h2>
        <div className="uh-explore-grid">
          {/* Card 1: Location */}
          <div className="uh-explore-card" onClick={() => setShowLocationModal(true)}>
            <div className="uh-explore-info">
              <h3 className="uh-explore-title">Branch Location</h3>
              <p className="uh-explore-sub">Registered office & branch directions in Tiruppur & Coimbatore</p>
              <span className="uh-explore-action">
                <span>View Details</span>
                <ChevronRight size={14} />
              </span>
            </div>
            <img src={locationImg} alt="Office Location" className="uh-explore-art" />
          </div>

          {/* Card 2: Biometrics / Passcode Security */}
          <div className="uh-explore-card" onClick={() => setShowSecurityModal(true)}>
            <div className="uh-explore-info">
              <h3 className="uh-explore-title">Session Security</h3>
              <p className="uh-explore-sub">Configure 4-digit PIN lock for web session privacy & protection</p>
              <span className="uh-explore-action">
                <span>Configure PIN</span>
                <ChevronRight size={14} />
              </span>
            </div>
            <img src={biometricImg} alt="PIN Security" className="uh-explore-art" />
          </div>

          {/* Card 3: Digital Passbook & Ledger */}
          <div className="uh-explore-card" onClick={() => navigate('/user/group-card')}>
            <div className="uh-explore-info">
              <h3 className="uh-explore-title">Online Passbook</h3>
              <p className="uh-explore-sub">Real-time ledger updates, receipts, and statement print export</p>
              <span className="uh-explore-action">
                <span>Inspect Passbook</span>
                <ChevronRight size={14} />
              </span>
            </div>
            <img src={onlineImg} alt="Online Transactions" className="uh-explore-art" />
          </div>

          {/* Card 4: Dual Language */}
          <div className="uh-explore-card" onClick={() => setShowLanguageModal(true)}>
            <div className="uh-explore-info">
              <h3 className="uh-explore-title">{t('Language')}</h3>
              <p className="uh-explore-sub">{t('Switch between Tamil (தமிழ்) and English preference seamlessly') || 'Switch between Tamil (தமிழ்) and English preference seamlessly'}</p>
              <span className="uh-explore-action">
                <span>{language === 'ta' ? 'தமிழ் (Tamil)' : 'English'}</span>
                <ChevronRight size={14} />
              </span>
            </div>
            <img src={languageImg} alt="Dual Language" className="uh-explore-art" />
          </div>
        </div>
      </div>

      {/* ── MILESTONES & ACHIEVEMENTS ROW ── */}
      <div className="uh-milestones-grid">
        <div className="uh-milestone-card">
          <div>
            <h3 className="uh-milestone-val">500+</h3>
            <p className="uh-milestone-lbl">Active Members</p>
          </div>
          <img src={activeMembersImg} alt="Active Members" className="uh-milestone-img" />
        </div>

        <div className="uh-milestone-card">
          <div>
            <h3 className="uh-milestone-val">100%</h3>
            <p className="uh-milestone-lbl">Trust & Audit Score</p>
          </div>
          <img src={trustImg} alt="Trust Score" className="uh-milestone-img" />
        </div>

        <div className="uh-milestone-card">
          <div>
            <h3 className="uh-milestone-val">25+</h3>
            <p className="uh-milestone-lbl">Years Legacy (1999)</p>
          </div>
          <img src={yearsLegacyImg} alt="Years Legacy" className="uh-milestone-img" />
        </div>

        <div className="uh-milestone-card">
          <div>
            <h3 className="uh-milestone-val">₹50Cr+</h3>
            <p className="uh-milestone-lbl">Funds Managed</p>
          </div>
          <img src={fundMgmtImg} alt="Funds Managed" className="uh-milestone-img" />
        </div>
      </div>

      {/* ── COMMUNITY & TRUST ROW ── */}
      <div className="uh-community-grid">
        {/* WhatsApp Official Channel Card */}
        <div className="uh-comm-card" style={{ borderLeft: '4px solid #25D366' }}>
          <div className="uh-comm-left">
            <div className="uh-comm-pill" style={{ background: '#DCFCE7', color: '#15803D' }}>
              <Users size={12} />
              <span>Official Community</span>
            </div>
            <h3 className="uh-comm-title">WhatsApp Member Community</h3>
            <p className="uh-comm-desc">
              Receive live auction alerts, monthly cycle results, and important dividend notifications directly on WhatsApp.
            </p>
            <a
              href="https://chat.whatsapp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="uh-comm-btn"
              style={{ background: '#25D366', color: '#ffffff' }}
            >
              <span>Join WhatsApp Group</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Instagram Updates Card */}
        <div className="uh-comm-card" style={{ borderLeft: '4px solid #E1306C' }}>
          <div className="uh-comm-left">
            <div className="uh-comm-pill" style={{ background: '#FCE7F3', color: '#BE185D' }}>
              <Sparkles size={12} />
              <span>Social Updates</span>
            </div>
            <h3 className="uh-comm-title">Follow Us on Instagram</h3>
            <p className="uh-comm-desc">
              Discover savings strategies, auction winner testimonials, and customer milestone celebrations.
            </p>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="uh-comm-btn"
              style={{ background: '#0F172A', color: '#ffffff' }}
            >
              <span>Follow @GDKChitFunds</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* ── INSURED SAVINGS GUARANTEE BANNER ── */}
      <div className="uh-insurance-banner">
        <div className="uh-ins-content">
          <div className="uh-ins-badge">
            <ShieldCheck size={12} />
            <span>Guaranteed & Regulated</span>
          </div>
          <h3 className="uh-ins-title">Your Savings. Insured & Protected.</h3>
          <p className="uh-ins-desc">
            Sri Periyanayagi Amman Chit Funds operates strictly under the Chit Funds Act, 1982. Every chit cycle is registered with the State Chit Registrar and supported by mandatory bank guarantees.
          </p>
          <div className="uh-ins-badges-row">
            <div className="uh-ins-item">
              <CheckCircle2 size={15} color="#4338ca" />
              <span>RBI Recognized Compliance</span>
            </div>
            <div className="uh-ins-item">
              <CheckCircle2 size={15} color="#4338ca" />
              <span>100% Auction Transparency</span>
            </div>
            <div className="uh-ins-item">
              <CheckCircle2 size={15} color="#4338ca" />
              <span>Guaranteed On-Time Payout</span>
            </div>
          </div>
        </div>

        <div className="uh-ins-actions">
          <img src={bankLockerImg} alt="Bank Locker Security" className="uh-ins-img" />
          <button className="uh-ins-btn" onClick={() => setShowComplianceModal(true)}>
            Compliance Details
          </button>
        </div>
      </div>

      {/* ============================================================
          MODAL 1: SCHEME BREAKDOWN MODAL (PARITY WITH CHITPLANS)
          ============================================================ */}
      {selectedSchemeDetail && (
        <div className="uh-modal-backdrop" onClick={() => setSelectedSchemeDetail(null)}>
          <div className="uh-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="uh-modal-header">
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: selectedSchemeDetail.badgeColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  {selectedSchemeDetail.badge}
                </span>
                <h3 className="uh-modal-title">{selectedSchemeDetail.name}</h3>
              </div>
              <button
                className="uh-modal-close-btn"
                onClick={() => setSelectedSchemeDetail(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="uh-modal-body">
              <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
                {selectedSchemeDetail.description}
              </p>

              {/* Financial Box */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 12,
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 16
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
                    Total Gross Value
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                    {selectedSchemeDetail.amount}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
                    Monthly Deposit
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                    {selectedSchemeDetail.monthly}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
                    Tenure
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                    {selectedSchemeDetail.duration} ({selectedSchemeDetail.members})
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
                    Est. Minimum Payout
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#059669' }}>
                    {selectedSchemeDetail.returnAmt}
                  </div>
                </div>
              </div>

              {/* Ideal For */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  Ideal For:
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedSchemeDetail.idealFor.map((item, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '5px 12px',
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: 20,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: 'var(--text)'
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Key Highlights */}
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  Scheme Highlights & Protections:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedSchemeDetail.highlights.map((h, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text)' }}>
                      <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="uh-modal-footer">
              <button
                style={{
                  padding: '10px 18px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  color: 'var(--text)'
                }}
                onClick={() => setSelectedSchemeDetail(null)}
              >
                Close
              </button>
              <button
                style={{
                  padding: '10px 22px',
                  background: 'var(--primary)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
                onClick={() => {
                  setSelectedSchemeDetail(null);
                  navigate('/user/join-group');
                }}
              >
                <span>Join this Scheme</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: REGISTERED LOCATION MODAL
          ============================================================ */}
      {showLocationModal && (
        <div className="uh-modal-backdrop" onClick={() => setShowLocationModal(false)}>
          <div className="uh-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="uh-modal-header">
              <h3 className="uh-modal-title">Registered Office & Branch Locations</h3>
              <button className="uh-modal-close-btn" onClick={() => setShowLocationModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="uh-modal-body">
              {/* Head Office */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <MapPin size={18} color="var(--primary)" />
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                    Tiruppur Registered Headquarters
                  </span>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                  Sri Periyanayagi Amman Chit Funds Pvt Ltd<br />
                  No. 42, Kumaran Road, Near Railway Station,<br />
                  Tiruppur, Tamil Nadu — 641601
                </p>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Phone size={14} color="var(--primary)" />
                    +91-8610696889
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Mail size={14} color="var(--primary)" />
                    Gowthamnaveen124@gmail.com
                  </span>
                </div>
              </div>

              {/* Branch Office */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <MapPin size={18} color="#059669" />
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                    Coimbatore Regional Branch
                  </span>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                  108, Cross Cut Road, Gandhipuram,<br />
                  Coimbatore, Tamil Nadu — 641012
                </p>
                <div style={{ fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={14} color="var(--muted)" />
                  <span>Working Hours: Mon – Sat: 9:30 AM – 6:30 PM</span>
                </div>
              </div>
            </div>

            <div className="uh-modal-footer">
              <button
                style={{
                  padding: '9px 18px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: 'pointer'
                }}
                onClick={() => setShowLocationModal(false)}
              >
                Close
              </button>
              <a
                href="https://maps.google.com/?q=Tiruppur+Tamil+Nadu"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '9px 20px',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  borderRadius: 'var(--radius)',
                  fontWeight: 700,
                  fontSize: 13.5,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>Open in Google Maps</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 3: WEB PASSCODE & SECURITY SETTINGS
          ============================================================ */}
      {showSecurityModal && (
        <div className="uh-modal-backdrop" onClick={() => setShowSecurityModal(false)}>
          <div className="uh-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="uh-modal-header">
              <h3 className="uh-modal-title">Web Session Passcode Protection</h3>
              <button className="uh-modal-close-btn" onClick={() => setShowSecurityModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSecurity}>
              <div className="uh-modal-body">
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                  Configure your 4-digit security PIN to protect your active portal sessions from unauthorized physical access.
                </p>

                {/* Enable toggle */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 16,
                    background: 'var(--surface2)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                      Require 4-Digit Passcode on Wakeup
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                      Prompts for your security PIN when reloading or unlocking the portal
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={passcodeEnabled}
                    onChange={(e) => setPasscodeEnabled(e.target.checked)}
                    style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </div>

                {/* PIN Input */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
                    Set 4-Digit PIN Code
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 4 digits"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: '8px',
                      textAlign: 'center',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      outline: 'none',
                      background: 'var(--surface)'
                    }}
                  />
                </div>

                {securitySavedToast && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: '#ecfdf5',
                      color: '#059669',
                      borderRadius: 'var(--radius)',
                      fontSize: 13,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>Security PIN preferences updated successfully!</span>
                  </div>
                )}
              </div>

              <div className="uh-modal-footer">
                <button
                  type="button"
                  style={{
                    padding: '9px 18px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontWeight: 600,
                    fontSize: 13.5,
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowSecurityModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 22px',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: 'pointer'
                  }}
                >
                  Save Passcode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 4: DUAL LANGUAGE SELECTOR MODAL
          ============================================================ */}
      {showLanguageModal && (
        <div className="uh-modal-backdrop" onClick={() => setShowLanguageModal(false)}>
          <div className="uh-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="uh-modal-header">
              <h3 className="uh-modal-title">Language & Regional Preferences</h3>
              <button className="uh-modal-close-btn" onClick={() => setShowLanguageModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="uh-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* English */}
                <div
                  onClick={() => handleLanguageChange('en')}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius)',
                    border: `2px solid ${language === 'en' ? 'var(--primary)' : 'var(--border)'}`,
                    background: language === 'en' ? 'var(--primary-light)' : 'var(--surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>English</div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>Standard banking terminology</div>
                  </div>
                  {language === 'en' && <CheckCircle2 size={20} color="var(--primary)" />}
                </div>

                {/* Tamil */}
                <div
                  onClick={() => handleLanguageChange('ta')}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius)',
                    border: `2px solid ${language === 'ta' ? 'var(--primary)' : 'var(--border)'}`,
                    background: language === 'ta' ? 'var(--primary-light)' : 'var(--surface)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>தமிழ் (Tamil)</div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>ஸ்ரீ பெரியநாயகி அம்மன் சீட்டு நிதி</div>
                  </div>
                  {language === 'ta' && <CheckCircle2 size={20} color="var(--primary)" />}
                </div>
              </div>

              {langToast && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#ecfdf5',
                    color: '#059669',
                    borderRadius: 'var(--radius)',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Check size={16} />
                  <span>Language preference saved!</span>
                </div>
              )}
            </div>

            <div className="uh-modal-footer">
              <button
                style={{
                  padding: '9px 20px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: 'pointer'
                }}
                onClick={() => setShowLanguageModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 5: REGULATORY COMPLIANCE MODAL
          ============================================================ */}
      {showComplianceModal && (
        <div className="uh-modal-backdrop" onClick={() => setShowComplianceModal(false)}>
          <div className="uh-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="uh-modal-header">
              <h3 className="uh-modal-title">Legal Compliance & Security Safeguards</h3>
              <button className="uh-modal-close-btn" onClick={() => setShowComplianceModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="uh-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: 14, background: '#f8faff', borderRadius: 'var(--radius)', border: '1px solid #c7d2fe' }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: '#312e81', marginBottom: 4 }}>
                    Central Chit Funds Act, 1982
                  </div>
                  <div style={{ fontSize: 13, color: '#4338ca', lineHeight: 1.5 }}>
                    Operated under registration with the Registrar of Chits, Government of Tamil Nadu. Every chit circle is sanctioned before public invitation.
                  </div>
                </div>

                <div style={{ padding: 14, background: '#f8faff', borderRadius: 'var(--radius)', border: '1px solid #c7d2fe' }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: '#312e81', marginBottom: 4 }}>
                    100% Fixed Deposit Guarantee
                  </div>
                  <div style={{ fontSize: 13, color: '#4338ca', lineHeight: 1.5 }}>
                    Mandatory 100% security deposit pledged with nationalized banks in the name of the Chit Registrar for each group to ensure full subscriber safety.
                  </div>
                </div>

                <div style={{ padding: 14, background: '#f8faff', borderRadius: 'var(--radius)', border: '1px solid #c7d2fe' }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: '#312e81', marginBottom: 4 }}>
                    Transparent Reverse Auction Audit
                  </div>
                  <div style={{ fontSize: 13, color: '#4338ca', lineHeight: 1.5 }}>
                    All reverse bids are broadcast in real-time. Prize money disbursements are settled directly into the winner's authenticated bank account.
                  </div>
                </div>
              </div>
            </div>

            <div className="uh-modal-footer">
              <button
                style={{
                  padding: '9px 20px',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: 'pointer'
                }}
                onClick={() => setShowComplianceModal(false)}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 6: NOTIFICATIONS & OTP REQUESTS MODAL
          ============================================================ */}
      {showNotifModal && (
        <div className="uh-modal-backdrop" onClick={() => setShowNotifModal(false)}>
          <div className="uh-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="uh-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={18} color="var(--primary)" />
                <h3 className="uh-modal-title">Notification Center</h3>
              </div>
              <button className="uh-modal-close-btn" onClick={() => setShowNotifModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="uh-modal-body">
              {notifications.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {notifications.map((n, i) => {
                    const isOtp = n.type === 'otp_request';
                    return (
                      <div
                        key={i}
                        style={{
                          padding: 16,
                          borderRadius: 'var(--radius)',
                          background: isOtp ? '#eef2ff' : 'var(--surface2)',
                          border: `1px solid ${isOtp ? '#c7d2fe' : 'var(--border)'}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 14.5, color: isOtp ? '#3730a3' : 'var(--text)' }}>
                            {n.title}
                          </span>
                          {isOtp && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', background: '#e0e7ff', padding: '2px 8px', borderRadius: 10 }}>
                              OTP AUTH
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '0 0 10px 0', fontSize: 13, color: isOtp ? '#4338ca' : 'var(--muted)', lineHeight: 1.5 }}>
                          {n.message}
                        </p>
                        {isOtp && (
                          <button
                            onClick={() => {
                              setShowNotifModal(false);
                              navigate('/user/profile/otp-requests');
                            }}
                            style={{
                              padding: '6px 14px',
                              background: '#4f46e5',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: 12.5,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <span>Tap to View OTP Code</span>
                            <ArrowRight size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                  <Bell size={40} color="var(--subtle)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ margin: 0, fontSize: 14.5, fontWeight: 600 }}>No unread notifications at this time.</p>
                </div>
              )}
            </div>

            <div className="uh-modal-footer">
              <button
                style={{
                  padding: '9px 18px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: 'pointer'
                }}
                onClick={() => setShowNotifModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserHome;
