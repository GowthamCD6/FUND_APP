import React, { useState, useEffect } from 'react';
import { X as RiCloseLine, Check as RiCheckLine, CircleDollarSign as RiMoneyDollarCircleLine } from 'lucide-react';

const PaymentModal = ({ visible, onClose, initialPaymentData, onSave }) => {
  const [formData, setFormData] = useState({
    currentMonthAmount: '',
    elathThalupadi: '',
    commission: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible && initialPaymentData) {
      setFormData({
        currentMonthAmount: initialPaymentData.currentMonthAmount?.toString() || '',
        elathThalupadi: initialPaymentData.elathThalupadi?.toString() || '',
        commission: initialPaymentData.commission?.toString() || '',
      });
      setErrors({});
    }
  }, [visible, initialPaymentData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.currentMonthAmount || parseFloat(formData.currentMonthAmount) <= 0) {
      newErrors.currentMonthAmount = 'Please enter a valid monthly amount';
    }
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
          <h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Payment Details</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <RiCloseLine size={24} />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
            Amount to be Paid This Month *
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontWeight: 600 }}>₹</span>
            <input
              type="number"
              style={{ width: '100%', padding: '12px 16px 12px 36px', border: `1px solid ${errors.currentMonthAmount ? '#EF4444' : '#D1D5DB'}`, borderRadius: 'var(--radius)', fontSize: 15 }}
              value={formData.currentMonthAmount}
              onChange={e => handleInputChange('currentMonthAmount', e.target.value)}
              placeholder="10000"
            />
          </div>
          {errors.currentMonthAmount && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.currentMonthAmount}</p>}
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
              <RiMoneyDollarCircleLine size={16} color="#6B7280" /> எலத் தள்ளுபடி (Discount)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontWeight: 600 }}>₹</span>
              <input
                type="number"
                style={{ width: '100%', padding: '12px 16px 12px 36px', border: '1px solid #D1D5DB', borderRadius: 'var(--radius)', fontSize: 15 }}
                value={formData.elathThalupadi}
                onChange={e => handleInputChange('elathThalupadi', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
              % கசர் (Commission)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontWeight: 600 }}>₹</span>
              <input
                type="number"
                style={{ width: '100%', padding: '12px 16px 12px 36px', border: '1px solid #D1D5DB', borderRadius: 'var(--radius)', fontSize: 15 }}
                value={formData.commission}
                onChange={e => handleInputChange('commission', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
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

export default PaymentModal;
