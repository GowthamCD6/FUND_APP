import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../../api/apiClient.js';
import Lottie from 'lottie-react';
import addUserAnimation from '../../../../animation/Add-user.json';
import {
  User as RiUserLine, Phone as RiPhoneLine, Lock as RiLockPasswordLine,
  Check as RiCheckLine, Loader2 as RiLoader4Line, ShieldCheck as RiShieldUserLine, AlertTriangle as RiAlertLine,
  UserPlus, Calendar, Lightbulb, CheckCircle2, X, Key, AtSign, ShieldCheck, Info as RiInformationLine
} from 'lucide-react';
import './AddUser.css';

const AddUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', phoneNumber: '', dateOfBirth: '', yearOfBirth: '', role: 'user', nickname: '' });
  const [errors, setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice]   = useState({ text: '', success: false });
  const [completion, setCompletion] = useState(0);

  console.log('Lottie type:', typeof Lottie, Lottie);
  console.log('ShieldCheck type:', typeof ShieldCheck);
  console.log('RiShieldUserLine type:', typeof RiShieldUserLine);

  const LottieComponent = Lottie.default || Lottie;

  // Calculate completion percentage
  useEffect(() => {
    let fields = 0;
    if (formData.name) fields++;
    if (formData.phoneNumber) fields++;
    if (formData.dateOfBirth || formData.yearOfBirth) fields++;
    // Role is always set
    setCompletion(Math.round((fields / 3) * 100));
  }, [formData]);

  const updateField = e => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.phoneNumber) errs.phoneNumber = 'Phone number is required';
    else if (!/^[0-9]{10}$/.test(formData.phoneNumber.replace(/\s/g, ''))) errs.phoneNumber = 'Enter a valid 10-digit number';
    if (!formData.dateOfBirth && !formData.yearOfBirth) errs.yearOfBirth = 'Birth date/year is required';
    else if (formData.yearOfBirth) { 
      const y = parseInt(formData.yearOfBirth, 10); 
      if (!/^\d{4}$/.test(formData.yearOfBirth) || y < 1900 || y > new Date().getFullYear()) {
        errs.yearOfBirth = 'Enter a valid year (e.g. 1990)'; 
      }
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setNotice({ text: '', success: false });
    try {
      const finalYob = formData.yearOfBirth || (formData.dateOfBirth ? formData.dateOfBirth.substring(0, 4) : '');
      const finalDob = formData.dateOfBirth || (finalYob ? `${finalYob}-01-01` : null);
      const res  = await makeRequest('/admin/users/addUser', { 
        method: 'POST', 
        body: JSON.stringify({
          ...formData,
          yearOfBirth: finalYob,
          dateOfBirth: finalDob
        }) 
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to add user');
      setNotice({ text: `User "${formData.name}" added successfully!`, success: true });
      setFormData({ name: '', phoneNumber: '', dateOfBirth: '', yearOfBirth: '', role: 'user', nickname: '' });
      setErrors({});
    } catch (err) {
      setNotice({ text: err?.message || 'Failed to add user', success: false });
    } finally {
      setSubmitting(false);
    }
  };

  const isAdmin = formData.role === 'admin';

  return (
    <div className="au-layout">
      {/* ── LEFT COLUMN: MAIN FORM ── */}
      <div className="au-main">
        
        {/* Personal Information */}
        <div className="au-section-title">
          <RiUserLine size={14} /> PERSONAL INFORMATION
        </div>
        
        <form className="au-form" onSubmit={handleSubmit}>
          
          <div className="au-form-row">
            <div className="au-input-group">
              <label className="au-label"><RiUserLine size={14} /> Full Name <span className="au-label-req">*</span></label>
              <input 
                name="name" 
                value={formData.name} 
                onChange={updateField} 
                className={`au-input ${errors.name ? 'error' : ''}`}
                placeholder="Enter member's full name" 
              />
              {errors.name && <p className="au-error-text"><RiAlertLine size={12} /> {errors.name}</p>}
            </div>
            
            <div className="au-input-group">
              <label className="au-label"><AtSign size={14} /> Nickname <span style={{ color: '#6B7280', fontSize: 11, fontWeight: 500 }}>(optional)</span></label>
              <input 
                name="nickname" 
                value={formData.nickname} 
                onChange={updateField} 
                className="au-input"
                placeholder="Short name or alias" 
              />
            </div>
          </div>
          
          <div className="au-form-row">
            <div className="au-input-group">
              <label className="au-label"><RiPhoneLine size={14}/> Phone Number <span className="au-label-req">*</span></label>
              <input 
                name="phoneNumber" 
                type="tel"
                maxLength={10}
                value={formData.phoneNumber} 
                onChange={updateField} 
                className={`au-input ${errors.phoneNumber ? 'error' : ''}`}
                placeholder="10-digit mobile number" 
              />
              {errors.phoneNumber && <p className="au-error-text"><RiAlertLine size={12} /> {errors.phoneNumber}</p>}
            </div>
            
            <div className="au-input-group">
              <label className="au-label"><Calendar size={14}/> Date of Birth <span className="au-label-req">*</span></label>
              <input 
                name="dateOfBirth" 
                type="date"
                value={formData.dateOfBirth || ''} 
                onChange={e => {
                  const val = e.target.value;
                  setFormData(p => ({
                    ...p,
                    dateOfBirth: val,
                    yearOfBirth: val && val.length >= 4 ? val.substring(0, 4) : p.yearOfBirth
                  }));
                  if (errors.yearOfBirth) setErrors(p => ({ ...p, yearOfBirth: '' }));
                }} 
                className="au-input" 
              />
            </div>

            <div className="au-input-group">
              <label className="au-label"><Calendar size={14}/> Year of Birth <span className="au-label-req">*</span></label>
              <input 
                name="yearOfBirth" 
                value={formData.yearOfBirth} 
                onChange={updateField} 
                maxLength={4}
                className={`au-input ${errors.yearOfBirth ? 'error' : ''}`}
                placeholder="e.g. 1990" 
              />
              {errors.yearOfBirth 
                ? <p className="au-error-text"><RiAlertLine size={12} /> {errors.yearOfBirth}</p>
                : <p className="au-input-help">Used as default PIN for first login</p>
              }
            </div>
          </div>

          {/* Account Role */}
          <div className="au-section-title">
            <ShieldCheck size={14} /> ACCOUNT ROLE
          </div>

          <div className="au-role-grid">
            <div className={`au-role-card ${!isAdmin ? 'active' : ''}`} onClick={() => setFormData(p => ({ ...p, role: 'user' }))}>
              <div className="au-role-icon"><RiUserLine size={16} /></div>
              <div className="au-role-info">
                <div className="au-role-name">User <div className="au-role-radio" /></div>
                <p className="au-role-desc">Regular chit fund member. Mobile app access only.</p>
              </div>
            </div>

            <div className={`au-role-card ${isAdmin ? 'active' : ''}`} onClick={() => setFormData(p => ({ ...p, role: 'admin' }))}>
              <div className="au-role-icon"><RiShieldUserLine size={16} /></div>
              <div className="au-role-info">
                <div className="au-role-name">Admin <div className="au-role-radio" /></div>
                <p className="au-role-desc">Can manage users, groups & collections via web dashboard.</p>
              </div>
            </div>
          </div>

          <div className="au-role-banner">
            <RiInformationLine size={16} style={{ flexShrink: 0 }} />
            <span>
              {isAdmin
                ? 'Admin users can log in to this web dashboard and manage groups, users, and collections.'
                : 'User accounts are regular chit fund members. They access the GDK Chit Fund mobile app only.'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="au-progress-wrap">
            <div className="au-progress-bar">
              <div className="au-progress-fill" style={{ width: `${completion}%` }} />
            </div>
            <div className="au-progress-labels">
              <span>Form completion</span>
              <span className="au-progress-pct">{completion}%</span>
            </div>
          </div>

          {notice.text && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', borderRadius: '6px', background: notice.success ? '#d1fae5' : '#fee2e2', color: notice.success ? '#065f46' : '#991b1b', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
              {notice.success ? <RiCheckLine size={16} /> : <RiAlertLine size={16} />} {notice.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="au-actions">
            <button type="button" className="au-btn-cancel" onClick={() => navigate('/admin/admintool')}>
              <X size={18} /> Cancel
            </button>

            <button type="submit" className="au-btn-primary" disabled={submitting}>
              {submitting ? <RiLoader4Line size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={18} />}
              {submitting ? 'Adding User...' : 'Add User'}
            </button>
          </div>

        </form>
      </div>

      {/* ── RIGHT COLUMN: SIDEBAR ── */}
      <div className="au-sidebar">
        
        {/* Preview Card */}
        <div className="au-side-card">
          <div 
            className="au-preview-avatar" 
            style={{ 
              background: formData.name ? 'var(--primary)' : 'transparent',
              overflow: formData.name ? 'hidden' : 'visible',
              width: formData.name ? 64 : 164,
              height: formData.name ? 64 : 164
            }}
          >
            {formData.name ? formData.name.charAt(0).toUpperCase() : (
              <LottieComponent animationData={addUserAnimation} loop={true} style={{ width: 156, height: 156 }} />
            )}
          </div>
          <p className="au-preview-name">{formData.name || 'Waiting for name...'}</p>
          <p className="au-preview-nick">{formData.nickname || 'Nickname not set'}</p>
          
          <div className="au-preview-badge">
            {isAdmin ? <RiShieldUserLine size={14} /> : <RiUserLine size={14} />} 
            {isAdmin ? 'Admin' : 'User'}
          </div>
          
          <div className="au-preview-info-row">
            <div className="au-preview-info-icon"><RiPhoneLine size={14} /></div>
            <p className={`au-preview-info-text ${formData.phoneNumber ? 'filled' : ''}`}>
              {formData.phoneNumber || 'No phone added'}
            </p>
          </div>
          
          <div className="au-preview-info-row">
            <div className="au-preview-info-icon"><Calendar size={14} /></div>
            <p className={`au-preview-info-text ${formData.yearOfBirth ? 'filled' : ''}`}>
              {formData.yearOfBirth || 'Year of birth not set'}
            </p>
          </div>

          <div className="au-preview-info-row">
            <div className="au-preview-info-icon"><Key size={14} /></div>
            <p className="au-preview-info-text">
              {formData.yearOfBirth ? `PIN: ${formData.yearOfBirth}` : 'PIN will use birth year'}
            </p>
          </div>
        </div>

        {/* Steps Card */}
        <div className="au-side-card">
          <h3 className="au-side-title">WHAT HAPPENS NEXT</h3>
          <div className="au-steps">
            <div className="au-step active">
              <div className="au-step-num">1</div>
              <div className="au-step-text">Fill in user details</div>
            </div>
            <div className="au-step">
              <div className="au-step-num">2</div>
              <div className="au-step-text">Account is created</div>
            </div>
            <div className="au-step">
              <div className="au-step-num">3</div>
              <div className="au-step-text">User receives login info</div>
            </div>
            <div className="au-step">
              <div className="au-step-num">4</div>
              <div className="au-step-text">User logs in via mobile app</div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AddUser;
