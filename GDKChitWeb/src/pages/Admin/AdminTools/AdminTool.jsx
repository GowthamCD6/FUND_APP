import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Settings, UserPlus, UserCog, Zap, ChevronRight,
  Download, KeyRound, Gavel, MapPin, Key, Ban, Map,
  Search, ShieldCheck, Database, Layers, Sparkles
} from 'lucide-react';
import './AdminTool.css';

const TOOL_SECTIONS = [
  {
    id: 'user-ops',
    title: 'Subscriber & Membership Administration',
    actions: [
      {
        id: 'add-user',
        Icon: UserPlus,
        title: 'Add New Subscriber',
        desc: 'Click to access',
        route: '/admin/admintool/add-user',
        color: '#2E7D32',
        bg: '#EBF3ED'
      },
      {
        id: 'manage-users',
        Icon: UserCog,
        title: 'Manage Members Directory',
        desc: 'Click to access',
        route: '/admin/manage-users',
        color: '#1B3322',
        bg: '#EBF3ED'
      },
      {
        id: 'block-members',
        Icon: Ban,
        title: 'Access Control & Blocking',
        desc: 'Click to access',
        route: '/admin/block-user',
        color: '#D32F2F',
        bg: '#FDECEC'
      },
      {
        id: 'password-mgmt',
        Icon: Key,
        title: 'Password Management Vault',
        desc: 'Click to access',
        route: '/admin/password-management',
        color: '#A3704C',
        bg: '#FDF6F0'
      },
      {
        id: 'user-locations',
        Icon: Map,
        title: 'Member Geolocation Radar',
        desc: 'Click to access',
        route: '/admin/user-locations',
        color: '#A3704C',
        bg: '#FDF6F0'
      }
    ]
  },
  {
    id: 'chit-ops',
    title: 'Chit Scheme & Pool Operations',
    actions: [
      {
        id: 'create-group',
        Icon: Plus,
        title: 'Create New Chit Plan',
        desc: 'Click to access',
        route: '/admin/create-group',
        color: '#2E7D32',
        bg: '#EBF3ED'
      },
      {
        id: 'manage-groups',
        Icon: Layers,
        title: 'Manage Chit Groups',
        desc: 'Click to access',
        route: '/admin/manage-groups',
        color: '#1B3322',
        bg: '#EBF3ED'
      },
      {
        id: 'auction-settings',
        Icon: Gavel,
        title: 'Auction Engine Configuration',
        desc: 'Click to access',
        route: '/admin/admintool/auction-settings',
        color: '#A3704C',
        bg: '#FDF6F0'
      }
    ]
  },
  {
    id: 'system-ops',
    title: 'System Utilities & Security Audit',
    actions: [
      {
        id: 'data-export',
        Icon: Download,
        title: 'Corporate Data Export & Audit',
        desc: 'Click to access',
        route: '/admin/admintool/data-export',
        color: '#2E7D32',
        bg: '#EBF3ED'
      },
      {
        id: 'otp-requests',
        Icon: KeyRound,
        title: 'Subscriber Authorization OTPs',
        desc: 'Click to access',
        route: '/admin/admintool/otp-requests',
        color: '#1B3322',
        bg: '#EBF3ED'
      },
      {
        id: 'office-location',
        Icon: MapPin,
        title: 'Headquarters & Branch Coordinates',
        desc: 'Click to access',
        route: '/admin/admintool/office-location',
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
        section.title.toLowerCase().includes(q)
      );
    })
  })).filter(section => section.actions.length > 0);

  return (
    <div className="at-page">
      {/* Search Header Bar */}
      <div className="at-topbar">
        <div className="at-topbar-info">
          <h1 className="at-topbar-title">Admin Tools</h1>
          <p className="at-topbar-sub">Quick administrative actions, configuration, and utilities</p>
        </div>
        <div className="at-topbar-search">
          <Search size={16} color="#6B7A6E" />
          <input
            type="text"
            placeholder="Search tools..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="at-search-input"
          />
        </div>
      </div>

      {/* Grouped Sections */}
      <div className="at-sections-container">
        {filteredSections.map(sec => (
          <div key={sec.id} className="at-section">
            <h2 className="at-section-title">{sec.title}</h2>

            <div className="at-cards-grid">
              {sec.actions.map(tool => {
                const Icon = tool.Icon;
                return (
                  <div
                    key={tool.id}
                    className="at-item-card"
                    onClick={() => navigate(tool.route)}
                  >
                    <div className="at-item-icon-box" style={{ background: tool.bg, color: tool.color }}>
                      <Icon size={20} strokeWidth={2.2} />
                    </div>

                    <div className="at-item-text">
                      <h3 className="at-item-title">{tool.title}</h3>
                      <span className="at-item-sub">{tool.desc}</span>
                    </div>

                    <ChevronRight size={18} className="at-item-arrow" />
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