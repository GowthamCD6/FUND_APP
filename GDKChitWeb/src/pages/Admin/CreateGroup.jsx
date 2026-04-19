import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../api/apiClient.js';

const CreateGroup = () => {
  const navigate = useNavigate();
  const [groupData, setGroupData] = useState({
    groupName: '',
    totalMembers: '20',
    groupAmount: '',
    duration: '20',
    startDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const updateField = (event) => {
    setGroupData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice('');
    setLoading(true);
    try {
      const response = await makeRequest('/admin/groups/createGroup', {
        method: 'POST',
        body: JSON.stringify({
          ...groupData,
          totalMembers: Number(groupData.totalMembers),
          groupAmount: Number(groupData.groupAmount),
          duration: Number(groupData.duration),
        }),
      });
      const data = await safeJson(response);
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to create group');
      }
      setNotice(`Group \"${data.data.group_name}\" created successfully.`);
      setGroupData({ groupName: '', totalMembers: '20', groupAmount: '', duration: '20', startDate: '' });
    } catch (error) {
      setNotice(error?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rn-page">
      <div className="rn-header">
        <button className="rn-back" onClick={() => navigate('/admin/actions')}>←</button>
        <div>
          <h2 className="rn-title">Create New Group</h2>
          <p className="rn-subtitle">Set up a new chit fund group</p>
        </div>
      </div>

      <div className="rn-card">
        <form className="rn-form" onSubmit={handleSubmit}>
          <label>
            Group Name
            <input name="groupName" value={groupData.groupName} onChange={updateField} required />
          </label>
          <div className="rn-form-row">
            <label>
              Total Members
              <input name="totalMembers" type="number" value={groupData.totalMembers} onChange={updateField} required />
            </label>
            <label>
              Duration (Months)
              <input name="duration" type="number" value={groupData.duration} onChange={updateField} required />
            </label>
          </div>
          <label>
            Group Amount (INR)
            <input name="groupAmount" type="number" value={groupData.groupAmount} onChange={updateField} required />
          </label>
          <label>
            Start Date (DD/MM/YYYY)
            <input name="startDate" value={groupData.startDate} onChange={updateField} placeholder="15/11/2024" required />
          </label>
          {notice ? <p className="rn-notice">{notice}</p> : null}
          <button type="submit" className="rn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;
