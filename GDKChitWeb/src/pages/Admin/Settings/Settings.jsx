import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import {
  ArrowLeft as RiArrowLeftLine, ChevronRight as RiArrowRightSLine, ShieldCheck as RiShieldUserLine, User as RiUserLine,
  Phone as RiPhoneLine, Landmark as RiBankLine, FileLock as RiFileShieldLine, MapPin as RiMapPinLine, Map as RiMap2Line,
  Lock as RiLockLine, FileText as RiFileInfoLine, HelpCircle as RiQuestionLine, Share2 as RiShareLine, Star as RiStarLine,
  LogOut as RiLogoutBoxLine, Camera as RiInstagramLine, Play as RiYoutubeLine, MessageCircle as RiWhatsappLine,
  Link as RiLinkLine, Check as RiCheckLine,
} from 'lucide-react';
const RiStarFill = RiStarLine;

const SECTIONS = [
  {
    title: 'Profile Settings',
    items: [
      { id: 'account',  Icon: RiUserLine,      label: 'Account Details',     desc: 'View and update your account info' },
      { id: 'bank',     Icon: RiBankLine,      label: 'Linked Bank Account',  desc: 'Manage bank account details' },
      { id: 'identity', Icon: RiFileShieldLine,label: 'Identity Verification',desc: 'KYC and document verification' },
      { id: 'nominee',  Icon: RiShieldUserLine,label: 'Nominee Details',      desc: 'Manage nominee information' },
    ],
  },
  {
    title: 'Advanced Features',
    items: [
      { id: 'security', Icon: RiLockLine,     label: 'Security & Permission', desc: 'Password, PIN and permissions' },
      { id: 'location', Icon: RiMapPinLine,   label: 'My Location',           desc: 'Current location settings' },
      { id: 'adminloc', Icon: RiMap2Line,     label: 'Admin Location',        desc: 'Admin office location' },
    ],
  },
  {
    title: 'General',
    items: [
      { id: 'privacy',  Icon: RiFileInfoLine, label: 'Privacy Policy',     desc: 'Our data privacy policy' },
      { id: 'help',     Icon: RiQuestionLine, label: 'Help & Support',      desc: 'FAQs and contact support' },
      { id: 'share',    Icon: RiShareLine,    label: 'Share GDK Chit Fund',desc: 'Invite friends to join' },
      { id: 'rate',     Icon: RiStarLine,     label: 'Rate GDK Chit Fund', desc: 'Leave us a review' },
    ],
  },
];

// ── Back button shared style ──────────────────────────────────
const BackBtn = ({ onBack }) => (
  <button onClick={onBack} style={{ background: 'var(--surface2)', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <RiArrowLeftLine size={18} />
  </button>
);

const SubHead = ({ label, onBack }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
    <BackBtn onBack={onBack} />
    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{label}</h3>
  </div>
);

// ── Sub-pages ─────────────────────────────────────────────────
const AccountDetails = ({ user, onBack }) => (
  <div>
    <SubHead label="Account Details" onBack={onBack} />
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, background: 'var(--primary-light)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
        {String(user?.name || user?.username || 'A').charAt(0).toUpperCase()}
      </div>
      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800 }}>{user?.name || user?.username || 'Admin'}</h2>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>{user?.role || 'admin'}</p>
    </div>
    {[
      { label: 'Full Name',    value: user?.name || user?.username || '--' },
      { label: 'Phone Number', value: user?.phone || '--' },
      { label: 'Role',         value: user?.role || 'admin' },
      { label: 'User ID',      value: user?.id || '--' },
    ].map((r) => (
      <div key={r.label} className="rn-detail-row">
        <span>{r.label}</span>
        <strong>{r.value}</strong>
      </div>
    ))}
  </div>
);

const PrivacyPolicy = ({ onBack }) => (
  <div>
    <SubHead label="Privacy Policy" onBack={onBack} />
    {[
      { title: 'Data Collection', text: 'We collect personal information including name, phone number, and financial data to provide our chit fund services.' },
      { title: 'Data Usage', text: 'Your data is used solely for managing chit fund groups, processing payments, and communicating important updates.' },
      { title: 'Data Security', text: 'All data is encrypted and stored securely. We never sell or share your personal information with third parties.' },
      { title: 'Your Rights', text: 'You have the right to access, update, or request deletion of your personal data at any time.' },
      { title: 'Contact Us', text: 'For privacy-related queries, contact our support team through the Help & Support section.' },
    ].map((s) => (
      <div key={s.title} style={{ marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: 15 }}>{s.title}</h4>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>{s.text}</p>
      </div>
    ))}
    <p style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 24 }}>Last updated: January 2025</p>
  </div>
);

const HelpSupport = ({ onBack }) => (
  <div>
    <SubHead label="Help & Support" onBack={onBack} />
    <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>Have questions? We're here to help.</p>
    {[
      { q: 'How do I join a chit fund group?', a: 'Contact your admin who will add you to an appropriate group based on your preferred plan.' },
      { q: 'When are monthly payments due?', a: 'Payments are typically due on the 15th of each month. Your admin will notify you in advance.' },
      { q: 'How are auctions conducted?', a: 'Monthly auctions are conducted transparently. Members can bid for early access to the pool amount.' },
      { q: 'What if I miss a payment?', a: 'Contact your admin immediately. Late payments may incur penalties as per the group agreement.' },
    ].map((faq, i) => (
      <div key={i} style={{ marginBottom: 16, background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 16, border: '1px solid var(--border)' }}>
        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14, color: 'var(--text)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <RiQuestionLine size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} /> {faq.q}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{faq.a}</p>
      </div>
    ))}
    <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius)', padding: 16, marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <RiPhoneLine size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--primary)' }}>Contact Support</p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>Call us at +91 86106 96889 or visit our office during business hours.</p>
      </div>
    </div>
  </div>
);

const GenericPage = ({ title, Icon, onBack }) => (
  <div>
    <SubHead label={title} onBack={onBack} />
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        {Icon ? <Icon size={28} color="var(--primary)" /> : null}
      </div>
      <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>{title}</h3>
      <p>This feature is coming soon to the web dashboard.</p>
      <p style={{ fontSize: 13 }}>Please use the GDK Chit Fund mobile app for full access.</p>
    </div>
  </div>
);

// ── Main Settings Component ──────────────────────────────────
const Settings = () => {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState(null);
  const [rating, setRating] = useState(0);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleItem = (id) => {
    if (id === 'rate')  { setShowRateModal(true); return; }
    if (id === 'share') { setShowShareModal(true); return; }
    setActivePage(id);
  };

  const renderPage = () => {
    if (!activePage) return null;
    const allItems = SECTIONS.flatMap((s) => s.items);
    const item = allItems.find((i) => i.id === activePage);
    if (activePage === 'account') return <AccountDetails user={user} onBack={() => setActivePage(null)} />;
    if (activePage === 'privacy') return <PrivacyPolicy onBack={() => setActivePage(null)} />;
    if (activePage === 'help')    return <HelpSupport onBack={() => setActivePage(null)} />;
    return <GenericPage title={item?.label || activePage} Icon={item?.Icon} onBack={() => setActivePage(null)} />;
  };

  if (activePage) {
    return (
      <div className="rn-page">
        <div className="rn-card">{renderPage()}</div>
      </div>
    );
  }

  const SOCIAL = [
    { Icon: RiInstagramLine, label: 'Instagram', color: '#E1306C' },
    { Icon: RiYoutubeLine,   label: 'YouTube',   color: '#FF0000' },
    { Icon: RiWhatsappLine,  label: 'WhatsApp',  color: '#25D366' },
  ];

  return (
    <div className="rn-page">
      <style>{`
        .set-menu-item { display:flex; justify-content:space-between; align-items:center; padding:14px 16px; background:transparent; border:none; text-align:left; cursor:pointer; width:100%; border-radius:var(--radius); transition:background 0.15s; }
        .set-menu-item:hover { background:var(--primary-light); }
        .set-menu-item + .set-menu-item { border-top:1px solid var(--border); border-radius:0; }
        .set-menu-left { display:flex; align-items:center; gap:14px; }
        .set-menu-icon { width:42px; height:42px; border-radius:var(--radius); background:var(--primary-light); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .set-menu-label { margin:0 0 3px; font-size:15px; font-weight:600; color:var(--text); }
        .set-menu-desc { margin:0; font-size:12px; color:var(--muted); }
        .star-btn { background:none; border:none; cursor:pointer; padding:4px; transition:transform 0.1s; display:flex; }
        .star-btn:hover { transform:scale(1.2); }
      `}</style>

      {/* Profile Banner */}
      <div className="rn-card" style={{ background: 'linear-gradient(135deg,var(--surface),#F0F3FF)', border: '1px solid rgba(40,66,196,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, flexShrink: 0 }}>
            {String(user?.name || user?.username || 'A').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
              {user?.name || user?.username || 'Admin'}
            </h2>
            <p style={{ margin: '0 0 6px', color: 'var(--muted)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
              <RiPhoneLine size={14} /> {user?.phone || '--'}
            </p>
            <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '3px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <RiShieldUserLine size={12} /> {user?.role || 'admin'}
            </span>
          </div>
        </div>
        <div style={{ width: 48, height: 3, background: 'var(--primary)', borderRadius: 2, marginTop: 16 }} />
        <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--muted)' }}>
          GDK Chit Fund — Trusted Since 1999
        </p>
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: 'var(--subtle)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {section.title}
          </p>
          <div className="rn-card" style={{ padding: 0, overflow: 'hidden' }}>
            {section.items.map((item) => (
              <button key={item.id} className="set-menu-item" onClick={() => handleItem(item.id)}>
                <div className="set-menu-left">
                  <div className="set-menu-icon">
                    <item.Icon size={20} color="var(--primary)" />
                  </div>
                  <div>
                    <p className="set-menu-label">{item.label}</p>
                    <p className="set-menu-desc">{item.desc}</p>
                  </div>
                </div>
                <RiArrowRightSLine size={20} color="var(--muted)" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Social Follow */}
      <div className="rn-card" style={{ textAlign: 'center' }}>
        <p style={{ margin: '0 0 14px', fontWeight: 600, color: 'var(--muted)' }}>Follow us, to stay updated</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          {SOCIAL.map((s) => (
            <button key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: `${s.color}12`, border: `1px solid ${s.color}30`, borderRadius: 'var(--radius)', padding: '12px 20px', cursor: 'pointer', transition: 'background 0.15s' }}>
              <s.Icon size={24} color={s.color} />
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={logout}
          style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', padding: '14px 48px', fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <RiLogoutBoxLine size={18} /> Logout
        </button>
        <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--subtle)' }}>Version 3.1.4 · GDK Admin Web</p>
      </div>

      {/* Rate Modal */}
      {showRateModal && (
        <div className="rn-modal-backdrop" onClick={() => setShowRateModal(false)}>
          <div className="rn-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ textAlign: 'center' }}>Rate GDK Chit Fund</h3>
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>How would you rate your experience?</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, margin: '16px 0' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} className="star-btn" onClick={() => setRating(n)}>
                  {n <= rating
                    ? <RiStarFill size={36} color="#FFB800" />
                    : <RiStarLine size={36} color="#D1D5DB" />
                  }
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p style={{ textAlign: 'center', color: 'var(--primary)', fontWeight: 600 }}>
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][rating]}
              </p>
            )}
            <button className="rn-primary" style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => setShowRateModal(false)}>
              <RiCheckLine size={16} /> {rating > 0 ? `Submit ${rating} Star Rating` : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="rn-modal-backdrop" onClick={() => setShowShareModal(false)}>
          <div className="rn-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RiShareLine size={20} color="var(--primary)" /> Share GDK Chit Fund
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Invite friends and family to join our trusted chit fund community.</p>
            <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius)', padding: 14, fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all', marginBottom: 12 }}>
              https://gdkchitfund.app/join?ref=admin
            </div>
            <button className="rn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => { navigator.clipboard?.writeText('https://gdkchitfund.app/join?ref=admin'); }}>
              <RiLinkLine size={16} /> Copy Link
            </button>
            <button style={{ marginTop: 8, background: 'transparent', border: 'none', color: 'var(--muted)', width: '100%', padding: 10, cursor: 'pointer', fontSize: 14 }} onClick={() => setShowShareModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
