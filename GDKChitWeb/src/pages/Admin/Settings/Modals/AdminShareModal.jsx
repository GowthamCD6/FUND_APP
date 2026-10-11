import React, { useState } from 'react';
import {
  Share2,
  X,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import './AdminModals.css';

const AdminShareModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = window.location.origin;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal-card" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div className="adm-modal-title-group">
            <div className="adm-modal-icon-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="adm-modal-title">Share GDK Chit Portal</h2>
              <p className="adm-modal-subtitle">Invite members & agents to the web application</p>
            </div>
          </div>
          <button className="adm-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="adm-modal-body">
          <p style={{ margin: '0 0 14px', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
            Copy the official portal URL to share with subscribers, field collection agents, and branch managers.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 8
          }}>
            <input
              type="text"
              readOnly
              value={shareUrl}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: 13,
                color: '#1e293b',
                outline: 'none',
                fontFamily: 'monospace'
              }}
            />
            <button
              onClick={handleCopy}
              className="adm-btn-primary"
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
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

export default AdminShareModal;
