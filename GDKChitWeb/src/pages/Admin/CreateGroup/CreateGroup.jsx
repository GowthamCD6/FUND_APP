import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../api/apiClient.js';
import {
  Users as RiGroupLine, Clock as RiTimeLine, Calendar as RiCalendarLine,
  Check as RiCheckLine, Loader2 as RiLoader4Line, Zap as RiZapLine, BarChart3 as RiBarChartBoxLine,
  Layers, Lightbulb, CheckCircle2, X, ArrowRight, ShieldCheck, Sparkles
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

const getTodayString = () => new Date().toISOString().split('T')[0];

const CreateGroup = () => {
  const navigate = useNavigate();
  const [selectedPreset, setSelectedPreset] = useState('1 Lakh Plan');
  const [groupData, setGroupData] = useState({ 
    groupName: '1 Lakh Plan', 
    totalMembers: '20', 
    groupAmount: '100000', 
    duration: '20', 
    startDate: getTodayString() 
  });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ text: '', success: false });
  const [createdGroup, setCreatedGroup] = useState(null);

  const applyPreset = (preset) => {
    setSelectedPreset(preset.label);
    if (preset.label !== 'Custom') {
      setGroupData(p => ({ 
        groupName: preset.label, 
        totalMembers: String(preset.members), 
        groupAmount: String(preset.amount), 
        duration: String(preset.duration),
        startDate: p.startDate || getTodayString()
      }));
    } else {
      setGroupData(p => ({ 
        groupName: '', 
        totalMembers: '', 
        groupAmount: '', 
        duration: '', 
        startDate: p.startDate || getTodayString() 
      }));
    }
  };

  const updateField = e => {
    const { name, value } = e.target;
    setGroupData(p => {
      const updated = { ...p, [name]: value };
      // In custom mode, if totalMembers is changed and duration was matching or empty, auto-sync duration
      if (name === 'totalMembers' && selectedPreset === 'Custom') {
        if (!p.duration || p.duration === p.totalMembers) {
          updated.duration = value;
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice({ text: '', success: false });
    setCreatedGroup(null);

    // Client validations
    const cleanName = (groupData.groupName || '').trim();
    const membersNum = Number(groupData.totalMembers);
    const amountNum = Number(groupData.groupAmount);
    const durationNum = Number(groupData.duration);

    if (cleanName.length < 3) {
      setNotice({ text: 'Group name must be at least 3 characters long', success: false });
      return;
    }
    if (!membersNum || membersNum < 2 || membersNum > 500) {
      setNotice({ text: 'Total members must be between 2 and 500', success: false });
      return;
    }
    if (!amountNum || amountNum <= 0) {
      setNotice({ text: 'Group amount must be greater than ₹0', success: false });
      return;
    }
    if (!durationNum || durationNum < 1 || durationNum > 120) {
      setNotice({ text: 'Duration must be between 1 and 120 months', success: false });
      return;
    }
    if (!groupData.startDate) {
      setNotice({ text: 'Please select a start date for the plan', success: false });
      return;
    }

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
          groupName: cleanName, 
          totalMembers: membersNum, 
          groupAmount: amountNum, 
          duration: durationNum, 
          startDate: formattedDate 
        }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Failed to create group');

      const createdObj = data.data || { group_name: cleanName, group_code: 'NEW' };
      setCreatedGroup(createdObj);
      setNotice({ text: `Plan "${createdObj.group_name || cleanName}" created successfully!`, success: true });
    } catch (err) {
      setNotice({ text: err?.message || 'Failed to create group', success: false });
    } finally {
      setLoading(false);
    }
  };

  const handleResetForNew = () => {
    setCreatedGroup(null);
    setNotice({ text: '', success: false });
    applyPreset(PLAN_PRESETS[0]);
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
                    <p className="cg-preset-desc">Any custom values</p>
                  </>
                )}
                <div className="cg-preset-radio" />
              </div>
            );
          })}
        </div>

        {/* Form Details */}
        <div className="cg-section-title">
          <Layers size={14} /> PLAN & GROUP SPECIFICATIONS
        </div>
        
        <form className="cg-form" onSubmit={handleSubmit}>
          
          <div className="cg-input-group">
            <label className="cg-label"><span style={{ fontSize: 14 }}>T</span> Plan Name <span className="cg-label-req">*</span></label>
            <input 
              name="groupName" 
              value={groupData.groupName} 
              onChange={updateField} 
              className="cg-input"
              placeholder="e.g. 1 Lakh Plan" 
              required 
              disabled={loading || Boolean(createdGroup)}
            />
            <p className="cg-input-help">Give your chit scheme a recognizable name</p>
          </div>
          
          <div className="cg-form-row">
            <div className="cg-input-group">
              <label className="cg-label"><RiGroupLine size={14}/> Total Members <span className="cg-label-req">*</span></label>
              <input 
                name="totalMembers" 
                type="number" 
                min="2" 
                max="500" 
                value={groupData.totalMembers} 
                onChange={updateField} 
                className="cg-input"
                required 
                disabled={loading || Boolean(createdGroup)}
              />
              <p className="cg-input-help">Total subscriber seats (2 - 500)</p>
            </div>
            
            <div className="cg-input-group">
              <label className="cg-label"><RiTimeLine size={14}/> Duration (Months) <span className="cg-label-req">*</span></label>
              <input 
                name="duration" 
                type="number" 
                min="1" 
                max="120" 
                value={groupData.duration} 
                onChange={updateField} 
                className="cg-input"
                required 
                disabled={loading || Boolean(createdGroup)}
              />
              <p className="cg-input-help">Number of monthly auction cycles (1 - 120)</p>
            </div>
          </div>
          
          <div className="cg-form-row">
            <div className="cg-input-group">
              <label className="cg-label"><span style={{ fontWeight: 700 }}>₹</span> Total Chit Pool (₹) <span className="cg-label-req">*</span></label>
              <input 
                name="groupAmount" 
                type="number" 
                min="1000" 
                value={groupData.groupAmount} 
                onChange={updateField} 
                className="cg-input"
                placeholder="100000" 
                required 
                disabled={loading || Boolean(createdGroup)}
              />
              <p className="cg-input-help">Total chit fund prize value</p>
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
                disabled={loading || Boolean(createdGroup)}
              />
              <p className="cg-input-help">Date of the 1st monthly auction</p>
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
              <p className="cg-summary-title">Total Pool Value</p>
              <p className="cg-summary-val">{formatCur(groupData.groupAmount || 0)}</p>
            </div>
          </div>

          {/* Notice & Post-Creation Banner */}
          {notice.text && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 8, 
              padding: '14px 16px', 
              borderRadius: '8px', 
              background: notice.success ? '#d1fae5' : '#fee2e2', 
              color: notice.success ? '#065f46' : '#991b1b', 
              border: notice.success ? '1px solid #a7f3d0' : '1px solid #fecaca',
              marginBottom: 16 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
                {notice.success ? <CheckCircle2 size={18} color="#059669" /> : <X size={18} color="#dc2626" />} 
                {notice.text}
              </div>

              {createdGroup && (
                <div style={{ 
                  marginTop: 6, 
                  paddingTop: 10, 
                  borderTop: '1px solid #a7f3d0',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10
                }}>
                  <div style={{ fontSize: 13, color: '#047857' }}>
                    Group Code: <strong>#{createdGroup.group_code}</strong> · Ready for member enrollment.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/manage-groups', { state: { groupId: createdGroup.id, groupName: createdGroup.group_name } })}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      Open & Assign Members <ArrowRight size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={handleResetForNew}
                      style={{
                        background: '#ffffff',
                        color: '#047857',
                        border: '1px solid #059669',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      Create Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {!createdGroup && (
            <div className="cg-actions">
              <button type="button" className="cg-btn-cancel" onClick={() => navigate('/admin/admintool')}>
                <X size={18} /> Cancel
              </button>
              <button type="submit" className="cg-btn-primary" disabled={loading}>
                {loading ? <RiLoader4Line size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={18} />}
                {loading ? 'Creating Plan...' : 'Create New Plan'}
              </button>
            </div>
          )}

        </form>
      </div>


      {/* ── RIGHT COLUMN: SIDEBAR ── */}
      <div className="cg-sidebar">
        
        {/* Preview Card */}
        <div className="cg-side-card">
          <h3 className="cg-side-title">PLAN PREVIEW</h3>
          <div className="cg-preview-icon">
            <Layers size={28} />
          </div>
          <p className="cg-preview-name">{groupData.groupName || 'Untitled Plan'}</p>
          <div className="cg-preview-badge">
            <CheckCircle2 size={14} /> {createdGroup ? 'Plan Created' : 'Ready to Launch'}
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
            <div className={`cg-step ${!createdGroup ? 'active' : ''}`}>
              <div className="cg-step-num">1</div>
              <div className="cg-step-text">Configure plan & pool details</div>
            </div>
            <div className={`cg-step ${createdGroup ? 'active' : ''}`}>
              <div className="cg-step-num">2</div>
              <div className="cg-step-text">Plan & broadcast chat room created</div>
            </div>
            <div className="cg-step">
              <div className="cg-step-num">3</div>
              <div className="cg-step-text">Assign members to group</div>
            </div>
            <div className="cg-step">
              <div className="cg-step-num">4</div>
              <div className="cg-step-text">Monthly auction commences</div>
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
            <p className="cg-tip-text">Duration should match total subscriber seats</p>
          </div>
          <div className="cg-tip">
            <CheckCircle2 size={14} color="#10B981" style={{ flexShrink: 0, marginTop: 1 }} />
            <p className="cg-tip-text">Monthly installment = Total Pool ÷ Members</p>
          </div>
          <div className="cg-tip">
            <CheckCircle2 size={14} color="#10B981" style={{ flexShrink: 0, marginTop: 1 }} />
            <p className="cg-tip-text">Created plans automatically get default settings & broadcast room</p>
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
