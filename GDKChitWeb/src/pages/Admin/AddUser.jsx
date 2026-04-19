import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../api/apiClient.js';

const AddUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    yearOfBirth: '',
    role: 'user',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  const updateField = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    if (errors[event.target.name]) {
      setErrors((prev) => ({ ...prev, [event.target.name]: '' }));
    }
  };

  const validatePhoneNumber = (phone) => /^[0-9]{10}$/.test(phone.replace(/\s/g, ''));
  const validateYear = (year) => {
    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(year, 10);
    return /^\d{4}$/.test(year) && yearNum >= 1900 && yearNum <= currentYear;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = 'Name is required';
    if (!formData.phoneNumber) nextErrors.phoneNumber = 'Phone number is required';
    else if (!validatePhoneNumber(formData.phoneNumber)) nextErrors.phoneNumber = 'Enter a valid 10-digit phone number';
    if (!formData.yearOfBirth) nextErrors.yearOfBirth = 'Year of birth is required';
    else if (!validateYear(formData.yearOfBirth)) nextErrors.yearOfBirth = 'Enter a valid year';

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setNotice('');
    try {
      const response = await makeRequest('/admin/users/addUser', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      const data = await safeJson(response);
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to add user');
      }
      setNotice(`User added: ${formData.name}`);
      setFormData({ name: '', phoneNumber: '', yearOfBirth: '', role: 'user' });
      setErrors({});
    } catch (error) {
      setNotice(error?.message || 'Failed to add user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rn-page">
      <div className="rn-header">
        <button className="rn-back" onClick={() => navigate('/admin/actions')}>←</button>
        <div>
          <h2 className="rn-title">Add New User</h2>
          <p className="rn-subtitle">Create a new member or admin</p>
        </div>
      </div>

      <div className="rn-card">
        <form className="rn-form" onSubmit={handleSubmit}>
          <label>
            User Name
            <input name="name" value={formData.name} onChange={updateField} required />
            {errors.name ? <span className="rn-error">{errors.name}</span> : null}
          </label>
          <label>
            Phone Number
            <input name="phoneNumber" value={formData.phoneNumber} onChange={updateField} required />
            {errors.phoneNumber ? <span className="rn-error">{errors.phoneNumber}</span> : null}
          </label>
          <div className="rn-form-row">
            <label>
              Year of Birth
              <input name="yearOfBirth" value={formData.yearOfBirth} onChange={updateField} required />
              {errors.yearOfBirth ? <span className="rn-error">{errors.yearOfBirth}</span> : null}
            </label>
            <label>
              Role
              <select name="role" value={formData.role} onChange={updateField}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          </div>
          {notice ? <p className="rn-notice">{notice}</p> : null}
          <button type="submit" className="rn-primary" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUser;
