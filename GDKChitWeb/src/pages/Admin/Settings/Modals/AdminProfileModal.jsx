import React, { useState, useEffect } from 'react';
import { makeRequest, safeJson } from '../../../../api/apiClient.js';
import {
  User,
  X,
  Check,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Home
} from 'lucide-react';
import './AdminModals.css';

const SOUTH_INDIAN_STATES = [
  'Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'
];

const TAMIL_NADU_CITIES = [
  'Tiruppur', 'Coimbatore', 'Chennai', 'Madurai', 'Salem', 'Erode',
  'Tiruchirappalli', 'Dindigul', 'Karur', 'Namakkal', 'Pollachi',
  'Tirunelveli', 'Thanjavur', 'Vellore', 'Hosur', 'Other'
];

const AdminProfileModal = ({ isOpen, onClose, onUpdated }) => {
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
    fetchProfile();
  }, [isOpen]);

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await makeRequest('/auth/profile');
      const data = await safeJson(res);
      if (data.success && data.data) {
        const u = data.data.user || {};
        const p = data.data.profile || {};
        setFormData({
          name: p.name || u.name || u.username || '',
          email: p.email || u.email || '',
          phone: u.phone || '',
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
          streetAddress: p.streetAddress || '',
          city: p.city || 'Tiruppur',
          state: p.state || 'Tamil Nadu'
        });
      }
    } catch (err) {
      setErrorMsg('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Name is required.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await makeRequest('/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await safeJson(res);
      if (data.success) {
        setSuccessMsg('Admin profile updated successfully!');
        if (onUpdated) onUpdated();
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMsg('Network error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal-card" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div className="adm-modal-title-group">
            <div className="adm-modal-icon-badge" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <User size={20} />
            </div>
            <div>
              <h2 className="adm-modal-title">Edit Admin Profile</h2>
              <p className="adm-modal-subtitle">Update administrator credentials, phone, and headquarters details</p>
            </div>
          </div>
          <button className="adm-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="adm-modal-body">
            {errorMsg && (
              <div className="adm-alert adm-alert-error">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="adm-alert adm-alert-success">
                <Check size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
                <Loader2 size={24} className="adm-spinner" style={{ margin: '0 auto 8px' }} />
                <p style={{ margin: 0, fontSize: 13 }}>Loading profile...</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Administrator Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="adm-form-input"
                      placeholder="e.g. S. Gowtham"
                      required
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="adm-form-input"
                      placeholder="e.g. 98422 12345"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="adm-form-input"
                      placeholder="admin@gdkchitfunds.com"
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">Date of Birth</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="adm-form-input"
                    />
                  </div>
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">Office / Residence Address</label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleChange}
                    className="adm-form-input"
                    placeholder="e.g. 45/A Kumaran Road, Tiruppur"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">City</label>
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="adm-form-select"
                    >
                      {TAMIL_NADU_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">State</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="adm-form-select"
                    >
                      {SOUTH_INDIAN_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="adm-modal-footer">
            <button className="adm-btn-secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="adm-btn-primary" type="submit" disabled={saving || loading}>
              {saving ? <Loader2 size={15} className="adm-spinner" /> : <Check size={15} />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProfileModal;
