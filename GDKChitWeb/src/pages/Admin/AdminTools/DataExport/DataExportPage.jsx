import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { makeRequest, safeJson } from '../../../../api/apiClient.js';
import {
  Download, ArrowLeft, FileSpreadsheet, FileJson, Check,
  Search, Users, Layers, Loader2, AlertCircle, RefreshCw, Filter
} from 'lucide-react';
import './DataExportPage.css';

const DataExportPage = () => {
  const navigate = useNavigate();
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
    fetchData();
  }, []);

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
      let filename = `gdk_${exportType}_${new Date().toISOString().slice(0, 10)}.${format}`;

      if (format === 'json') {
        fileData = JSON.stringify(targetData, null, 2);
        mimeType = 'application/json';
      } else {
        mimeType = 'text/csv;charset=utf-8;';
        if (exportType === 'users') {
          const headers = ['ID', 'Name', 'Phone', 'Role', 'Nickname', 'YearOfBirth', 'CreatedAt'];
          const rows = targetData.map(u => [
            u.id || u.user_id || '',
            `"${(u.name || u.username || '').replace(/"/g, '""')}"`,
            `"${u.phone || ''}"`,
            `"${u.role || 'user'}"`,
            `"${(u.nickname || '').replace(/"/g, '""')}"`,
            `"${u.year_of_birth || ''}"`,
            `"${u.created_at || ''}"`
          ]);
          fileData = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        } else {
          const headers = ['ID', 'GroupName', 'TotalMembers', 'GroupAmount', 'DurationMonths', 'Status', 'CreatedAt'];
          const rows = targetData.map(g => [
            g.id || '',
            `"${(g.group_name || g.name || '').replace(/"/g, '""')}"`,
            g.total_members || g.totalMembers || 20,
            g.group_amount || g.groupAmount || 0,
            g.duration || 20,
            `"${g.status || 'Active'}"`,
            `"${g.created_at || ''}"`
          ]);
          fileData = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        }
      }

      const blob = new Blob([fileData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error:', e);
      alert('An error occurred during data compilation.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="dep-page">
      {/* ── HEADER ── */}
      <div className="dep-header">
        <div className="dep-header-left">
          <button
            type="button"
            className="dep-back-btn"
            onClick={() => navigate('/admin/admintool')}
            title="Back to Admin Tools"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="dep-title">Corporate Data Export & Audit Utility</h1>
            <p className="dep-subtitle">Export official records, subscriber directories, and active chit ledger schemes into CSV or JSON</p>
          </div>
        </div>

        <button
          type="button"
          className="dep-refresh-btn"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spin-anim' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {errorMsg && (
        <div className="dep-error-alert">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── MAIN CONFIGURATION GRID ── */}
      <div className="dep-grid">
        {/* Left Card: Controls */}
        <div className="dep-card">
          <h2 className="dep-card-title">1. Export Parameters</h2>

          {/* Dataset Type */}
          <div className="dep-field-group">
            <label className="dep-field-label">Dataset to Export</label>
            <div className="dep-toggle-row">
              <button
                type="button"
                className={`dep-toggle-btn ${exportType === 'users' ? 'active' : ''}`}
                onClick={() => { setExportType('users'); setSelectedIds(new Set()); setSearch(''); }}
              >
                <Users size={16} />
                <span>Subscribers Directory ({users.length})</span>
              </button>
              <button
                type="button"
                className={`dep-toggle-btn ${exportType === 'groups' ? 'active' : ''}`}
                onClick={() => { setExportType('groups'); setSelectedIds(new Set()); setSearch(''); }}
              >
                <Layers size={16} />
                <span>Chit Schemes & Plans ({groups.length})</span>
              </button>
            </div>
          </div>

          {/* File Format */}
          <div className="dep-field-group">
            <label className="dep-field-label">Export Format</label>
            <div className="dep-toggle-row">
              <button
                type="button"
                className={`dep-toggle-btn ${format === 'csv' ? 'active' : ''}`}
                onClick={() => setFormat('csv')}
              >
                <FileSpreadsheet size={16} color="#059669" />
                <span>CSV (Excel Compatible)</span>
              </button>
              <button
                type="button"
                className={`dep-toggle-btn ${format === 'json' ? 'active' : ''}`}
                onClick={() => setFormat('json')}
              >
                <FileJson size={16} color="#2563eb" />
                <span>Structured JSON</span>
              </button>
            </div>
          </div>

          {/* Scope Mode */}
          <div className="dep-field-group">
            <label className="dep-field-label">Record Scope</label>
            <div className="dep-toggle-row">
              <button
                type="button"
                className={`dep-toggle-btn ${selectionMode === 'all' ? 'active' : ''}`}
                onClick={() => setSelectionMode('all')}
              >
                <Check size={16} />
                <span>All Records ({currentList.length})</span>
              </button>
              <button
                type="button"
                className={`dep-toggle-btn ${selectionMode === 'specific' ? 'active' : ''}`}
                onClick={() => setSelectionMode('specific')}
              >
                <Filter size={16} />
                <span>Custom Selection ({selectedIds.size})</span>
              </button>
            </div>
          </div>

          {/* Summary & Trigger */}
          <div className="dep-summary-box">
            <div className="dep-summary-row">
              <span>Selected Scope:</span>
              <strong>{selectionMode === 'all' ? `All ${currentList.length} items` : `${selectedIds.size} customized items`}</strong>
            </div>
            <div className="dep-summary-row">
              <span>File Format:</span>
              <strong style={{ textTransform: 'uppercase' }}>{format}</strong>
            </div>
            <div className="dep-summary-row">
              <span>Target File:</span>
              <code>gdk_{exportType}_{new Date().toISOString().slice(0, 10)}.{format}</code>
            </div>

            <button
              type="button"
              className="dep-download-btn"
              onClick={handleExport}
              disabled={exporting || (selectionMode === 'specific' && selectedIds.size === 0)}
            >
              {exporting ? (
                <>
                  <Loader2 size={18} className="spin-anim" />
                  <span>Preparing Package...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Export File</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Card: Table / Selection Preview */}
        <div className="dep-card dep-preview-card">
          <div className="dep-preview-header">
            <div>
              <h2 className="dep-card-title" style={{ margin: 0 }}>2. Live Record Preview</h2>
              <p className="dep-preview-desc">
                {selectionMode === 'specific'
                  ? 'Check items to include in this custom bundle'
                  : 'Displaying available dataset records'}
              </p>
            </div>

            <div className="dep-search-wrap">
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                placeholder={`Search ${exportType}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="dep-search-input"
              />
            </div>
          </div>

          {selectionMode === 'specific' && (
            <div className="dep-selection-bar">
              <span>{selectedIds.size} of {filteredList.length} items selected</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="dep-select-all-btn"
                  onClick={() => selectAllFiltered(filteredList)}
                >
                  Select Filtered
                </button>
                <button
                  type="button"
                  className="dep-clear-btn"
                  onClick={clearSelection}
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          <div className="dep-table-wrap">
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
                <Loader2 size={32} color="#2563eb" className="spin-anim" style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>Loading dataset records...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                <p style={{ margin: 0, fontSize: 14 }}>No matching records found for "{search}".</p>
              </div>
            ) : (
              <table className="dep-table">
                <thead>
                  <tr>
                    {selectionMode === 'specific' && <th style={{ width: 40 }}>Pick</th>}
                    <th>{exportType === 'users' ? 'Subscriber Name' : 'Plan Name'}</th>
                    <th>{exportType === 'users' ? 'Phone' : 'Pool Amount'}</th>
                    <th>{exportType === 'users' ? 'Role' : 'Total Members'}</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item, idx) => {
                    const id = item.id || item.user_id || idx;
                    const isChecked = selectedIds.has(id);
                    return (
                      <tr
                        key={id}
                        className={isChecked ? 'selected-row' : ''}
                        onClick={() => selectionMode === 'specific' && toggleSelect(id)}
                        style={{ cursor: selectionMode === 'specific' ? 'pointer' : 'default' }}
                      >
                        {selectionMode === 'specific' && (
                          <td>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelect(id)}
                              onClick={e => e.stopPropagation()}
                            />
                          </td>
                        )}
                        <td>
                          <strong>{exportType === 'users' ? (item.name || item.username || 'Member') : (item.group_name || item.name)}</strong>
                        </td>
                        <td>
                          {exportType === 'users' ? item.phone || '--' : `₹${Number(item.group_amount || item.groupAmount || 0).toLocaleString('en-IN')}`}
                        </td>
                        <td>
                          {exportType === 'users' ? (item.role || 'user').toUpperCase() : `${item.total_members || item.totalMembers || 20} Members`}
                        </td>
                        <td>
                          <span className="dep-status-pill">
                            {exportType === 'users' ? 'Active' : (item.status || 'Active')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExportPage;
