import React, { useState, useEffect } from 'react';
import { X as RiCloseLine, Check as RiCheckLine } from 'lucide-react';

const AuctionW = ({ isOpen, onClose, initialData, onSave }) => {
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

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave(form);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="rn-modal-backdrop" onClick={onClose}>
      <div className="rn-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <div className="mg2-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Chit Auction Winner</h3>
          <button className="rp-close" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <RiCloseLine size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mg2-input-group" style={{ marginBottom: 14 }}>
            <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Winner Name *</label>
            <input
              type="text"
              className={`mg2-form-input ${errors.chitWinnerName ? 'input-error' : ''}`}
              value={form.chitWinnerName}
              onChange={e => handleChange('chitWinnerName', e.target.value)}
              placeholder="Enter winner's name"
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
            />
            {errors.chitWinnerMemberId && <p className="mg2-input-error-txt">{errors.chitWinnerMemberId}</p>}
          </div>

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
            />
            {errors.datePicked && <p className="mg2-input-error-txt">{errors.datePicked}</p>}
          </div>

          <div className="rn-form-row" style={{ marginTop: 20, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
            <button type="button" className="mg2-modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="mg2-modal-save-btn">
              <RiCheckLine size={16} /> Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuctionW;
