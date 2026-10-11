import React, { useState } from 'react';
import {
  FileText,
  X,
  Search,
  Gavel,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import './AdminModals.css';

const RULES = [
  { num: 1, title: 'New Member Policy', desc: 'New joining members will receive the chit amount at the end of the chit cycle after completion of baseline cycle.' },
  { num: 2, title: 'Auction Attendance & Proxy', desc: 'All members must participate in or designate authorized electronic proxy for monthly auction proceedings.' },
  { num: 3, title: 'Installment Schedules', desc: 'Monthly installments are payable prior to auction date without default to qualify for dividend distribution.' },
  { num: 4, title: 'Bidding Mechanism', desc: 'The eligible subscriber submitting the lowest bid within statutory discount cap wins that month\'s prize pool.' },
  { num: 5, title: 'Guarantor Mandate', desc: 'Winning subscribers must submit verified surety and guarantor documentation prior to fund disbursement.' },
  { num: 6, title: 'Statutory Documentation', desc: 'Mandatory Aadhaar KYC, PAN card, and verified active bank accounts required for all registered participants.' },
  { num: 7, title: 'Late Payment Penalties', desc: 'Delayed payments incur agreed statutory interest penalties and loss of dividend shares for delinquent months.' },
  { num: 8, title: 'Chit Group Completion', desc: 'A group cleanly concludes when all monthly cycles are executed and 100% of subscribers have prized.' },
  { num: 9, title: 'Financial Confidentiality', desc: 'All bid registers, member personal information, and ledger records remain strictly confidential.' },
  { num: 10, title: 'Emergency Management', desc: 'In verified emergencies, admin management possesses statutory discretion for structured payment plans.' },
  { num: 11, title: 'Dispute Arbitration', desc: 'Disputes are resolved under the Tamil Nadu Chit Funds Act registrar arbitration mechanism.' },
  { num: 12, title: 'Regulatory Compliance', desc: '100% adherence to Central Chit Funds Act 1982 and state registration guidelines.' },
];

const AdminRulesModal = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = RULES.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal-card" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div className="adm-modal-title-group">
            <div className="adm-modal-icon-badge" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <FileText size={20} />
            </div>
            <div>
              <h2 className="adm-modal-title">Chit Fund Compliance Rules</h2>
              <p className="adm-modal-subtitle">Certified Central Chit Funds Act 1982 operational directives</p>
            </div>
          </div>
          <button className="adm-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="adm-modal-body">
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search compliance directives..."
              className="adm-form-input"
              style={{ paddingLeft: 32, height: 36, fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(r => (
              <div
                key={r.num}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc'
                }}
              >
                <div style={{
                  minWidth: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#7c3aed',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {r.num}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                    {r.title}
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                    {r.desc}
                  </p>
                </div>
              </div>
            ))}
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

export default AdminRulesModal;
