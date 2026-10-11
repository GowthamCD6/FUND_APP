import React from 'react';
import {
  HelpCircle,
  X,
  Phone,
  MessageSquare,
  Mail,
  Clock,
  ShieldCheck,
  Server
} from 'lucide-react';
import './AdminModals.css';

const AdminHelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal-card" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div className="adm-modal-title-group">
            <div className="adm-modal-icon-badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 className="adm-modal-title">Admin Support & Operations Desk</h2>
              <p className="adm-modal-subtitle">Dedicated technical assistance and server hotline</p>
            </div>
          </div>
          <button className="adm-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="adm-modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginBottom: 16 }}>
            <a
              href="tel:+914433445566"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={18} />
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Administrator Direct Line</span>
                <strong style={{ fontSize: 13, color: '#1e293b' }}>+91 44 3344 5566</strong>
              </div>
            </a>

            <a
              href="https://wa.me/919876543210?text=Hello%20GDK%20Admin%20Support"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 8,
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={18} />
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#15803d', display: 'block' }}>Priority WhatsApp Ops</span>
                <strong style={{ fontSize: 13, color: '#166534' }}>+91 98765 43210</strong>
              </div>
            </a>

            <a
              href="mailto:admin@gdkchitfunds.com"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={18} />
              </div>
              <div>
                <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Technical Escalation Email</span>
                <strong style={{ fontSize: 13, color: '#1e293b' }}>tech-ops@gdkchitfunds.com</strong>
              </div>
            </a>
          </div>

          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 12,
            color: '#64748b'
          }}>
            <Server size={18} color="#059669" />
            <div>
              <strong style={{ color: '#1e293b', display: 'block' }}>Server Uptime & Database Status</strong>
              <span>MySQL 8.0 & Node.js backend operational with zero latency.</span>
            </div>
          </div>
        </div>

        <div className="adm-modal-footer">
          <button className="adm-btn-secondary" onClick={onClose} style={{ width: '100%' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminHelpModal;
