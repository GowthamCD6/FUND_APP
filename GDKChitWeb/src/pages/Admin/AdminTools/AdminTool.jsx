import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Settings, UserPlus, UserCog, Zap, ArrowRight,
  Download, KeyRound, Gavel, MapPin, Key, Ban, Map,
  Search, ShieldCheck, Database, Layers, Sparkles
} from 'lucide-react';
import './AdminTool.css';

const TOOL_SECTIONS = [
  {
    id: 'user-ops',
    title: 'Subscriber & Membership Administration',
    subtitle: 'Manage subscriber accounts, onboarding, access security, and directory',
    actions: [
      {
        id: 'add-user',
        Icon: UserPlus,
        title: 'Add New Subscriber',
        desc: 'Onboard a new chit fund subscriber or register administrative staff',
        route: '/admin/admintool/add-user',
        badge: 'Onboarding',
        color: '#2E7D32',
        bg: '#EBF3ED'
      },
      {
        id: 'manage-users',
        Icon: UserCog,
        title: 'Manage Members Directory',
        desc: 'Full directory of members with role modification, edits, and removal',
        route: '/admin/manage-users',
        badge: 'Directory',
        color: '#1B3322',
        bg: '#EBF3ED'
      },
      {
        id: 'block-members',
        Icon: Ban,
        title: 'Access Control & Blocking',
        desc: 'Restrict system access or reinstate accounts with reason logs',
        route: '/admin/block-user',
        badge: 'Security',
        color: '#D32F2F',
        bg: '#FDECEC'
      },
      {
        id: 'password-mgmt',
        Icon: Key,
        title: 'Password Management Vault',
        desc: 'Secure cryptographic password verification and administrative credential resets',
        route: '/admin/password-management',
        badge: 'Vault',
        color: '#A3704C',
        bg: '#FDF6F0'
      },
      {
        id: 'user-locations',
        Icon: Map,
        title: 'Member Geolocation Radar',
        desc: 'Geographic tracking of registered subscriber locations across regions',
        route: '/admin/user-locations',
        badge: 'Radar',
        color: '#A3704C',
        bg: '#FDF6F0'
      }
    ]
  },
  {
    id: 'chit-ops',
    title: 'Chit Scheme & Pool Operations',
    subtitle: 'Configure chit schemes, manage cycles, and adjust reverse auction engine parameters',
    actions: [
      {
        id: 'create-group',
        Icon: Plus,
        title: 'Create New Chit Plan',
        desc: 'Set up a new monthly chit scheme with preset or custom financial plans',
        route: '/admin/create-group',
        badge: 'Scheme',
        color: '#2E7D32',
        bg: '#EBF3ED'
      },
      {
        id: 'manage-groups',
        Icon: Layers,
        title: 'Manage Chit Groups',
        desc: 'Track completed cycles, payment snapshots, and group member rosters',
        route: '/admin/manage-groups',
        badge: 'Ledger',
        color: '#1B3322',
        bg: '#EBF3ED'
      },
      {
        id: 'auction-settings',
        Icon: Gavel,
        title: 'Auction Engine Configuration',
        desc: 'Configure reverse auction duration, anti-sniping rules, and foreman commission rate',
        route: '/admin/admintool/auction-settings',
        badge: 'Engine',
        color: '#A3704C',
        bg: '#FDF6F0'
      }
    ]
  },
  {
    id: 'system-ops',
    title: 'System Utilities & Security Audit',
    subtitle: 'Extract data exports, monitor 2FA verification streams, and configure HQ coordinates',
    actions: [
      {
        id: 'data-export',
        Icon: Download,
        title: 'Corporate Data Export & Audit',
        desc: 'Download subscriber directories and chit ledger schemes in CSV or JSON format',
        route: '/admin/admintool/data-export',
        badge: 'Export',
        color: '#2E7D32',
        bg: '#EBF3ED'
      },
      {
        id: 'otp-requests',
        Icon: KeyRound,
        title: 'Subscriber Authorization OTPs',
        desc: 'Live real-time monitor for two-factor authentication codes and withdrawal OTPs',
        route: '/admin/admintool/otp-requests',
        badge: '2FA Audit',
        color: '#1B3322',
        bg: '#EBF3ED'
      },
      {
        id: 'office-location',
        Icon: MapPin,
        title: 'Headquarters & Branch Coordinates',
        desc: 'Set verified office GPS coordinates for mobile distance and verification radius',
        route: '/admin/admintool/office-location',
        badge: 'Office GPS',
        color: '#A3704C',
        bg: '#FDF6F0'
      }
    ]
  }
];

const AdminTool = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredSections = TOOL_SECTIONS.map(section => ({
    ...section,
    actions: section.actions.filter(item => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q)
      );
    })
  })).filter(section => section.actions.length > 0);

  return (
    <div className="at-page">
      {/* ── BANNER HEADER ── */}
      <div className="at-banner">
        <div className="at-banner-left">
          <div className="at-banner-badge">
            <Zap size={14} />
            <span>CENTRAL ADMINISTRATIVE WORKBENCH</span>
          </div>
          <h1 className="at-banner-title">Administrative Operations & System Tools</h1>
          <p className="at-banner-desc">
            Complete management suite for chit fund operations, subscriber onboarding, security access control, and auditing utilities.
          </p>
        </div>

        <div className="at-banner-search">
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search functional tools..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="at-search-input"
          />
        </div>
      </div>

      {/* ── SECTIONS ── */}
      <div className="at-sections-container">
        {filteredSections.map(sec => (
          <div key={sec.id} className="at-section">
            <div className="at-section-header">
              <div>
                <h2 className="at-section-title">{sec.title}</h2>
                <p className="at-section-desc">{sec.subtitle}</p>
              </div>
              <span className="at-section-count">{sec.actions.length} tools</span>
            </div>

            <div className="at-grid">
              {sec.actions.map(tool => {
                const Icon = tool.Icon;
                return (
                  <div
                    key={tool.id}
                    className="at-card"
                    onClick={() => navigate(tool.route)}
                  >
                    <div className="at-card-top">
                      <div className="at-icon-wrap" style={{ background: tool.bg, color: tool.color }}>
                        <Icon size={22} />
                      </div>
                      <span className="at-tool-badge" style={{ color: tool.color, background: tool.bg }}>
                        {tool.badge}
                      </span>
                    </div>

                    <div className="at-card-content">
                      <h3 className="at-card-title">{tool.title}</h3>
                      <p className="at-card-desc">{tool.desc}</p>
                    </div>

                    <div className="at-card-footer">
                      <span className="at-open-link">Open Tool</span>
                      <ArrowRight size={15} className="at-arrow-icon" />
                    </div>
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

export default AdminTool;