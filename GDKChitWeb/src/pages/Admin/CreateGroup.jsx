import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../api/apiClient.js';
import {
  RiArrowLeftLine, RiAddLine, RiBarChartBoxLine,
  RiGroupLine, RiTimeLine, RiCalendarLine,
  RiCheckLine, RiLoader4Line,
} from '../../icons.jsx';

const PLAN_PRESETS = [
  { label: '1 Lakh Plan', members: 20, amount: 100000, duration: 20 },
  { label: '2 Lakh Plan', members: 20, amount: 200000, duration: 20 },
  { label: '3 Lakh Plan', members: 20, amount: 300000, duration: 20 },
  { label: '5 Lakh Plan', members: 20, amount: 500000, duration: 20 },
  { label: 'Custom',       members: '', amount: '',     duration: '' },
];

const formatCur = n => n ? `₹${Number(n).toLocaleString('en-IN')}` : '--';

const CreateGroup = () => {
  const navigate = useNavigate();
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [groupData, setGroupData] = useState({ groupName: '', totalMembers: '20', groupAmount: '', duration: '20', startDate: '' });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ text: '', success: false });

  const applyPreset = (preset) => {
    setSelectedPreset(preset.label);
    if (preset.label !== 'Custom') {
      setGroupData(p => ({ ...p, groupName: p.groupName || preset.label, totalMembers: String(preset.members), groupAmount: String(preset.amount), duration: String(preset.duration) }));
    }
  };

  const updateField = e => setGroupData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice({ text: '', success: false });
    setLoading(true);
    try {
      let formattedDate = groupData.startDate;
      if (formattedDate && formattedDate.includes('-')) {
        const [y, m, d] = formattedDate.split('-');
        formattedDate = `${d}/${m}/${y}`;
      }
      const res = await makeRequest('/admin/groups/createGroup', {
        method: 'POST',
        body: JSON.stringify({ groupName: groupData.groupName, totalMembers: Number(groupData.totalMembers), groupAmount: Number(groupData.groupAmount), duration: Number(groupData.duration), startDate: formattedDate }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to create group');
      setNotice({ text: `Group "${data.data?.group_name || groupData.groupName}" created successfully!`, success: true });
      setGroupData({ groupName: '', totalMembers: '20', groupAmount: '', duration: '20', startDate: '' });
      setSelectedPreset(null);
    } catch (err) {
      setNotice({ text: err?.message || 'Failed to create group', success: false });
    } finally {
      setLoading(false);
    }
  };

  const monthly = groupData.totalMembers && groupData.groupAmount
    ? Math.round(Number(groupData.groupAmount) / Number(groupData.totalMembers))
    : null;

  return (
    <div className="rn-page">
      <style>{`
        .cg-preset-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:10px; }
        .cg-preset { border:2px solid var(--border); background:var(--surface); border-radius:var(--radius); padding:14px; text-align:center; cursor:pointer; transition:all 0.18s; }
        .cg-preset:hover { border-color:var(--primary); box-shadow:var(--shadow-sm); }
        .cg-preset.active { border-color:var(--primary); background:var(--primary-light); }
        .cg-preset-name { font-size:13px; font-weight:700; color:var(--text); margin:0 0 4px; }
        .cg-preset-sub  { font-size:11px; color:var(--muted); margin:0; }
        .cg-preview { background:linear-gradient(135deg,var(--surface),#F0F3FF); border:1px solid rgba(40,66,196,0.15); border-radius:var(--radius-lg); padding:20px; }
        .cg-preview-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:14px; }
        .cg-preview-item { background:rgba(40,66,196,0.06); border-radius:var(--radius); padding:12px; text-align:center; }
        .cg-preview-value { font-size:18px; font-weight:800; color:var(--primary); }
        .cg-preview-label { font-size:11px; color:var(--muted); margin-top:2px; }
      `}</style>

      <div className="rn-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="rn-back" onClick={() => navigate('/admin/actions')}>
            <RiArrowLeftLine size={18} />
          </button>
          <div>
            <h2 className="rn-title">Create New Group</h2>
            <p className="rn-subtitle">Set up a new chit fund group</p>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="rn-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <RiBarChartBoxLine size={16} color="var(--primary)" />
          <h3 className="rn-section-title" style={{ margin: 0 }}>Quick Plan Presets</h3>
        </div>
        <div className="cg-preset-grid">
          {PLAN_PRESETS.map(p => (
            <div key={p.label} className={`cg-preset${selectedPreset === p.label ? ' active' : ''}`} onClick={() => applyPreset(p)}>
              <p className="cg-preset-name">{p.label}</p>
              {p.label !== 'Custom' ? (
                <>
                  <p className="cg-preset-sub">{formatCur(p.amount)}</p>
                  <p className="cg-preset-sub">{p.duration} months</p>
                </>
              ) : (
                <p className="cg-preset-sub">Set your own</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="rn-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <RiAddLine size={16} color="var(--primary)" />
          <h3 className="rn-section-title" style={{ margin: 0 }}>Group Details</h3>
        </div>
        <form className="rn-form" onSubmit={handleSubmit}>
          <label className="rn-input-group">
            Group Name
            <input name="groupName" value={groupData.groupName} onChange={updateField} placeholder="e.g. Business Group A" required />
          </label>
          <div className="rn-form-row">
            <label className="rn-input-group">
              Total Members
              <input name="totalMembers" type="number" min="2" max="100" value={groupData.totalMembers} onChange={updateField} required />
            </label>
            <label className="rn-input-group">
              Duration (Months)
              <input name="duration" type="number" min="1" max="60" value={groupData.duration} onChange={updateField} required />
            </label>
          </div>
          <label className="rn-input-group">
            Group Amount (₹)
            <input name="groupAmount" type="number" min="1000" value={groupData.groupAmount} onChange={updateField} placeholder="e.g. 100000" required />
          </label>
          <label className="rn-input-group">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RiCalendarLine size={13} /> Start Date
            </span>
            <input name="startDate" type="date" value={groupData.startDate} onChange={updateField} required />
          </label>

          {/* Live Preview */}
          {groupData.groupName && groupData.groupAmount && (
            <div className="cg-preview">
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiBarChartBoxLine size={16} color="var(--primary)" /> Group Preview
              </p>
              <div className="cg-preview-grid">
                {[
                  { label: 'Pool Amount',       val: formatCur(groupData.groupAmount), Icon: RiGroupLine },
                  { label: 'Monthly / Member',  val: formatCur(monthly),              Icon: RiTimeLine },
                  { label: 'Months',            val: groupData.duration || '--',       Icon: RiCalendarLine },
                ].map(s => (
                  <div key={s.label} className="cg-preview-item">
                    <s.Icon size={18} color="var(--primary)" style={{ marginBottom: 4 }} />
                    <div className="cg-preview-value">{s.val}</div>
                    <div className="cg-preview-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notice.text && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: notice.success ? '#d1fae5' : '#fee2e2', color: notice.success ? '#065f46' : '#991b1b', fontWeight: 600, fontSize: 14 }}>
              {notice.success ? <RiCheckLine size={16} /> : <RiLoader4Line size={16} />} {notice.text}
            </div>
          )}

          <button type="submit" className="rn-primary" disabled={loading} style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <RiLoader4Line size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <RiCheckLine size={18} />}
            {loading ? 'Creating Group...' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;
