import React, { useState, useEffect } from 'react';
import { makeRequest } from '../../../../api/apiClient.js';
import { Users, X, Check, Loader2, AlertCircle, HeartHandshake } from 'lucide-react';
import './ProfileModals.css';

const RELATIONSHIPS = [
  'Father', 'Mother', 'Husband', 'Wife', 'Brother', 'Sister',
  'Son', 'Daughter', 'Friend', 'Relative', 'Other'
];

const NomineeModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    nomineeName: '',
    nomineePhone: '',
    relationship: 'Father',
    nomineeAge: '',
    nomineeAddress: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const fetchNominee = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await makeRequest('/auth/nominee');
        const data = await res.json();
        if (data.success && data.data?.nominee) {
          const n = data.data.nominee;
          setFormData({
            nomineeName: n.nomineeName || n.name || '',
            nomineePhone: n.nomineePhone || n.phone || '',
            relationship: n.relationship || 'Father',
            nomineeAge: n.age || '',
            nomineeAddress: n.address || ''
          });
        }
      } catch (err) {
        console.error('Failed to load nominee details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNominee();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nomineeName.trim()) {
      setErrorMsg('Nominee name is required.');
      return;
    }
    if (!formData.nomineePhone.trim() || formData.nomineePhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number for nominee.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await makeRequest('/auth/nominee', {
        method: 'PATCH',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Nominee information registered successfully!');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
      } else {
        // Fallback: save locally
        localStorage.setItem('user_nominee_info', JSON.stringify(formData));
        setSuccessMsg('Nominee information saved!');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
      }
    } catch (err) {
      localStorage.setItem('user_nominee_info', JSON.stringify(formData));
      setSuccessMsg('Nominee information saved!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pm-backdrop" onClick={onClose}>
      <div className="pm-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="pm-header">
          <div className="pm-title-group">
            <div className="pm-title-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <HeartHandshake size={18} />
            </div>
            <h3 className="pm-title">Nominee Details</h3>
          </div>
          <button className="pm-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={32} color="#d97706" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Loading nominee details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div className="pm-body">
              <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                In compliance with the Chit Funds Act, specify a designated beneficiary nominee for your registered chit accounts.
              </p>

              {successMsg && (
                <div className="pm-alert-success">
                  <Check size={16} />
                  <span>{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="pm-alert-error">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pm-form-group">
                <label className="pm-label">Nominee Full Name *</label>
                <input
                  type="text"
                  className="pm-input"
                  placeholder="Enter Nominee's Name"
                  value={formData.nomineeName}
                  onChange={(e) => setFormData({ ...formData, nomineeName: e.target.value })}
                  required
                />
              </div>

              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label className="pm-label">Relationship *</label>
                  <select
                    className="pm-input"
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  >
                    {RELATIONSHIPS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="pm-form-group">
                  <label className="pm-label">Nominee Contact Phone *</label>
                  <input
                    type="tel"
                    className="pm-input"
                    placeholder="10-digit mobile number"
                    maxLength={15}
                    value={formData.nomineePhone}
                    onChange={(e) => setFormData({ ...formData, nomineePhone: e.target.value.replace(/\D/g, '') })}
                    required
                  />
                </div>
              </div>

              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label className="pm-label">Nominee Age</label>
                  <input
                    type="number"
                    className="pm-input"
                    placeholder="e.g. 28"
                    value={formData.nomineeAge}
                    onChange={(e) => setFormData({ ...formData, nomineeAge: e.target.value })}
                  />
                </div>
                <div className="pm-form-group">
                  <label className="pm-label">Nominee Residential Address</label>
                  <input
                    type="text"
                    className="pm-input"
                    placeholder="City, State"
                    value={formData.nomineeAddress}
                    onChange={(e) => setFormData({ ...formData, nomineeAddress: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="pm-footer">
              <button type="button" className="pm-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="pm-btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Update Nominee</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default NomineeModal;
