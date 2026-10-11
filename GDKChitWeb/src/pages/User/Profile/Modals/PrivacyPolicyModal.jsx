import React, { useState } from 'react';
import { ShieldCheck, X, FileText, Search, CheckCircle2, Lock, Gavel, HelpCircle } from 'lucide-react';
import './ProfileModals.css';

const CHIT_RULES = [
  {
    num: 1,
    titleEn: 'New Member Policy',
    titleTa: 'புதிய உறுப்பினர் கொள்கை',
    descEn: 'New joining members will receive the chit amount at the end of the chit cycle.',
    descTa: 'புதிதாக சேரும் உறுப்பினர்கள் சிட் சுழற்சியின் இறுதியில் சிட் தொகையைப் பெறுவார்கள்.'
  },
  {
    num: 2,
    titleEn: 'Auction Attendance',
    titleTa: 'ஏலம் வருகை',
    descEn: 'All members must participate in or designate digital proxy for the monthly auction process.',
    descTa: 'சிட் ஏல செயல்முறையின் போது அனைத்து உறுப்பினர்களும் கலந்து கொள்ள வேண்டும்.'
  },
  {
    num: 3,
    titleEn: 'Monthly Payments',
    titleTa: 'மாதாந்திர பணம்',
    descEn: 'Monthly installment payments must be made on time without delay before the due date.',
    descTa: 'மாதாந்திர தவணை பணம் தாமதம் இல்லாமல் சரியான நேரத்தில் செலுத்த வேண்டும்.'
  },
  {
    num: 4,
    titleEn: 'Bidding Process',
    titleTa: 'ஏல செயல்முறை',
    descEn: 'The bidder with the lowest bid discount according to group cap rules wins that month\'s prize pool.',
    descTa: 'குறைந்த ஏலம் விடும் நபர் அந்த மாதத்திற்கான சிட் தொகையைப் பெறுவார்.'
  },
  {
    num: 5,
    titleEn: 'Guarantor Requirement',
    titleTa: 'உத்தரவாதம் தேவை',
    descEn: 'Prized subscribers must furnish verified surety/guarantors prior to disbursement.',
    descTa: 'ஒவ்வொரு உறுப்பினரும் தேவைப்படும் போது பணம் செலுத்துவதற்கு பொறுப்பான உத்தரவாதம் அளிக்க வேண்டும்.'
  },
  {
    num: 6,
    titleEn: 'Documentation & KYC',
    titleTa: 'ஆவணங்கள் மற்றும் கேஒய்சி',
    descEn: 'Subscribers must submit government ID proofs (Aadhaar & PAN) and verified bank details.',
    descTa: 'அனைத்து உறுப்பினர்களும் அடையாள சான்று மற்றும் முகவரி சான்று உள்ளிட்ட ஆவணங்களை சமர்பிக்க வேண்டும்.'
  },
  {
    num: 7,
    titleEn: 'Default Penalties',
    titleTa: 'தாமதத்திற்கான அபராதம்',
    descEn: 'Overdue installments incur late payment interest and forfeiture of dividend sharing for the missed month.',
    descTa: 'ஒப்புக்கொள்ளப்பட்ட விதிமுறைகளின்படி தாமதமான பணம் செலுத்துதலுக்கு அபராதம் விதிக்கப்படும்.'
  },
  {
    num: 8,
    titleEn: 'Chit Group Completion',
    titleTa: 'சிட் நிதி நிறைவு',
    descEn: 'The chit fund concludes cleanly when all cycle installments and prize disbursements complete.',
    descTa: 'அனைத்து உறுப்பினர்களும் தங்கள் சிட் தொகையைப் பெற்ற பிறகு சிட் நிதி முடிவடையும்.'
  },
  {
    num: 9,
    titleEn: 'Member Confidentiality',
    titleTa: 'உறுப்பினர் பொறுப்புகள்',
    descEn: 'Group financial records, bid increments, and personal information remain strictly confidential.',
    descTa: 'அனைத்து உறுப்பினர்களும் ரகசியத்தன்மையை பராமரிப்பதற்கும் குழு விதிகளை பின்பற்றுவதற்கும் பொறுப்பாவார்கள்.'
  },
  {
    num: 10,
    titleEn: 'Emergency Provisions',
    titleTa: 'அவசர சூழ்நிலைகள்',
    descEn: 'In critical verified emergencies, management may approve structured payment installment extensions.',
    descTa: 'அவசர சூழ்நிலைகளில், குழு நிர்வாகம் பணம் செலுத்தும் நீட்டிப்பு குறித்து முடிவு செய்யும்.'
  },
  {
    num: 11,
    titleEn: 'Dispute Resolution',
    titleTa: 'சர்ச்சை தீர்வு',
    descEn: 'All queries and disputes are resolved under Tamil Nadu Chit Funds Act statutory arbitration procedures.',
    descTa: 'அனைத்து சர்ச்சைகளும் உறுப்பினர்களிடையே விவாதம் மற்றும் சட்ட ஒப்பந்தத்தின் மூலம் தீர்க்கப்படும்.'
  },
  {
    num: 12,
    titleEn: 'Legal & Statutory Compliance',
    titleTa: 'சட்ட இணக்கம்',
    descEn: '100% compliant with Central Chit Funds Act 1982 and state registration guidelines.',
    descTa: 'அனைத்து சிட் நிதி செயல்பாடுகளும் இந்திய சிட் நிதி சட்டம் 1982 விதிமுறைகளுக்கு இணங்கும்.'
  }
];

const PRIVACY_SECTIONS = [
  {
    title: 'Data Collection & Identity Protection',
    desc: 'We collect only statutory KYC documents (Aadhaar, PAN, Bank IFSC) mandated by the Chit Funds Act. Your data is stored in bank-grade encrypted vaults.'
  },
  {
    title: 'Payment & Bank Account Security',
    desc: 'All payment gateway integrations comply with PCI-DSS standards. We never store debit/credit card CVV or netbanking passwords on our servers.'
  },
  {
    title: 'Zero Third-Party Marketing',
    desc: 'We do not sell, rent, or trade your personal or financial records to third-party telemarketers or external advertisers.'
  },
  {
    title: 'Data Retention & Audit Trail',
    desc: 'Transaction logs are archived for 8 years as required by Indian financial compliance, accessible to authorized government auditors upon request.'
  }
];

const PrivacyPolicyModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'privacy'
  const [langView, setLangView] = useState('both'); // 'both' | 'en' | 'ta'
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredRules = CHIT_RULES.filter(r => {
    const q = search.toLowerCase();
    return (
      r.titleEn.toLowerCase().includes(q) ||
      r.descEn.toLowerCase().includes(q) ||
      r.titleTa.includes(search) ||
      r.descTa.includes(search)
    );
  });

  return (
    <div className="prof-modal-backdrop" onClick={onClose}>
      <div className="prof-modal-card" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className="prof-modal-header">
          <div className="prof-modal-title-group">
            <div className="prof-modal-icon-badge" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="prof-modal-title">Privacy Policy & Chit Fund Rules</h2>
              <p className="prof-modal-subtitle">100% compliant with Chit Funds Act 1982 & RBI guidelines</p>
            </div>
          </div>
          <button className="prof-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="prof-modal-body">
          {/* Tab switches */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
            <button
              onClick={() => setActiveTab('rules')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'rules' ? '#7c3aed' : '#f1f5f9',
                color: activeTab === 'rules' ? '#ffffff' : '#475569',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Gavel size={14} />
              12 Chit Fund Rules
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'privacy' ? '#7c3aed' : '#f1f5f9',
                color: activeTab === 'privacy' ? '#ffffff' : '#475569',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Lock size={14} />
              Data Privacy & Security
            </button>
          </div>

          {activeTab === 'rules' && (
            <>
              {/* Search & Language Toggle */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search rules..."
                    className="prof-form-input"
                    style={{ paddingLeft: 32, height: 36, fontSize: 13 }}
                  />
                </div>
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 6, padding: 2 }}>
                  <button
                    onClick={() => setLangView('both')}
                    style={{
                      border: 'none',
                      background: langView === 'both' ? '#fff' : 'transparent',
                      color: langView === 'both' ? '#1e293b' : '#64748b',
                      fontWeight: 600,
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    Both
                  </button>
                  <button
                    onClick={() => setLangView('en')}
                    style={{
                      border: 'none',
                      background: langView === 'en' ? '#fff' : 'transparent',
                      color: langView === 'en' ? '#1e293b' : '#64748b',
                      fontWeight: 600,
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLangView('ta')}
                    style={{
                      border: 'none',
                      background: langView === 'ta' ? '#fff' : 'transparent',
                      color: langView === 'ta' ? '#1e293b' : '#64748b',
                      fontWeight: 600,
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    தமிழ்
                  </button>
                </div>
              </div>

              {/* Rules List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredRules.map((rule) => (
                  <div
                    key={rule.num}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff'
                    }}
                  >
                    <div style={{
                      minWidth: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: '#f5f3ff',
                      color: '#7c3aed',
                      fontWeight: 700,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {rule.num}
                    </div>
                    <div style={{ flex: 1 }}>
                      {(langView === 'both' || langView === 'en') && (
                        <div>
                          <strong style={{ fontSize: 13, color: '#1e293b' }}>{rule.titleEn}</strong>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                            {rule.descEn}
                          </p>
                        </div>
                      )}
                      {(langView === 'both' || langView === 'ta') && (
                        <div style={{ marginTop: langView === 'both' ? 6 : 0, borderTop: langView === 'both' ? '1px dashed #f1f5f9' : 'none', paddingTop: langView === 'both' ? 4 : 0 }}>
                          <strong style={{ fontSize: 13, color: '#6d28d9' }}>{rule.titleTa}</strong>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                            {rule.descTa}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PRIVACY_SECTIONS.map((sec, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    <h4 style={{ margin: 0, fontSize: 14, color: '#1e293b' }}>{sec.title}</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                    {sec.desc}
                  </p>
                </div>
              ))}

              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                padding: 12,
                borderRadius: 8,
                fontSize: 12,
                color: '#1e40af',
                lineHeight: 1.5
              }}>
                <strong>Last Updated:</strong> March 2026. Certified under Chit Funds (Regulation) Act 1982.
              </div>
            </div>
          )}
        </div>

        <div className="prof-modal-footer">
          <button className="prof-btn-primary" onClick={onClose} style={{ width: '100%' }}>
            I Understand & Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
