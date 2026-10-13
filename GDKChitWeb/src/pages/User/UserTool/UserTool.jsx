import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Landmark, ShieldCheck, Users, Lock, KeyRound, MapPin,
  Building2, Languages, BookOpen, FileText, HelpCircle, Share2,
  Star, ChevronRight, Search, BarChart3, MessageSquare, Gavel
} from 'lucide-react';
import './UserTool.css';

const USER_TOOL_SECTIONS = [
  {
    id: 'financial-services',
    title: 'Financial & Scheme Management',
    actions: [
      {
        id: 'portfolio',
        Icon: BarChart3,
        title: 'Portfolio & Chit Plans',
        desc: 'Click to access',
        route: '/user/portfolio',
        color: '#2E7D32',
        bg: '#EBF3ED'
      },
      {
        id: 'group-card',
        Icon: Landmark,
        title: 'Member Chit Passbook Card',
        desc: 'Click to access',
        route: '/user/group-card',
        color: '#1B3322',
        bg: '#EBF3ED'
      },
      {
        id: 'join-group',
        Icon: Users,
        title: 'Join New Chit Scheme',
        desc: 'Click to access',
        route: '/user/join-group',
        color: '#2E7D32',
        bg: '#EBF3ED'
      },
      {
        id: 'auction',
        Icon: Gavel,
        title: 'Live Reverse Auctions',
        desc: 'Click to access',
        route: '/user/auction',
        color: '#A3704C',
        bg: '#FDF6F0'
      },
      {
        id: 'finance',
        Icon: Landmark,
        title: 'Financial Statements & Credit',
        desc: 'Click to access',
        route: '/user/finance',
        color: '#1B3322',
        bg: '#EBF3ED'
      },
      {
        id: 'chat',
        Icon: MessageSquare,
        title: 'Subscriber Messaging & Chat',
        desc: 'Click to access',
        route: '/user/chat',
        color: '#2E7D32',
        bg: '#EBF3ED'
      }
    ]
  },
  {
    id: 'account-profile',
    title: 'Subscriber Identity & Banking Vault',
    actions: [
      {
        id: 'account-details',
        Icon: User,
        title: 'Account Identity Profile',
        desc: 'Click to access',
        route: '/user/profile/account-details',
        color: '#1B3322',
        bg: '#EBF3ED'
      },
      {
        id: 'bank-account',
        Icon: Landmark,
        title: 'Linked Bank Account & UPI',
        desc: 'Click to access',
        route: '/user/profile/link-bank-account',
        color: '#2E7D32',
        bg: '#EBF3ED'
      },
      {
        id: 'kyc-verification',
        Icon: ShieldCheck,
        title: 'Identity Verification (KYC)',
        desc: 'Click to access',
        route: '/user/profile/identity-verification',
        color: '#2E7D32',
        bg: '#EBF3ED'
      },
      {
        id: 'nominee-details',
        Icon: Users,
        title: 'Nominee & Beneficiary Records',
        desc: 'Click to access',
        route: '/user/profile/nominee-details',
        color: '#A3704C',
        bg: '#FDF6F0'
      },
      {
        id: 'security-pin',
        Icon: Lock,
        title: 'Passcode & Screen Lock Security',
        desc: 'Click to access',
        route: '/user/profile/security-permission',
        color: '#D32F2F',
        bg: '#FDECEC'
      },
      {
        id: 'otp-requests',
        Icon: KeyRound,
        title: 'Authorization OTP Stream',
        desc: 'Click to access',
        route: '/user/profile/otp-requests',
        color: '#1B3322',
        bg: '#EBF3ED'
      }
    ]
  },
  {
    id: 'system-support',
    title: 'Regional Preferences, Maps & Support',
    actions: [
      {
        id: 'my-location',
        Icon: MapPin,
        title: 'GPS Geolocation Radar',
        desc: 'Click to access',
        route: '/user/profile/my-location',
        color: '#2E7D32',
        bg: '#EBF3ED'
      },
      {
        id: 'admin-location',
        Icon: Building2,
        title: 'HQ & Branch Coordinates',
        desc: 'Click to access',
        route: '/user/profile/admin-location',
        color: '#A3704C',
        bg: '#FDF6F0'
      },
      {
        id: 'language-settings',
        Icon: Languages,
        title: 'Language (தமிழ் / English)',
        desc: 'Click to access',
        route: '/user/profile/language-settings',
        color: '#2E7D32',
        bg: '#EBF3ED'
      },
      {
        id: 'privacy-policy',
        Icon: FileText,
        title: 'Chit Funds Act Directives',
        desc: 'Click to access',
        route: '/user/profile/privacy-policy',
        color: '#1B3322',
        bg: '#EBF3ED'
      },
      {
        id: 'help-support',
        Icon: HelpCircle,
        title: '24/7 Operations Help Desk',
        desc: 'Click to access',
        route: '/user/profile/help-support',
        color: '#2E7D32',
        bg: '#EBF3ED'
      },
      {
        id: 'full-profile',
        Icon: User,
        title: 'Full Subscriber Profile Hub',
        desc: 'Click to access',
        route: '/user/profile',
        color: '#1B3322',
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
          <p className="ut-topbar-sub">Comprehensive subscriber utilities, plans, statements, and security controls</p>
        </div>
        <div className="ut-topbar-search">
          <Search size={16} color="#6B7A6E" />
          <input
            type="text"
            placeholder="Search subscriber tools..."
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
