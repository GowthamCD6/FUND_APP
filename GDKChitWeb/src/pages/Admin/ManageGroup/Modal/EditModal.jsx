import React, { useState, useEffect } from 'react';
import { X as RiCloseLine, Check as RiCheckLine } from 'lucide-react';

const EditModal = ({ isOpen, onClose, initialData, onSave }) => {
  const [form, setForm] = useState({
    groupName: '',
    totalAmount: '',
    numberOfUsers: '',
    createdDate: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({
        groupName: initialData.name || initialData.groupName || '',
        totalAmount: initialData.groupAmount || initialData.totalAmount || '',
        numberOfUsers: initialData.totalMembers || initialData.numberOfUsers || '',
        createdDate: initialData.startDate ? initialData.startDate.split('T')[0] : (initialData.createdDate || ''),
      });
      setErrors({});
    }
  }, [initialData, isOpen]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.groupName.trim()) {
      newErrors.groupName = 'Group name is required';
    }
    if (!form.totalAmount || parseFloat(form.totalAmount) <= 0) {
      newErrors.totalAmount = 'Please enter a valid monthly amount';
    }
    if (!form.numberOfUsers || parseInt(form.numberOfUsers) <= 0) {
      newErrors.numberOfUsers = 'Please enter a valid number of users';
    }
    if (!form.createdDate) {
      newErrors.createdDate = 'Start date is required';
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
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Edit Group Information</h3>
          <button className="rp-close" onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <RiCloseLine size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mg2-input-group" style={{ marginBottom: 14 }}>
            <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Group Name *</label>
            <input
              type="text"
              className={`mg2-form-input ${errors.groupName ? 'input-error' : ''}`}
              value={form.groupName}
              onChange={e => handleChange('groupName', e.target.value)}
              placeholder="Enter group name"
            />
            {errors.groupName && <p className="mg2-input-error-txt">{errors.groupName}</p>}
          </div>

          <div className="mg2-input-group" style={{ marginBottom: 14 }}>
            <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Total Amount *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#059669', fontSize: 14 }}>₹</span>
              <input
                type="number"
                className={`mg2-form-input ${errors.totalAmount ? 'input-error' : ''}`}
                style={{ paddingLeft: 26 }}
                value={form.totalAmount}
                onChange={e => handleChange('totalAmount', e.target.value)}
                placeholder="10000"
              />
            </div>
            {errors.totalAmount && <p className="mg2-input-error-txt">{errors.totalAmount}</p>}
          </div>

          <div className="mg2-input-group" style={{ marginBottom: 14 }}>
            <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Number of Users *</label>
            <input
              type="number"
              className={`mg2-form-input ${errors.numberOfUsers ? 'input-error' : ''}`}
              value={form.numberOfUsers}
              onChange={e => handleChange('numberOfUsers', e.target.value)}
              placeholder="20"
            />
            {errors.numberOfUsers && <p className="mg2-input-error-txt">{errors.numberOfUsers}</p>}
          </div>

          <div className="mg2-input-group" style={{ marginBottom: 20 }}>
            <label className="mg2-input-label" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Start Date *</label>
            <input
              type="date"
              className={`mg2-form-input ${errors.createdDate ? 'input-error' : ''}`}
              value={form.createdDate}
              onChange={e => handleChange('createdDate', e.target.value)}
            />
            {errors.createdDate && <p className="mg2-input-error-txt">{errors.createdDate}</p>}
          </div>

          <div className="rn-form-row" style={{ marginTop: 20, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
            <button type="button" className="mg2-modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="mg2-modal-save-btn">
              <RiCheckLine size={16} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
