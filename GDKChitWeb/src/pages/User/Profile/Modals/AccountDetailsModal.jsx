import React, { useState, useEffect } from 'react';
import { makeRequest } from '../../../../api/apiClient.js';
import { User, X, Check, Loader2, AlertCircle, Calendar, MapPin } from 'lucide-react';
import './ProfileModals.css';

const TAMIL_NADU_CITIES = [
  'Tiruppur', 'Coimbatore', 'Chennai', 'Madurai', 'Salem', 'Erode',
  'Tiruchirappalli', 'Dindigul', 'Karur', 'Namakkal', 'Pollachi',
  'Tirunelveli', 'Thanjavur', 'Vellore', 'Other'
];

const SOUTH_STATES = [
  'Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'
];

const AccountDetailsModal = ({ isOpen, onClose, onUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    streetAddress: '',
    city: 'Tiruppur',
    state: 'Tamil Nadu'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const fetchProfile = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await makeRequest('/auth/profile');
        const data = await res.json();
        if (data.success && data.data) {
          const u = data.data.user || data.data;
          const p = data.data.profile || {};
          setFormData({
            name: p.name || u.name || u.username || '',
            email: p.email || u.email || '',
            phone: u.phone || '',
            dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
            streetAddress: p.streetAddress || '',
            city: p.city || 'Tiruppur',
            state: p.state || 'Tamil Nadu'
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Full name is required');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await makeRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          dateOfBirth: formData.dateOfBirth,
          streetAddress: formData.streetAddress.trim(),
          city: formData.city,
          state: formData.state
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Account details saved successfully!');
        if (onUpdated) onUpdated();
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
      } else {
        setErrorMsg(data.message || 'Failed to update account details.');
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
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
            <div className="pm-title-icon" style={{ background: '#eff6ff', color: '#1e40af' }}>
              <User size={18} />
            </div>
            <h3 className="pm-title">Account Details</h3>
          </div>
          <button className="pm-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#64748b' }}>
            <Loader2 size={32} color="#1e40af" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Loading account profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div className="pm-body">
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

              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label className="pm-label">Full Name *</label>
                  <input
                    type="text"
                    className="pm-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="pm-form-group">
                  <label className="pm-label">Registered Phone</label>
                  <input
                    type="text"
                    className="pm-input"
                    value={formData.phone}
                    disabled
                  />
                </div>
              </div>

              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label className="pm-label">Email Address</label>
                  <input
                    type="email"
                    className="pm-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                  />
                </div>
                <div className="pm-form-group">
                  <label className="pm-label">Date of Birth</label>
                  <input
                    type="date"
                    className="pm-input"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                </div>
              </div>

              <div className="pm-form-group">
                <label className="pm-label">Residential Street Address</label>
                <input
                  type="text"
                  className="pm-input"
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  placeholder="Door No, Street Name, Area"
                />
              </div>

              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label className="pm-label">City / District</label>
                  <select
                    className="pm-input"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  >
                    {TAMIL_NADU_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="pm-form-group">
                  <label className="pm-label">State</label>
                  <select
                    className="pm-input"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  >
                    {SOUTH_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
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
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AccountDetailsModal;
