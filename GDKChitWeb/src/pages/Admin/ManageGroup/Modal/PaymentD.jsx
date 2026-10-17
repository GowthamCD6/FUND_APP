import React, { useState, useEffect } from 'react';
import { X as RiCloseLine, Check as RiCheckLine, Calendar as RiCalendarLine, AlertCircle as RiAlertCircle } from 'lucide-react';

const PaymentD = ({ isOpen, onClose, initialData, defaultAmount, onSave, isSaving = false }) => {
  const [form, setForm] = useState({
    currentMonthAmount: '',
    elathThalupadi: '',
    commission: '',
    deadlineDate: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        currentMonthAmount: initialData?.currentMonthAmount?.toString() || defaultAmount?.toString() || '',
        elathThalupadi: initialData?.elathThalupadi?.toString() || '0',
        commission: initialData?.commission?.toString() || '0',
        deadlineDate: initialData?.deadlineDate ? initialData.deadlineDate.split('T')[0] : '',
        notes: initialData?.notes || '',
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

  const monthlyVal = parseFloat(form.currentMonthAmount || '0');
  const discountVal = parseFloat(form.elathThalupadi || '0');
  const commissionVal = parseFloat(form.commission || '0');
  const netCollection = monthlyVal + commissionVal - discountVal;

  const validate = () => {
    const newErrors = {};
    if (!form.currentMonthAmount || monthlyVal <= 0) {
      newErrors.currentMonthAmount = 'Please enter a valid monthly amount';
    }

    if (discountVal + commissionVal > monthlyVal && monthlyVal > 0) {
      newErrors.elathThalupadi = 'Discount + Commission cannot exceed Monthly Amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate() && !isSaving) {
      onSave({
        ...form,
        currentMonthAmount: monthlyVal,
        elathThalupadi: discountVal,
        commission: commissionVal,
        deadlineDate: form.deadlineDate || null,
        notes: form.notes || '',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="rn-modal-backdrop" onClick={!isSaving ? onClose : undefined}>
      <div className="rn-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="mg2-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Payment Configuration</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>Configure monthly amount, discounts & due date</p>
          </div>
          <button className="rp-close" onClick={onClose} disabled={isSaving} style={{ border: 'none', background: 'transparent', cursor: isSaving ? 'not-allowed' : 'pointer' }}>
            <RiCloseLine size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Amount to be Paid */}
          <div className="mg2-input-group" style={{ marginBottom: 14 }}>
            <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Amount to be Paid This Month *
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: '#64748b', fontSize: 14 }}>₹</span>
              <input
                type="number"
                className={`mg2-form-input ${errors.currentMonthAmount ? 'input-error' : ''}`}
                style={{ paddingLeft: 26 }}
                value={form.currentMonthAmount}
                onChange={e => handleChange('currentMonthAmount', e.target.value)}
                placeholder="10000"
                disabled={isSaving}
              />
            </div>
            {errors.currentMonthAmount && <p className="mg2-input-error-txt" style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.currentMonthAmount}</p>}
          </div>

          {/* Discount & Commission */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div className="mg2-input-group" style={{ flex: 1 }}>
              <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                எலத் தள்ளுபடி (Discount)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: '#dc2626', fontSize: 14 }}>-₹</span>
                <input
                  type="number"
                  className="mg2-form-input"
                  style={{ paddingLeft: 30 }}
                  value={form.elathThalupadi}
                  onChange={e => handleChange('elathThalupadi', e.target.value)}
                  placeholder="0"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="mg2-input-group" style={{ flex: 1 }}>
              <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                கசர் (Commission)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: '#10b981', fontSize: 14 }}>+₹</span>
                <input
                  type="number"
                  className="mg2-form-input"
                  style={{ paddingLeft: 30 }}
                  value={form.commission}
                  onChange={e => handleChange('commission', e.target.value)}
                  placeholder="0"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
          {errors.elathThalupadi && (
            <p className="mg2-input-error-txt" style={{ color: '#dc2626', fontSize: 12, marginTop: -6, marginBottom: 10 }}>
              {errors.elathThalupadi}
            </p>
          )}

          {/* Net Calculation Summary */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block' }}>Net Member Payment:</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>₹{monthlyVal || 0} + ₹{commissionVal || 0} - ₹{discountVal || 0}</span>
            </div>
            <strong style={{ fontSize: 18, color: '#10b981', fontWeight: 800 }}>
              ₹{netCollection >= 0 ? netCollection.toLocaleString('en-IN') : '0'}
            </strong>
          </div>

          {/* Payment Due Date / Deadline */}
          <div className="mg2-input-group" style={{ marginBottom: 14 }}>
            <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Last Date for Payment (Due Date)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                className="mg2-form-input"
                value={form.deadlineDate}
                onChange={e => handleChange('deadlineDate', e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mg2-input-group" style={{ marginBottom: 16 }}>
            <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Notes / Instructions for Members
            </label>
            <textarea
              className="mg2-form-input"
              style={{ minHeight: 65, resize: 'vertical' }}
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
              placeholder="e.g. Please pay by the 10th to avoid late fees"
              disabled={isSaving}
            />
          </div>

          {/* Actions */}
          <div className="rn-form-row" style={{ marginTop: 18, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
            <button type="button" className="mg2-modal-cancel-btn" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button type="submit" className="mg2-modal-save-btn" disabled={isSaving} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {isSaving ? (
                <>
                  <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                  Saving...
                </>
              ) : (
                <>
                  <RiCheckLine size={16} /> Save Payment Config
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentD;
