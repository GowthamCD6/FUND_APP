import React, { useState, useEffect } from 'react';
import { makeRequest, safeJson } from '../../../../api/apiClient.js';
import {
  Download,
  X,
  FileSpreadsheet,
  FileJson,
  Check,
  Search,
  Users,
  Layers,
  Loader2,
  AlertCircle
} from 'lucide-react';
import './AdminModals.css';

const DataExportModal = ({ isOpen, onClose }) => {
  const [exportType, setExportType] = useState('users'); // 'users' | 'groups'
  const [format, setFormat] = useState('csv'); // 'csv' | 'json'
  const [selectionMode, setSelectionMode] = useState('all'); // 'all' | 'specific'
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    fetchData();
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [uRes, gRes] = await Promise.all([
        makeRequest('/admin/users/getAllUsers'),
        makeRequest('/admin/groups/getGroups')
      ]);
      const [uData, gData] = await Promise.all([safeJson(uRes), safeJson(gRes)]);

      if (uData.success) setUsers(uData.data || []);
      if (gData.success) setGroups(gData.data || []);
    } catch (e) {
      setErrorMsg('Failed to load records for export.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAllFiltered = (filteredList) => {
    const next = new Set(selectedIds);
    filteredList.forEach(item => next.add(item.id || item.user_id));
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const currentList = exportType === 'users' ? users : groups;
  const filteredList = currentList.filter(item => {
    const q = search.toLowerCase();
    if (exportType === 'users') {
      return (
        (item.name || item.username || '').toLowerCase().includes(q) ||
        (item.phone || '').includes(q)
      );
    } else {
      return (
        (item.name || item.group_name || '').toLowerCase().includes(q) ||
        String(item.groupAmount || item.group_amount || '').includes(q)
      );
    }
  });

  const handleExport = () => {
    setExporting(true);
    try {
      const targetData = selectionMode === 'all'
        ? currentList
        : currentList.filter(item => selectedIds.has(item.id || item.user_id));

      if (targetData.length === 0) {
        alert('Please select at least one record to export.');
        setExporting(false);
        return;
      }

      let fileData = '';
      let mimeType = '';
      let fileExt = '';

      if (format === 'json') {
        fileData = JSON.stringify(targetData, null, 2);
        mimeType = 'application/json';
        fileExt = 'json';
      } else {
        // Generate clean CSV
        if (exportType === 'users') {
          const headers = ['ID', 'Name', 'Phone', 'Role', 'Status', 'JoinedDate', 'GroupsCount'];
          const rows = targetData.map(u => [
            u.id || u.user_id || '',
            `"${(u.name || u.username || '').replace(/"/g, '""')}"`,
            u.phone || '',
            u.role || u.type || 'user',
            u.is_blocked ? 'Blocked' : 'Active',
            u.createdAt || u.created_at || '',
            u.groups_count || (u.groups ? u.groups.length : 0)
          ]);
          fileData = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        } else {
          const headers = ['ID', 'GroupName', 'TotalAmount', 'MembersCap', 'DurationMonths', 'CompletedCycles', 'Status', 'StartDate'];
          const rows = targetData.map(g => [
            g.id || '',
            `"${(g.name || g.group_name || '').replace(/"/g, '""')}"`,
            g.groupAmount || g.group_amount || 0,
            g.totalMembers || g.total_members || 20,
            g.duration || 20,
            g.completedCycles || g.completed_cycles || 0,
            g.status || 'Active',
            g.startDate || g.start_date || ''
          ]);
          fileData = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        }
        mimeType = 'text/csv;charset=utf-8;';
        fileExt = 'csv';
      }

      const blob = new Blob([fileData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const nowStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.setAttribute('download', `GDK_Chit_${exportType}_export_${nowStr}.${fileExt}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to generate export file.');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal-card" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div className="adm-modal-title-group">
            <div className="adm-modal-icon-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Download size={20} />
            </div>
            <div>
              <h2 className="adm-modal-title">Export System Data</h2>
              <p className="adm-modal-subtitle">Download records to CSV spreadsheet or JSON backup</p>
            </div>
          </div>
          <button className="adm-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="adm-modal-body">
          {errorMsg && (
            <div className="adm-alert adm-alert-error">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Category Switch */}
          <div style={{ marginBottom: 16 }}>
            <label className="adm-form-label" style={{ display: 'block', marginBottom: 8 }}>
              Select Entity to Export
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={() => { setExportType('users'); setSelectedIds(new Set()); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: exportType === 'users' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: exportType === 'users' ? '#eff6ff' : '#ffffff',
                  color: exportType === 'users' ? '#1d4ed8' : '#334155',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                <Users size={16} />
                Subscribers & Members ({users.length})
              </button>

              <button
                type="button"
                onClick={() => { setExportType('groups'); setSelectedIds(new Set()); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: exportType === 'groups' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: exportType === 'groups' ? '#eff6ff' : '#ffffff',
                  color: exportType === 'groups' ? '#1d4ed8' : '#334155',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                <Layers size={16} />
                Chit Groups ({groups.length})
              </button>
            </div>
          </div>

          {/* 2. Format & Selection Mode */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="adm-form-label">Export Format</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setFormat('csv')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: format === 'csv' ? '2px solid #059669' : '1px solid #cbd5e1',
                    background: format === 'csv' ? '#ecfdf5' : '#fff',
                    color: format === 'csv' ? '#047857' : '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <FileSpreadsheet size={15} />
                  CSV (Excel)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('json')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: format === 'json' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                    background: format === 'json' ? '#f5f3ff' : '#fff',
                    color: format === 'json' ? '#6d28d9' : '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <FileJson size={15} />
                  JSON
                </button>
              </div>
            </div>

            <div>
              <label className="adm-form-label">Selection Scope</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setSelectionMode('all')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: selectionMode === 'all' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: selectionMode === 'all' ? '#eff6ff' : '#fff',
                    color: selectionMode === 'all' ? '#1d4ed8' : '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  All ({currentList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionMode('specific')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: selectionMode === 'specific' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: selectionMode === 'specific' ? '#eff6ff' : '#fff',
                    color: selectionMode === 'specific' ? '#1d4ed8' : '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Select Specific ({selectedIds.size})
                </button>
              </div>
            </div>
          </div>

          {/* 3. Specific Records Checklist if enabled */}
          {selectionMode === 'specific' && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, background: '#f8fafc', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={`Search ${exportType === 'users' ? 'members by name or phone' : 'groups'}...`}
                    className="adm-form-input"
                    style={{ paddingLeft: 30, height: 34, fontSize: 12 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => selectAllFiltered(filteredList)}
                  style={{ border: '1px solid #cbd5e1', background: '#fff', fontSize: 11, fontWeight: 600, padding: '0 10px', borderRadius: 6, cursor: 'pointer' }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  style={{ border: '1px solid #cbd5e1', background: '#fff', fontSize: 11, fontWeight: 600, padding: '0 10px', borderRadius: 6, cursor: 'pointer' }}
                >
                  Clear
                </button>
              </div>

              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filteredList.map(item => {
                  const id = item.id || item.user_id;
                  const isChecked = selectedIds.has(id);
                  const title = exportType === 'users' ? (item.name || item.username) : (item.name || item.group_name);
                  const sub = exportType === 'users' ? item.phone : `₹${Number(item.groupAmount || item.group_amount || 0).toLocaleString('en-IN')}`;

                  return (
                    <label
                      key={id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: isChecked ? '#eff6ff' : '#fff',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(id)}
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{title}</span>
                      </div>
                      <span style={{ color: '#64748b' }}>{sub}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="adm-modal-footer">
          <button className="adm-btn-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="adm-btn-primary"
            onClick={handleExport}
            disabled={exporting || (selectionMode === 'specific' && selectedIds.size === 0)}
            type="button"
          >
            {exporting ? <Loader2 size={15} className="adm-spinner" /> : <Download size={15} />}
            {exporting ? 'Generating...' : `Export ${selectionMode === 'all' ? currentList.length : selectedIds.size} Records`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataExportModal;
