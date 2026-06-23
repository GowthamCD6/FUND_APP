import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft as RiArrowLeftLine, Landmark as RiBankLine, Plus as RiAddLine, CheckCircle2 as RiCheckLine } from 'lucide-react';
import './ProfilePages.css';

const LinkBankAccount = () => {
  const navigate = useNavigate();
  const [banks] = useState([
    { id: 1, name: 'State Bank of India', accountNo: 'XXXX XXXX 4567', ifsc: 'SBIN0001234', isPrimary: true },
  ]);

  return (
    <div className="prof-subpage">
      <div className="prof-sub-header">
        <button className="prof-back-btn" onClick={() => navigate('/user/profile')}>
          <RiArrowLeftLine size={24} />
        </button>
        <h2>Linked Bank Account</h2>
      </div>

      <div className="prof-card">
        <h3 className="prof-card-title"><RiBankLine size={20} color="#2842C4"/> Your Accounts</h3>
        {banks.length > 0 ? banks.map(b => (
          <div key={b.id} style={{ border: '1px solid #e2e8f0', padding: 16, borderRadius: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ fontSize: 16, color: '#0f172a' }}>{b.name}</strong>
              {b.isPrimary && <span className="prof-badge success"><RiCheckLine size={12}/> Primary</span>}
            </div>
            <div className="prof-detail-row" style={{ padding: '8px 0', border: 'none' }}>
              <span className="prof-detail-label">Account Number</span>
              <span className="prof-detail-val">{b.accountNo}</span>
            </div>
            <div className="prof-detail-row" style={{ padding: '8px 0', border: 'none' }}>
              <span className="prof-detail-label">IFSC Code</span>
              <span className="prof-detail-val">{b.ifsc}</span>
            </div>
          </div>
        )) : (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No bank accounts linked yet.</p>
        )}
      </div>

      <button className="prof-btn-primary">
        <RiAddLine size={18} /> Add New Bank Account
      </button>
    </div>
  );
};

export default LinkBankAccount;
