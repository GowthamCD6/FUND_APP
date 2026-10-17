import React, { useState, useEffect } from 'react';
import { X as RiCloseLine, Check as RiCheckLine, AlertCircle as RiAlertCircle } from 'lucide-react';

const AuctionW = ({ isOpen, onClose, initialData, onSave, isSaving = false, groupMembers = [], pastWinners = [] }) => {
  const [form, setForm] = useState({
    chitWinnerName: '',
    chitWinnerMemberId: '',
    amountTaken: '',
    datePicked: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          chitWinnerName: initialData.chitWinnerName || '',
          chitWinnerMemberId: initialData.chitWinnerMemberId || '',
          amountTaken: initialData.amountTaken?.toString() || '',
          datePicked: initialData.datePicked ? initialData.datePicked.split('T')[0] : '',
        });
      } else {
        setForm({
          chitWinnerName: '',
          chitWinnerMemberId: '',
          amountTaken: '',
          datePicked: new Date().toISOString().split('T')[0],
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const normalizeText = (value) => (value || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();

  const checkEligibility = (name, phone) => {
    const normName = normalizeText(name);
    const normPhone = normalizeText(phone);

    if (!normName && !normPhone) return { alreadyWon: false, reason: '' };

    // 1. Check in groupMembers
    if (groupMembers && groupMembers.length > 0) {
      const match = groupMembers.find(m => {
        const mName = normalizeText(m.name || m.user_name);
        const mPhone = normalizeText(m.phone || m.id);
        return (normName && mName && normName === mName) || (normPhone && mPhone && normPhone === mPhone);
      });

      if (match && (match.hasWonAuction || match.has_taken_auction_amount)) {
        const amtStr = match.amountTaken ? ` (₹${Number(match.amountTaken).toLocaleString('en-IN')})` : '';
        return {
          alreadyWon: true,
          reason: `STRICT RULE: ${match.name || name} has ALREADY taken an auction prize${amtStr} for this group and cannot win again.`
        };
      }
    }

    // 2. Check in pastWinners
    if (pastWinners && pastWinners.length > 0) {
      const pastMatch = pastWinners.find(w => {
        const pName = normalizeText(w.name || w.chitWinnerName || w.winner_name);
        const pPhone = normalizeText(w.memberId || w.chitWinnerMemberId || w.winner_member_phone || w.winner_user_id);
        return (normName && pName && normName === pName) || (normPhone && pPhone && normPhone === pPhone);
      });
      if (pastMatch) {
        return {
          alreadyWon: true,
          reason: `STRICT RULE: This member has already won an auction in a previous cycle for this group.`
        };
      }
    }

    return { alreadyWon: false, reason: '' };
  };

  const handleChange = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto fill phone if member name matches
      if (field === 'chitWinnerName' && groupMembers && groupMembers.length > 0) {
        const query = normalizeText(value);
        if (query) {
          const match = groupMembers.find(m => normalizeText(m.name).startsWith(query) || normalizeText(m.name) === query);
          if (match && match.phone) {
            updated.chitWinnerMemberId = String(match.phone).trim();
          }
        }
      }
      return updated;
    });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const eligibility = checkEligibility(form.chitWinnerName, form.chitWinnerMemberId);

  const validate = () => {
    const newErrors = {};
    if (!form.chitWinnerName.trim()) {
      newErrors.chitWinnerName = 'Winner name is required';
    }
    if (!form.chitWinnerMemberId.trim()) {
      newErrors.chitWinnerMemberId = 'Member Phone Number is required';
    } else if (!/^\d{10}$/.test(form.chitWinnerMemberId)) {
      newErrors.chitWinnerMemberId = 'Please enter a valid 10-digit phone number';
    }
    if (!form.amountTaken || parseFloat(form.amountTaken) <= 0) {
      newErrors.amountTaken = 'Please enter a valid amount taken';
    }
    if (!form.datePicked) {
      newErrors.datePicked = 'Auction date is required';
    }

    if (eligibility.alreadyWon) {
      newErrors.chitWinnerName = eligibility.reason;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate() && !isSaving && !eligibility.alreadyWon) {
      onSave(form);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="rn-modal-backdrop" onClick={!isSaving ? onClose : undefined}>
      <div className="rn-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <div className="mg2-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Chit Auction Winner</h3>
          <button className="rp-close" onClick={onClose} disabled={isSaving} style={{ border: 'none', background: 'transparent', cursor: isSaving ? 'not-allowed' : 'pointer' }}>
            <RiCloseLine size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {groupMembers && groupMembers.length > 0 && (
            <div className="mg2-input-group" style={{ marginBottom: 14 }}>
              <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Select From Enrolled Members (Quick Pick)
              </label>
              <select
                className="mg2-form-input"
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (!selectedId) return;
                  const match = groupMembers.find(m => String(m.userId || m.id) === String(selectedId));
                  if (match) {
                    setForm(prev => ({
                      ...prev,
                      chitWinnerName: match.name || match.user_name || '',
                      chitWinnerMemberId: match.phone ? String(match.phone).trim() : '',
                    }));
                  }
                }}
                disabled={isSaving}
                defaultValue=""
              >
                <option value="" disabled>-- Choose a group member --</option>
                {groupMembers.map(m => {
                  const mId = m.userId || m.id;
                  const hasTaken = Boolean(m.hasWonAuction || m.has_taken_auction_amount);
                  return (
                    <option key={mId} value={mId} disabled={hasTaken}>
                      {m.name || 'Unnamed'} ({m.phone || 'No phone'}) {hasTaken ? '⛔ [ALREADY WON]' : '✓ Eligible'}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="mg2-input-group" style={{ marginBottom: 14 }}>
            <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Winner Name *</label>
            <input
              type="text"
              className={`mg2-form-input ${errors.chitWinnerName ? 'input-error' : ''}`}
              value={form.chitWinnerName}
              onChange={e => handleChange('chitWinnerName', e.target.value)}
              placeholder="Enter winner's name"
              disabled={isSaving}
            />
            {errors.chitWinnerName && <p className="mg2-input-error-txt">{errors.chitWinnerName}</p>}
          </div>

          <div className="mg2-input-group" style={{ marginBottom: 14 }}>
            <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Member Phone Number *</label>
            <input
              type="text"
              className={`mg2-form-input ${errors.chitWinnerMemberId ? 'input-error' : ''}`}
              maxLength={10}
              value={form.chitWinnerMemberId}
              onChange={e => handleChange('chitWinnerMemberId', e.target.value)}
              placeholder="10-digit mobile number"
              disabled={isSaving}
            />
            {errors.chitWinnerMemberId && <p className="mg2-input-error-txt">{errors.chitWinnerMemberId}</p>}
          </div>

          {eligibility.alreadyWon && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #f87171',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <RiAlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ margin: '0 0 2px 0', fontSize: 12.5, fontWeight: 800, color: '#991b1b', letterSpacing: '0.4px' }}>
                  NOT ELIGIBLE TO WIN
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#b91c1c', lineHeight: 1.4 }}>
                  {eligibility.reason}
                </p>
              </div>
            </div>
          )}

          <div className="mg2-input-group" style={{ marginBottom: 14 }}>
            <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Amount Taken *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: '#64748b', fontSize: 14 }}>₹</span>
              <input
                type="number"
                className={`mg2-form-input ${errors.amountTaken ? 'input-error' : ''}`}
                style={{ paddingLeft: 26 }}
                value={form.amountTaken}
                onChange={e => handleChange('amountTaken', e.target.value)}
                placeholder="9300"
                disabled={isSaving}
              />
            </div>
            {errors.amountTaken && <p className="mg2-input-error-txt">{errors.amountTaken}</p>}
          </div>

          <div className="mg2-input-group" style={{ marginBottom: 20 }}>
            <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Auction Date *</label>
            <input
              type="date"
              className={`mg2-form-input ${errors.datePicked ? 'input-error' : ''}`}
              value={form.datePicked}
              onChange={e => handleChange('datePicked', e.target.value)}
              disabled={isSaving}
            />
            {errors.datePicked && <p className="mg2-input-error-txt">{errors.datePicked}</p>}
          </div>

          <div className="rn-form-row" style={{ marginTop: 20, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
            <button type="button" className="mg2-modal-cancel-btn" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button 
              type="submit" 
              className="mg2-modal-save-btn" 
              disabled={isSaving || eligibility.alreadyWon} 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 6,
                background: eligibility.alreadyWon ? '#94a3b8' : undefined,
                cursor: eligibility.alreadyWon ? 'not-allowed' : undefined
              }}
            >
              {isSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                  Saving...
                </>
              ) : (
                <>
                  <RiCheckLine size={16} /> Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuctionW;
