import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.jsx';
import { makeRequest } from '../../../api/apiClient.js';
import {
  Bell, Landmark, Gavel, Coins, Users, ArrowRight,
  TrendingUp, ShieldCheck, CheckCircle2, AlertCircle, Clock,
  FileText, Calendar, X, RefreshCw
} from 'lucide-react';
import './Home.css';

const formatINR = (amt) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amt) || 0);

const CHIT_SCHEMES = [
  { id: 1, name: '₹1,00,000 Scheme', monthly: 5000, tenure: 20, maxDiv: '₹15,000', returnAmt: '₹95,000', category: 'Standard Plan' },
  { id: 2, name: '₹2,00,000 Scheme', monthly: 10000, tenure: 20, maxDiv: '₹30,000', returnAmt: '₹1,90,000', category: 'Value Plan' },
  { id: 3, name: '₹3,00,000 Scheme', monthly: 15000, tenure: 20, maxDiv: '₹45,000', returnAmt: '₹2,85,000', category: 'Growth Plan' },
  { id: 4, name: '₹5,00,000 Scheme', monthly: 25000, tenure: 20, maxDiv: '₹75,000', returnAmt: '₹4,75,000', category: 'Commercial Plan' },
];

const UserHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [loading, setLoading] = useState(true);

  const displayName = user?.name || user?.username || 'Member';

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        // 1. Fetch user portfolio
        const resPortfolio = await makeRequest('/user/portfolio');
        const dataPort = await resPortfolio.json();
        if (dataPort.success && Array.isArray(dataPort.data)) {
          setPortfolio(dataPort.data);
        }

        // 2. Fetch notifications
        const resNotif = await makeRequest('/user/notifications');
        const dataNotif = await resNotif.json();
        if (dataNotif.success && Array.isArray(dataNotif.data)) {
          setNotifications(dataNotif.data);
        }
      } catch (e) {
        console.error('Error loading dashboard:', e);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // Calculate totals
  const totalContributed = portfolio.reduce((acc, g) => acc + (Number(g.totalPaid) || Number(g.groupCollectedAmount) || 0), 0);
  const activeCount = portfolio.filter((g) => g.paymentStatus !== 'completed').length;
  const nextGroup = portfolio[0];
  const nextDue = nextGroup
    ? formatINR(nextGroup.monthlyContribution || Math.round((Number(nextGroup.investmentAmount) || 100000) / 20))
    : 'No Dues Pending';

  return (
    <div className="uh-page">
      {/* Header */}
      <div className="uh-header">
        <div>
          <span className="uh-welcome">Sri Periyanayagi Amman Chit Fund</span>
          <h1 className="uh-name">Welcome back, {displayName}</h1>
        </div>

        <button
          className="uh-notif-btn"
          onClick={() => setShowNotif(true)}
          title="Notification Center"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {notifications.length > 0 && <span className="uh-notif-dot">{notifications.length}</span>}
        </button>
      </div>

      {/* Account Overview Metrics */}
      <div className="uh-metrics-grid">
        <div className="uh-metric-card">
          <div className="uh-metric-head">
            <span className="uh-metric-label">Enrolled Chit Groups</span>
            <div className="uh-metric-icon">
              <Users size={18} />
            </div>
          </div>
          <div className="uh-metric-value">{activeCount} Active</div>
          <p className="uh-metric-subtext">Total accounts: {portfolio.length}</p>
        </div>

        <div className="uh-metric-card">
          <div className="uh-metric-head">
            <span className="uh-metric-label">Total Amount Paid</span>
            <div className="uh-metric-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="uh-metric-value" style={{ color: '#059669' }}>
            {formatINR(totalContributed)}
          </div>
          <p className="uh-metric-subtext">Verified against official ledger</p>
        </div>

        <div className="uh-metric-card">
          <div className="uh-metric-head">
            <span className="uh-metric-label">Next Monthly Installment</span>
            <div className="uh-metric-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="uh-metric-value">{nextDue}</div>
          <p className="uh-metric-subtext">
            {nextGroup ? nextGroup.groupName || 'Primary Group' : 'All accounts settled'}
          </p>
        </div>

        <div className="uh-metric-card">
          <div className="uh-metric-head">
            <span className="uh-metric-label">Member Standing</span>
            <div className="uh-metric-icon" style={{ background: '#eff6ff', color: '#1e40af' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="uh-metric-value" style={{ color: '#1e40af', fontSize: '20px' }}>
            Active / Good
          </div>
          <p className="uh-metric-subtext">Eligible for monthly reverse auctions</p>
        </div>
      </div>

      {/* Chit Actions Grid */}
      <div>
        <h2 className="uh-section-title">
          Chit Fund Operations
        </h2>
        <div className="uh-actions-grid">
          <div className="uh-action-card" onClick={() => navigate('/user/join-group')}>
            <div className="uh-action-icon" style={{ background: '#eff6ff', color: '#1e40af' }}>
              <Users size={22} />
            </div>
            <div className="uh-action-body">
              <h3 className="uh-action-title">Join a Chit Group</h3>
              <p className="uh-action-desc">Enroll using your administrator invitation code or browse open groups.</p>
            </div>
            <ArrowRight size={18} color="var(--subtle)" style={{ alignSelf: 'center' }} />
          </div>

          <div className="uh-action-card" onClick={() => navigate('/user/group-card')}>
            <div className="uh-action-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Landmark size={22} />
            </div>
            <div className="uh-action-body">
              <h3 className="uh-action-title">Group Passbook & Ledger</h3>
              <p className="uh-action-desc">Inspect your complete 20-month installments, dividend credits, and print statements.</p>
            </div>
            <ArrowRight size={18} color="var(--subtle)" style={{ alignSelf: 'center' }} />
          </div>

          <div className="uh-action-card" onClick={() => navigate('/user/auction')}>
            <div className="uh-action-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
              <Gavel size={22} />
            </div>
            <div className="uh-action-body">
              <h3 className="uh-action-title">Live Reverse Auction</h3>
              <p className="uh-action-desc">Enter the real-time bidding console to claim this month's prize money payout.</p>
            </div>
            <ArrowRight size={18} color="var(--subtle)" style={{ alignSelf: 'center' }} />
          </div>

          <div className="uh-action-card" onClick={() => navigate('/user/finance')}>
            <div className="uh-action-icon" style={{ background: '#f5f3ff', color: '#6d28d9' }}>
              <Coins size={22} />
            </div>
            <div className="uh-action-body">
              <h3 className="uh-action-title">Smart Finance & Loans</h3>
              <p className="uh-action-desc">Micro-credit options for shopkeeper daily cash flow and personal weekly needs.</p>
            </div>
            <ArrowRight size={18} color="var(--subtle)" style={{ alignSelf: 'center' }} />
          </div>
        </div>
      </div>

      {/* Chit Schemes Catalog Table */}
      <div className="uh-table-card">
        <div className="uh-table-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              Official Chit Schemes Catalog
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>
              Standard 20-month cycles regulated under the Chit Funds Act
            </p>
          </div>

          <button
            onClick={() => navigate('/user/join-group')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius)',
              background: 'var(--primary)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Join Scheme
          </button>
        </div>

        <div className="uh-table-responsive">
          <table className="uh-schemes-table">
            <thead>
              <tr>
                <th>Scheme Name</th>
                <th>Total Chit Value</th>
                <th>Monthly Installment</th>
                <th>Tenure</th>
                <th>Est. Minimum Return</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {CHIT_SCHEMES.map((scheme) => (
                <tr key={scheme.id}>
                  <td style={{ fontWeight: 600 }}>{scheme.name}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {formatINR(scheme.monthly * scheme.tenure)}
                  </td>
                  <td>{formatINR(scheme.monthly)} / month</td>
                  <td>{scheme.tenure} Months</td>
                  <td style={{ color: '#059669', fontWeight: 600 }}>{scheme.returnAmt}</td>
                  <td>
                    <button
                      onClick={() => navigate('/user/join-group')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        background: 'var(--surface2)',
                        color: 'var(--text)',
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Enroll Now
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Institutional Guarantee Banner */}
      <div className="uh-institution-banner">
        <div className="uh-institution-info">
          <h4>Sri Periyanayagi Amman Chit Funds</h4>
          <p>Government Registered & Compliant • Serving Families Since 1999 • All auctions strictly audited</p>
        </div>

        <div className="uh-institution-badges">
          <div className="uh-badge-item">
            <ShieldCheck size={16} color="#059669" />
            <span>Chit Funds Act Compliant</span>
          </div>
          <div className="uh-badge-item">
            <CheckCircle2 size={16} color="#1e40af" />
            <span>Guaranteed Payouts</span>
          </div>
        </div>
      </div>

      {/* Notifications Modal */}
      {showNotif && (
        <div className="uh-modal-backdrop" onClick={() => setShowNotif(false)}>
          <div className="uh-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Notification Center</h3>
              <button
                onClick={() => setShowNotif(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {notifications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notifications.map((n, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 14,
                      borderRadius: 'var(--radius)',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                      {n.message}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--muted)' }}>
                <Bell size={36} color="var(--subtle)" style={{ margin: '0 auto 10px' }} />
                <p style={{ margin: 0, fontSize: 14 }}>No new notifications at this time.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserHome;
