import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import {
  Users as RiGroupLine, Clock as RiTimeLine, Calendar as RiCalendarLine,
  Check as RiCheckLine, Loader2 as RiLoader4Line, Zap as RiZapLine, BarChart3 as RiBarChartBoxLine,
  Layers, Lightbulb, CheckCircle2, X
} from 'lucide-react';
import './CreateGroup.css';

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
  const [selectedPreset, setSelectedPreset] = useState('1 Lakh Plan');
  const [groupData, setGroupData] = useState({ 
    groupName: '1 Lakh Plan', 
    totalMembers: '20', 
    groupAmount: '100000', 
    duration: '20', 
    startDate: '' 
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ text: '', success: false });

  const applyPreset = (preset) => {
    setSelectedPreset(preset.label);
    if (preset.label !== 'Custom') {
      setGroupData(p => ({ 
        ...p, 
        groupName: preset.label, 
        totalMembers: String(preset.members), 
        groupAmount: String(preset.amount), 
        duration: String(preset.duration) 
      }));
    } else {
      setGroupData({ groupName: '', totalMembers: '', groupAmount: '', duration: '', startDate: '' });
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
        body: JSON.stringify({ 
          groupName: groupData.groupName, 
          totalMembers: Number(groupData.totalMembers), 
          groupAmount: Number(groupData.groupAmount), 
          duration: Number(groupData.duration), 
          startDate: formattedDate 
        }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to create group');
      setNotice({ text: `Group "${data.data?.group_name || groupData.groupName}" created successfully!`, success: true });
      // Reset form but keep a generic default or clear completely
      setGroupData({ groupName: '', totalMembers: '', groupAmount: '', duration: '', startDate: '' });
      setSelectedPreset('Custom');
    } catch (err) {
      setNotice({ text: err?.message || 'Failed to create group', success: false });
    } finally {
      setLoading(false);
    }
  };

  const monthly = groupData.totalMembers && groupData.groupAmount
    ? Math.round(Number(groupData.groupAmount) / Number(groupData.totalMembers))
    : 0;

  return (
    <div className="cg-layout">
      {/* ── LEFT COLUMN: MAIN FORM ── */}
      <div className="cg-main">
        
        {/* Presets */}
        <div className="cg-section-title">
          <RiZapLine size={14} /> QUICK PLAN PRESETS
        </div>
        
        <div className="cg-preset-grid">
          {PLAN_PRESETS.map(p => {
            const isActive = selectedPreset === p.label;
            return (
              <div key={p.label} className={`cg-preset ${isActive ? 'active' : ''}`} onClick={() => applyPreset(p)}>
                <p className="cg-preset-name">{p.label}</p>
                {p.label !== 'Custom' ? (
                  <>
                    <p className="cg-preset-sub">{formatCur(p.amount)}</p>
                    <p className="cg-preset-desc">{p.members} members · {p.duration} mo</p>
                  </>
                ) : (
                  <>
                    <p className="cg-preset-sub" style={{ color: isActive ? '#2E7D32' : '#1B3322' }}>Set your own</p>
                    <p className="cg-preset-desc">Any values</p>
                  </>
                )}
                <div className="cg-preset-radio" />
              </div>
            );
          })}
        </div>

        {/* Form Details */}
        <div className="cg-section-title">
          <Layers size={14} /> GROUP DETAILS
        </div>
        
        <form className="cg-form" onSubmit={handleSubmit}>
          
          <div className="cg-input-group">
            <label className="cg-label"><span style={{ fontSize: 14 }}>T</span> Group Name <span className="cg-label-req">*</span></label>
            <input 
              name="groupName" 
              value={groupData.groupName} 
              onChange={updateField} 
              className="cg-input"
              placeholder="e.g. 1 Lakh Plan" 
              required 
            />
            <p className="cg-input-help">Give your group a recognizable name</p>
          </div>
          
          <div className="cg-form-row">
            <div className="cg-input-group">
              <label className="cg-label"><RiGroupLine size={14}/> Total Members <span className="cg-label-req">*</span></label>
              <input 
                name="totalMembers" 
                type="number" 
                min="2" 
                max="100" 
                value={groupData.totalMembers} 
                onChange={updateField} 
                className="cg-input"
                required 
              />
              <p className="cg-input-help">Min 2, Max 100</p>
            </div>
            
            <div className="cg-input-group">
              <label className="cg-label"><RiTimeLine size={14}/> Duration (Months) <span className="cg-label-req">*</span></label>
              <input 
                name="duration" 
                type="number" 
                min="1" 
                max="60" 
                value={groupData.duration} 
                onChange={updateField} 
                className="cg-input"
                required 
              />
              <p className="cg-input-help">Min 1, Max 60 months</p>
            </div>
          </div>
          
          <div className="cg-form-row">
            <div className="cg-input-group">
              <label className="cg-label"><span style={{ fontWeight: 700 }}>₹</span> Group Amount (₹) <span className="cg-label-req">*</span></label>
              <input 
                name="groupAmount" 
                type="number" 
                min="1000" 
                value={groupData.groupAmount} 
                onChange={updateField} 
                className="cg-input"
                placeholder="1,000" 
                required 
              />
              <p className="cg-input-help">Total chit fund pool value</p>
            </div>
            
            <div className="cg-input-group">
              <label className="cg-label"><RiCalendarLine size={14}/> Start Date <span className="cg-label-req">*</span></label>
              <input 
                name="startDate" 
                type="date" 
                value={groupData.startDate} 
                onChange={updateField} 
                className="cg-input"
                required 
              />
              <p className="cg-input-help">When the group auction begins</p>
            </div>
          </div>

          {/* Monthly Summary Box */}
          <div className="cg-summary-box">
            <div className="cg-summary-left">
              <div className="cg-summary-icon">
                <RiBarChartBoxLine size={20} />
              </div>
              <div>
                <p className="cg-summary-title">Monthly contribution per member</p>
                <p className="cg-summary-val">{formatCur(monthly)} <span className="cg-summary-unit">/ member / month</span></p>
              </div>
            </div>
            <div className="cg-summary-right">
              <p className="cg-summary-title">Total Pool</p>
              <p className="cg-summary-val">{formatCur(groupData.groupAmount || 0)}</p>
            </div>
          </div>

          {notice.text && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px', borderRadius: '6px', background: notice.success ? '#d1fae5' : '#fee2e2', color: notice.success ? '#065f46' : '#991b1b', fontWeight: 600, fontSize: 13, marginBottom: 12 }}>
              {notice.success ? <RiCheckLine size={16} /> : <RiLoader4Line size={16} />} {notice.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="cg-actions">
            <button type="button" className="cg-btn-cancel" onClick={() => navigate('/admin/admintool')}>
              <X size={18} /> Cancel
            </button>
            <button type="submit" className="cg-btn-primary" disabled={loading}>
              {loading ? <RiLoader4Line size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={18} />}
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>

        </form>
      </div>


      {/* ── RIGHT COLUMN: SIDEBAR ── */}
      <div className="cg-sidebar">
        
        {/* Preview Card */}
        <div className="cg-side-card">
          <h3 className="cg-side-title">GROUP PREVIEW</h3>
          <div className="cg-preview-icon">
            <Layers size={28} />
          </div>
          <p className="cg-preview-name">{groupData.groupName || 'Untitled Group'}</p>
          <div className="cg-preview-badge">
            <CheckCircle2 size={14} /> Active Group
          </div>
          
          <div className="cg-preview-grid">
            <div className="cg-preview-stat">
              <p className="cg-preview-stat-val">{groupData.totalMembers || '--'}</p>
              <p className="cg-preview-stat-lbl">Members</p>
            </div>
            <div className="cg-preview-stat">
              <p className="cg-preview-stat-val">{groupData.duration ? `${groupData.duration} mo` : '--'}</p>
              <p className="cg-preview-stat-lbl">Duration</p>
            </div>
            <div className="cg-preview-stat">
              <p className="cg-preview-stat-val">{groupData.groupAmount ? `₹${(Number(groupData.groupAmount)/100000).toFixed(1).replace('.0','')} L` : '--'}</p>
              <p className="cg-preview-stat-lbl">Pool Amount</p>
            </div>
            <div className="cg-preview-stat">
              <p className="cg-preview-stat-val">{formatCur(monthly)}</p>
              <p className="cg-preview-stat-lbl">Per Member</p>
            </div>
          </div>
        </div>

        {/* Steps Card */}
        <div className="cg-side-card">
          <h3 className="cg-side-title">WHAT HAPPENS NEXT</h3>
          <div className="cg-steps">
            <div className="cg-step active">
              <div className="cg-step-num">1</div>
              <div className="cg-step-text">Fill in group details</div>
            </div>
            <div className="cg-step">
              <div className="cg-step-num">2</div>
              <div className="cg-step-text">Group gets created</div>
            </div>
            <div className="cg-step">
              <div className="cg-step-num">3</div>
              <div className="cg-step-text">Assign members to group</div>
            </div>
            <div className="cg-step">
              <div className="cg-step-num">4</div>
              <div className="cg-step-text">Auction begins on start date</div>
            </div>
          </div>
        </div>

        {/* Tips Card */}
        <div className="cg-side-card" style={{ padding: '16px' }}>
          <div className="cg-tips-hd">
            <div className="cg-tips-icon"><Lightbulb size={14} /></div>
            <h4 className="cg-tips-title">Quick Tips</h4>
          </div>
          <div className="cg-tip">
            <CheckCircle2 size={14} color="#10B981" style={{ flexShrink: 0, marginTop: 1 }} />
            <p className="cg-tip-text">Duration must match total member count</p>
          </div>
          <div className="cg-tip">
            <CheckCircle2 size={14} color="#10B981" style={{ flexShrink: 0, marginTop: 1 }} />
            <p className="cg-tip-text">Monthly contribution = Amount ÷ Members</p>
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

export default CreateGroup;
