import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, ShieldCheck, Users, Lock, Building2,
  Languages, FileText, HelpCircle, ChevronRight, Search,
  CreditCard
} from 'lucide-react';
import './UserTool.css';

// ONLY tools that are NOT in the main sidebar
const USER_TOOL_SECTIONS = [
  {
    id: 'banking-identity',
    title: 'Banking, Identity & Account Vault',
    actions: [
      {
        id: 'account-details',
        Icon: User,
        title: 'Personal Identity Profile',
        desc: 'Full legal name, phone, email & address records',
        route: '/user/profile/account-details',
        color: '#1B3322',
        bg: '#EBF3ED'
      },
      {
        id: 'bank-account',
        Icon: CreditCard,
        title: 'Linked Bank Account & UPI',
        desc: 'Bank savings account & verified UPI for chit payouts',
        route: '/user/profile/link-bank-account',
        color: '#2E7D32',
        bg: '#EBF3ED'
      },
      {
        id: 'kyc-verification',
        Icon: ShieldCheck,
        title: 'KYC Document Verification',
        desc: 'Aadhaar, PAN & government verification compliance',
        route: '/user/profile/identity-verification',
        color: '#2E7D32',
        bg: '#EBF3ED'
      },
      {
        id: 'nominee-details',
        Icon: Users,
        title: 'Nominee & Beneficiary Records',
        desc: 'Designated legal heirs and emergency contacts',
        route: '/user/profile/nominee-details',
        color: '#A3704C',
        bg: '#FDF6F0'
      },
      {
        id: 'security-pin',
        Icon: Lock,
        title: 'Passcode & Screen Lock Security',
        desc: 'App PIN, biometric permissions, and device lock',
        route: '/user/profile/security-permission',
        color: '#D32F2F',
        bg: '#FDECEC'
      }
    ]
  },
  {
    id: 'regional-support',
    title: 'Branch Services & Legal Compliance',
    actions: [
      {
        id: 'admin-location',
        Icon: Building2,
        title: 'HQ & Branch Locations',
        desc: 'Registered headquarters and local branch coordinates',
        route: '/user/profile/admin-location',
        color: '#A3704C',
        bg: '#FDF6F0'
      },
      {
        id: 'language-settings',
        Icon: Languages,
        title: 'Language Settings',
        desc: 'Toggle between Tamil (தமிழ்) and English interface',
        route: '/user/profile/language-settings',
        color: '#2E7D32',
        bg: '#EBF3ED'
      },
      {
        id: 'privacy-policy',
        Icon: FileText,
        title: 'Chit Funds Act Directives',
        desc: 'Central Chit Funds Act rules, bye-laws and subscriber rights',
        route: '/user/profile/privacy-policy',
        color: '#1B3322',
        bg: '#EBF3ED'
      },
      {
        id: 'help-support',
        Icon: HelpCircle,
        title: 'Operations Help Desk',
        desc: 'Customer service helpline, tickets and grievance resolution',
        route: '/user/profile/help-support',
        color: '#2E7D32',
        bg: '#EBF3ED'
      }
    ]
  }
];

const UserTool = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredSections = USER_TOOL_SECTIONS.map(section => ({
    ...section,
    actions: section.actions.filter(item => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        section.title.toLowerCase().includes(q)
      );
    })
  })).filter(section => section.actions.length > 0);

  return (
    <div className="ut-page">
      {/* Search Header Bar */}
      <div className="ut-topbar">
        <div className="ut-topbar-info">
          <h1 className="ut-topbar-title">Subscriber Tools & Services</h1>
          <p className="ut-topbar-sub">Direct access to banking, KYC verification, nominee records, security, and branch coordinates</p>
        </div>
        <div className="ut-topbar-search">
          <Search size={16} color="#6B7A6E" />
          <input
            type="text"
            placeholder="Search subscriber utilities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ut-search-input"
          />
        </div>
      </div>

      {/* Grouped Sections */}
      <div className="ut-sections-container">
        {filteredSections.map(sec => (
          <div key={sec.id} className="ut-section">
            <h2 className="ut-section-title">{sec.title}</h2>

            <div className="ut-cards-grid">
              {sec.actions.map(tool => {
                const Icon = tool.Icon;
                return (
                  <div
                    key={tool.id}
                    className="ut-item-card"
                    onClick={() => navigate(tool.route)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="ut-item-icon-box" style={{ background: tool.bg, color: tool.color }}>
                      <Icon size={20} strokeWidth={2.2} />
                    </div>

                    <div className="ut-item-text">
                      <h3 className="ut-item-title">{tool.title}</h3>
                      <span className="ut-item-sub">{tool.desc}</span>
                    </div>

                    <ChevronRight size={18} className="ut-item-arrow" />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserTool;