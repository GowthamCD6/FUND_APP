import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../api/apiClient.js';
import {
  RiArrowLeftLine, RiUserLine, RiPhoneLine, RiLockPasswordLine,
  RiCheckLine, RiLoader4Line, RiShieldUserLine, RiAlertLine,
} from '../../icons.jsx';

const AddUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', yearOfBirth: '', role: 'user', nickname: '' });
  const [errors, setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice]   = useState({ text: '', success: false });

  const updateField = e => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.phoneNumber) errs.phoneNumber = 'Phone number is required';
    else if (!/^[0-9]{10}$/.test(formData.phoneNumber.replace(/\s/g, ''))) errs.phoneNumber = 'Enter a valid 10-digit number';
    if (!formData.yearOfBirth) errs.yearOfBirth = 'Year of birth is required';
    else { const y = parseInt(formData.yearOfBirth, 10); if (!/^\d{4}$/.test(formData.yearOfBirth) || y < 1900 || y > new Date().getFullYear()) errs.yearOfBirth = 'Enter a valid year (e.g. 1990)'; }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setNotice({ text: '', success: false });
    try {
      const res  = await makeRequest('/admin/users/addUser', { method: 'POST', body: JSON.stringify(formData) });
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to add user');
      setNotice({ text: `User "${formData.name}" added successfully!`, success: true });
      setFormData({ name: '', phoneNumber: '', yearOfBirth: '', role: 'user', nickname: '' });
      setErrors({});
    } catch (err) {
      setNotice({ text: err?.message || 'Failed to add user', success: false });
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = formData.role === 'admin';

  return (
    <div className="rn-page">
      <style>{`
        .au-preview { display:flex; align-items:center; gap:16px; background:var(--primary-light); border-radius:var(--radius-lg); padding:20px; }
        .au-preview-avatar { width:60px; height:60px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:800; flex-shrink:0; }
        .au-preview-name { font-size:18px; font-weight:800; color:var(--text); margin:0 0 4px; }
        .au-preview-sub { font-size:13px; color:var(--muted); margin:0; display:flex; align-items:center; gap:4px; }
        .au-role-tag { display:inline-flex; align-items:center; gap:5px; padding:3px 12px; border-radius:100px; font-size:11px; font-weight:700; margin-top:6px; }
      `}</style>

      <div className="rn-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="rn-back" onClick={() => navigate('/admin/actions')}>
            <RiArrowLeftLine size={18} />
          </button>
          <div>
            <h2 className="rn-title">Add New User</h2>
            <p className="rn-subtitle">Create a new member or admin account</p>
          </div>
        </div>
      </div>

      {/* Live preview */}
      {formData.name && (
        <div className="au-preview">
          <div className="au-preview-avatar">
            {formData.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="au-preview-name">{formData.name}</p>
            <p className="au-preview-sub">
              <RiPhoneLine size={13} /> {formData.phoneNumber || 'No phone yet'}
            </p>
            <span className="au-role-tag" style={{ background: isAdmin ? 'var(--primary-light)' : '#dbeafe', color: isAdmin ? 'var(--primary)' : '#3b82f6' }}>
              {isAdmin ? <RiShieldUserLine size={12} /> : <RiUserLine size={12} />}
              {isAdmin ? 'Admin' : 'User'}
            </span>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="rn-card">
        <form className="rn-form" onSubmit={handleSubmit}>
          <div className="rn-input-group">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RiUserLine size={13} /> Full Name *
            </span>
            <input name="name" value={formData.name} onChange={updateField} placeholder="Enter member's full name" required />
            {errors.name && <span className="rn-error" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><RiAlertLine size={12} /> {errors.name}</span>}
          </div>

          <div className="rn-input-group">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RiPhoneLine size={13} /> Phone Number *
            </span>
            <input name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={updateField} placeholder="10-digit mobile number" maxLength={10} required />
            {errors.phoneNumber && <span className="rn-error" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><RiAlertLine size={12} /> {errors.phoneNumber}</span>}
          </div>

          <div className="rn-input-group">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RiUserLine size={13} /> Nickname (optional)
            </span>
            <input name="nickname" value={formData.nickname} onChange={updateField} placeholder="Short name or alias" />
          </div>

          <div className="rn-form-row">
            <div className="rn-input-group">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RiLockPasswordLine size={13} /> Year of Birth *
              </span>
              <input name="yearOfBirth" value={formData.yearOfBirth} onChange={updateField} placeholder="e.g. 1990" maxLength={4} required />
              {errors.yearOfBirth && <span className="rn-error" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><RiAlertLine size={12} /> {errors.yearOfBirth}</span>}
            </div>
            <div className="rn-input-group">
              Role *
              <select name="role" value={formData.role} onChange={updateField}>
                <option value="user">User (Member)</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Role info banner */}
          <div style={{ background: isAdmin ? 'var(--primary-light)' : '#eff6ff', border: `1px solid ${isAdmin ? 'rgba(40,66,196,0.2)' : '#bfdbfe'}`, borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            {isAdmin ? <RiShieldUserLine size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} /> : <RiUserLine size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} />}
            <span>
              {isAdmin
                ? 'Admin users can log in to this web dashboard and manage groups, users, and collections.'
                : 'User accounts are regular chit fund members. They access the GDK Chit Fund mobile app only.'}
            </span>
          </div>

          {notice.text && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: notice.success ? '#d1fae5' : '#fee2e2', color: notice.success ? '#065f46' : '#991b1b', fontWeight: 600, fontSize: 14 }}>
              {notice.success ? <RiCheckLine size={16} /> : <RiAlertLine size={16} />} {notice.text}
            </div>
          )}

          <button type="submit" className="rn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {submitting
              ? <><RiLoader4Line size={18} style={{ animation: 'spin 1s linear infinite' }} /> Adding User...</>
              : <><RiCheckLine size={18} /> Add User</>
            }
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUser;
