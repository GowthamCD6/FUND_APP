import React, { useState, useEffect } from 'react';
import { X as RiCloseLine, Check as RiCheckLine } from 'lucide-react';

const PaymentD = ({ isOpen, onClose, initialData, defaultAmount, onSave }) => {
  const [form, setForm] = useState({
    currentMonthAmount: '',
    elathThalupadi: '',
    commission: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        currentMonthAmount: initialData?.currentMonthAmount?.toString() || defaultAmount?.toString() || '',
        elathThalupadi: initialData?.elathThalupadi?.toString() || '0',
        commission: initialData?.commission?.toString() || '0',
      });
      setErrors({});
    }
  }, [isOpen, initialData, defaultAmount]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.currentMonthAmount || parseFloat(form.currentMonthAmount) <= 0) {
      newErrors.currentMonthAmount = 'Please enter a valid monthly amount';
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
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Payment Details</h3>
          <button className="rp-close" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <RiCloseLine size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mg2-input-group" style={{ marginBottom: 14 }}>
            <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Amount to be Paid This Month *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: '#64748b', fontSize: 14 }}>₹</span>
              <input
                type="number"
                className={`mg2-form-input ${errors.currentMonthAmount ? 'input-error' : ''}`}
                style={{ paddingLeft: 26 }}
                value={form.currentMonthAmount}
                onChange={e => handleChange('currentMonthAmount', e.target.value)}
                placeholder="10000"
              />
            </div>
            {errors.currentMonthAmount && <p className="mg2-input-error-txt">{errors.currentMonthAmount}</p>}
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div className="mg2-input-group" style={{ flex: 1 }}>
              <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                எலத் தள்ளுபடி (Discount)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: '#64748b', fontSize: 14 }}>₹</span>
                <input
                  type="number"
                  className="mg2-form-input"
                  style={{ paddingLeft: 26 }}
                  value={form.elathThalupadi}
                  onChange={e => handleChange('elathThalupadi', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="mg2-input-group" style={{ flex: 1 }}>
              <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                கசர் (Commission)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: '#64748b', fontSize: 14 }}>₹</span>
                <input
                  type="number"
                  className="mg2-form-input"
                  style={{ paddingLeft: 26 }}
                  value={form.commission}
                  onChange={e => handleChange('commission', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
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

export default PaymentD;
