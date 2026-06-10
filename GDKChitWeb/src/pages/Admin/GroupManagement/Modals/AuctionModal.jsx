import React, { useState, useEffect } from 'react';
import { X as RiCloseLine, Check as RiCheckLine, Calendar as RiCalendarLine } from 'lucide-react';

const AuctionModal = ({ visible, onClose, initialWinnerData, onSave }) => {
  const [formData, setFormData] = useState({
    chitWinnerName: '',
    chitWinnerMemberId: '',
    amountTaken: '',
    datePicked: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible && initialWinnerData) {
      setFormData({
        chitWinnerName: initialWinnerData.chitWinnerName || '',
        chitWinnerMemberId: initialWinnerData.chitWinnerMemberId || '',
        amountTaken: initialWinnerData.amountTaken?.toString() || '',
        datePicked: initialWinnerData.datePicked || '',
      });
      setErrors({});
    }
  }, [visible, initialWinnerData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.chitWinnerName?.trim()) newErrors.chitWinnerName = 'Winner name is required';
    if (!formData.chitWinnerMemberId?.trim()) newErrors.chitWinnerMemberId = 'Member Phone number is required';
    else if (!/^\d{10}$/.test(formData.chitWinnerMemberId)) newErrors.chitWinnerMemberId = 'Must be a 10-digit number';
    
    if (!formData.amountTaken || parseFloat(formData.amountTaken) <= 0) newErrors.amountTaken = 'Enter a valid amount';
    if (!formData.datePicked?.trim()) newErrors.datePicked = 'Auction date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  if (!visible) return null;

  return (
    <div className="mg-modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="mg-modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Chit Auction Winner</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <RiCloseLine size={24} />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Winner Name</label>
          <input
            type="text"
            style={{ width: '100%', padding: '12px 16px', border: `1px solid ${errors.chitWinnerName ? '#EF4444' : '#D1D5DB'}`, borderRadius: 'var(--radius)', fontSize: 15 }}
            value={formData.chitWinnerName}
            onChange={e => handleInputChange('chitWinnerName', e.target.value)}
            placeholder="Enter winner's name"
          />
          {errors.chitWinnerName && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.chitWinnerName}</p>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Member Phone Number</label>
          <input
            type="tel"
            maxLength={10}
            style={{ width: '100%', padding: '12px 16px', border: `1px solid ${errors.chitWinnerMemberId ? '#EF4444' : '#D1D5DB'}`, borderRadius: 'var(--radius)', fontSize: 15 }}
            value={formData.chitWinnerMemberId}
            onChange={e => handleInputChange('chitWinnerMemberId', e.target.value)}
            placeholder="10-digit mobile number"
          />
          {errors.chitWinnerMemberId && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.chitWinnerMemberId}</p>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Amount Taken</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontWeight: 600 }}>₹</span>
            <input
              type="number"
              style={{ width: '100%', padding: '12px 16px 12px 36px', border: `1px solid ${errors.amountTaken ? '#EF4444' : '#D1D5DB'}`, borderRadius: 'var(--radius)', fontSize: 15 }}
              value={formData.amountTaken}
              onChange={e => handleInputChange('amountTaken', e.target.value)}
              placeholder="9300"
            />
          </div>
          {errors.amountTaken && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.amountTaken}</p>}
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Auction Date</label>
          <div style={{ position: 'relative' }}>
            <input
              type="date"
              style={{ width: '100%', padding: '12px 16px', border: `1px solid ${errors.datePicked ? '#EF4444' : '#D1D5DB'}`, borderRadius: 'var(--radius)', fontSize: 15, background: '#fff' }}
              value={formData.datePicked}
              onChange={e => handleInputChange('datePicked', e.target.value)}
            />
          </div>
          {errors.datePicked && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.datePicked}</p>}
        </div>

        <div style={{ display: 'flex', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button 
            style={{ flex: 1, padding: '12px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            style={{ flex: 2, padding: '12px', background: '#6B46C1', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onClick={handleSave}
          >
            <RiCheckLine size={18} /> Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuctionModal;
