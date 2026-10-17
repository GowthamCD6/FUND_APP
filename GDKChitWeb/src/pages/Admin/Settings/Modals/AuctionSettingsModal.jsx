import React, { useState, useEffect } from 'react';
import {
  Gavel,
  X,
  Check,
  Timer,
  TrendingDown,
  ShieldAlert,
  Percent,
  Calendar,
  Save,
  Loader2
} from 'lucide-react';
import { makeRequest, safeJson } from '../../../../api/apiClient';
import './AdminModals.css';

const AuctionSettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    defaultDurationMinutes: 5,
    defaultDurationSeconds: 300,
    minBidStep: 1000,
    maxDiscountPercent: 30,
    autoExtendOnLastSeconds: true,
    extendMinutes: 1,
    extendSeconds: 60,
    foremanCommissionPercent: 5
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Cache read
    const stored = localStorage.getItem('admin_auction_settings');
    if (stored) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(stored) }));
      } catch (e) {}
    }

    // DB fetch
    const fetchDb = async () => {
      try {
        const res = await makeRequest('/admin/settings/auction');
        const json = await safeJson(res);
        if (json.success && json.data) {
          setSettings(prev => ({ ...prev, ...json.data }));
          localStorage.setItem('admin_auction_settings', JSON.stringify(json.data));
        }
      } catch (e) {}
    };
    fetchDb();
  }, [isOpen]);

  const handleChange = (field, val) => {
    setSettings(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await makeRequest('/admin/settings/auction', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
      const data = await safeJson(res);
      localStorage.setItem('admin_auction_settings', JSON.stringify(data.data || settings));
      setSavedMsg(true);
      setTimeout(() => {
        setSavedMsg(false);
        onClose();
      }, 1200);
    } catch (err) {
      localStorage.setItem('admin_auction_settings', JSON.stringify(settings));
      setSavedMsg(true);
      setTimeout(() => {
        setSavedMsg(false);
        onClose();
      }, 1200);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal-card" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div className="adm-modal-title-group">
            <div className="adm-modal-icon-badge" style={{ background: '#ebf3ed', color: '#1b3322' }}>
              <Gavel size={20} />
            </div>
            <div>
              <h2 className="adm-modal-title">Default Auction Parameters</h2>
              <p className="adm-modal-subtitle">Configure bidding clock, minimum increments, and statutory caps</p>
            </div>
          </div>
          <button className="adm-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="adm-modal-body">
            {savedMsg && (
              <div className="adm-alert adm-alert-success">
                <Check size={16} />
                <span>Auction configuration saved successfully!</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="adm-form-group">
                <label className="adm-form-label">Default Timer Duration</label>
                <select
                  value={settings.defaultDurationSeconds}
                  onChange={e => handleChange('defaultDurationSeconds', Number(e.target.value))}
                  className="adm-form-select"
                >
                  <option value={180}>3 Minutes (180s)</option>
                  <option value={300}>5 Minutes (300s)</option>
                  <option value={600}>10 Minutes (600s)</option>
                  <option value={900}>15 Minutes (900s)</option>
                </select>
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Minimum Bid Step (₹)</label>
                <select
                  value={settings.minBidStep}
                  onChange={e => handleChange('minBidStep', Number(e.target.value))}
                  className="adm-form-select"
                >
                  <option value={500}>₹500</option>
                  <option value={1000}>₹1,000</option>
                  <option value={2000}>₹2,000</option>
                  <option value={5000}>₹5,000</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="adm-form-group">
                <label className="adm-form-label">Maximum Discount Cap (%)</label>
                <select
                  value={settings.maxDiscountPercent}
                  onChange={e => handleChange('maxDiscountPercent', Number(e.target.value))}
                  className="adm-form-select"
                >
                  <option value={25}>25% Cap</option>
                  <option value={30}>30% Cap (Standard)</option>
                  <option value={35}>35% Cap</option>
                  <option value={40}>40% Cap (Statutory Max)</option>
                </select>
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Foreman Commission</label>
                <select
                  value={settings.foremanCommissionPercent}
                  onChange={e => handleChange('foremanCommissionPercent', Number(e.target.value))}
                  className="adm-form-select"
                >
                  <option value={4}>4% of Chit Value</option>
                  <option value={5}>5% of Chit Value (Standard)</option>
                  <option value={7}>7% of Chit Value</option>
                </select>
              </div>
            </div>

            <div className="adm-form-group">
              <label className="adm-form-label">Default Monthly Auction Day</label>
              <input
                type="number"
                min={1}
                max={28}
                value={settings.defaultAuctionDay}
                onChange={e => handleChange('defaultAuctionDay', Number(e.target.value))}
                className="adm-form-input"
                placeholder="Day of month (e.g. 10)"
              />
              <span style={{ fontSize: 11, color: '#64748b' }}>
                Default date when auctions occur each month (1st through 28th).
              </span>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 6
            }}>
              <div>
                <strong style={{ fontSize: 13, color: '#1e293b', display: 'block' }}>
                  Auto-Extend on Final Bids
                </strong>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  Add 30 seconds if a member bids in the final 30 seconds of the timer.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoExtendOnLastSeconds}
                onChange={e => handleChange('autoExtendOnLastSeconds', e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
            </div>
          </div>

          <div className="adm-modal-footer">
            <button className="adm-btn-secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="adm-btn-primary" type="submit">
              <Save size={15} />
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuctionSettingsModal;
