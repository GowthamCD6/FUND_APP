import React, { useState, useEffect } from 'react';
import { X as RiCloseLine, Check as RiCheckLine, Calendar as RiCalendarLine } from 'lucide-react';

const EditGroupModal = ({ visible, onClose, initialData, onSave }) => {
  const [formData, setFormData] = useState({
    groupName: '',
    totalAmount: '',
    numberOfUsers: '',
    createdDate: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible && initialData) {
      setFormData({
        groupName: initialData.groupName || '',
        totalAmount: initialData.totalAmount || initialData.monthlyAmount || '',
        numberOfUsers: initialData.numberOfUsers || '',
        createdDate: initialData.createdDate ? new Date(initialData.createdDate).toISOString().split('T')[0] : '',
      });
      setErrors({});
    }
  }, [visible, initialData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.groupName?.trim()) newErrors.groupName = 'Group name is required';
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) newErrors.totalAmount = 'Valid amount is required';
    if (!formData.numberOfUsers || parseInt(formData.numberOfUsers) <= 0) newErrors.numberOfUsers = 'Valid user count is required';
    if (!formData.createdDate) newErrors.createdDate = 'Created date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <div className="mg-modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="mg-modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Edit Group Information</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <RiCloseLine size={24} />
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Group Name *</label>
          <input
            type="text"
            style={{ width: '100%', padding: '12px 16px', border: `1px solid ${errors.groupName ? '#EF4444' : '#D1D5DB'}`, borderRadius: 'var(--radius)', fontSize: 15 }}
            value={formData.groupName}
            onChange={e => handleInputChange('groupName', e.target.value)}
            placeholder="Enter group name"
          />
          {errors.groupName && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.groupName}</p>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Total Amount *</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontWeight: 600 }}>₹</span>
            <input
              type="number"
              style={{ width: '100%', padding: '12px 16px 12px 36px', border: `1px solid ${errors.totalAmount ? '#EF4444' : '#D1D5DB'}`, borderRadius: 'var(--radius)', fontSize: 15 }}
              value={formData.totalAmount}
              onChange={e => handleInputChange('totalAmount', e.target.value)}
              placeholder="100000"
            />
          </div>
          {errors.totalAmount && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.totalAmount}</p>}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Number of Users *</label>
          <input
            type="number"
            style={{ width: '100%', padding: '12px 16px', border: `1px solid ${errors.numberOfUsers ? '#EF4444' : '#D1D5DB'}`, borderRadius: 'var(--radius)', fontSize: 15 }}
            value={formData.numberOfUsers}
            onChange={e => handleInputChange('numberOfUsers', e.target.value)}
            placeholder="20"
          />
          {errors.numberOfUsers && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.numberOfUsers}</p>}
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>Start Date *</label>
          <input
            type="date"
            style={{ width: '100%', padding: '12px 16px', border: `1px solid ${errors.createdDate ? '#EF4444' : '#D1D5DB'}`, borderRadius: 'var(--radius)', fontSize: 15, background: '#fff' }}
            value={formData.createdDate}
            onChange={e => handleInputChange('createdDate', e.target.value)}
          />
          {errors.createdDate && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#EF4444' }}>{errors.createdDate}</p>}
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
            <RiCheckLine size={18} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditGroupModal;
