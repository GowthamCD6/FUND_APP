import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gavel, ArrowLeft, Check, Timer, TrendingDown, ShieldAlert,
  Percent, Calendar, Save, RotateCcw, AlertCircle, Info, Zap
} from 'lucide-react';
import './AuctionSettingsPage.css';

const DEFAULT_AUCTION_CONFIG = {
  defaultDurationSeconds: 300,
  minBidStep: 1000,
  maxDiscountPercent: 30,
  autoExtendOnLastSeconds: true,
  extendSeconds: 30,
  defaultAuctionDay: 10,
  foremanCommissionPercent: 5
};

const AuctionSettingsPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(DEFAULT_AUCTION_CONFIG);
  const [savedMsg, setSavedMsg] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('admin_auction_settings');
    if (stored) {
      try {
        setSettings({ ...DEFAULT_AUCTION_CONFIG, ...JSON.parse(stored) });
      } catch (e) {}
    }
  }, []);

  const handleChange = (field, val) => {
    setSettings(prev => ({ ...prev, [field]: val }));
    setIsDirty(true);
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (settings.defaultDurationSeconds < 60 || settings.defaultDurationSeconds > 3600) {
      alert('Auction duration must be between 60 seconds (1 min) and 3600 seconds (60 mins).');
      return;
    }
    if (settings.minBidStep < 100) {
      alert('Minimum bid decrement step cannot be less than ₹100.');
      return;
    }
    if (settings.foremanCommissionPercent < 1 || settings.foremanCommissionPercent > 10) {
      alert('Statutory Foreman Commission must be between 1% and 10%.');
      return;
    }
    if (settings.maxDiscountPercent < 5 || settings.maxDiscountPercent > 40) {
      alert('Maximum permissible discount cap must be between 5% and 40%.');
      return;
    }

    localStorage.setItem('admin_auction_settings', JSON.stringify(settings));
    setSavedMsg(true);
    setIsDirty(false);
    setTimeout(() => {
      setSavedMsg(false);
    }, 2500);
  };

  const handleReset = () => {
    if (window.confirm('Reset auction parameters to factory defaults?')) {
      setSettings(DEFAULT_AUCTION_CONFIG);
      localStorage.setItem('admin_auction_settings', JSON.stringify(DEFAULT_AUCTION_CONFIG));
      setIsDirty(false);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    }
  };

  return (
    <div className="asp-page">
      {/* ── HEADER ── */}
      <div className="asp-header">
        <div className="asp-header-left">
          <button
            type="button"
            className="asp-back-btn"
            onClick={() => navigate('/admin/admintool')}
            title="Back to Admin Tools"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="asp-title">Reverse Auction Engine Configuration</h1>
            <p className="asp-subtitle">Set global bidding parameters, time extensions, foreman commission rate, and dividend limits</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="asp-reset-btn"
            onClick={handleReset}
          >
            <RotateCcw size={15} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            className="asp-save-btn"
            onClick={handleSave}
          >
            {savedMsg ? <Check size={16} /> : <Save size={16} />}
            <span>{savedMsg ? 'Saved Changes!' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {savedMsg && (
        <div className="asp-success-banner">
          <Check size={18} />
          <span>Auction engine parameters updated and synced to live bidding portal!</span>
        </div>
      )}

      {/* ── FORM SECTIONS ── */}
      <form onSubmit={handleSave} className="asp-form-grid">
        {/* Card 1: Bidding & Time Parameters */}
        <div className="asp-card">
          <div className="asp-card-header">
            <div className="asp-icon-badge" style={{ background: '#ebf3ed', color: '#1b3322' }}>
              <Timer size={20} />
            </div>
            <div>
              <h2 className="asp-card-title">Timing & Extension Engine</h2>
              <p className="asp-card-desc">Duration and anti-sniping dynamic clock extensions</p>
            </div>
          </div>

          <div className="asp-form-body">
            <div className="asp-field">
              <label className="asp-label">
                Default Auction Duration (Seconds)
                <span className="asp-hint">{Math.round(settings.defaultDurationSeconds / 60)} minutes total</span>
              </label>
              <input
                type="number"
                min="60"
                max="3600"
                step="30"
                className="asp-input"
                value={settings.defaultDurationSeconds}
                onChange={e => handleChange('defaultDurationSeconds', Number(e.target.value))}
              />
            </div>

            <div className="asp-field">
              <label className="asp-checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.autoExtendOnLastSeconds}
                  onChange={e => handleChange('autoExtendOnLastSeconds', e.target.checked)}
                />
                <div>
                  <strong>Enable Dynamic Clock Extension (Anti-Sniping)</strong>
                  <p>Extends remaining timer if a bid is placed in final 15 seconds</p>
                </div>
              </label>
            </div>

            {settings.autoExtendOnLastSeconds && (
              <div className="asp-field">
                <label className="asp-label">Extension Duration (Seconds)</label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  className="asp-input"
                  value={settings.extendSeconds}
                  onChange={e => handleChange('extendSeconds', Number(e.target.value))}
                />
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Financial & Commission Rules */}
        <div className="asp-card">
          <div className="asp-card-header">
            <div className="asp-icon-badge" style={{ background: '#f0fdf4', color: '#2e7d32' }}>
              <Percent size={20} />
            </div>
            <div>
              <h2 className="asp-card-title">Financial & Commission Rules</h2>
              <p className="asp-card-desc">Statutory Foreman commission and minimum bid decrements</p>
            </div>
          </div>

          <div className="asp-form-body">
            <div className="asp-field">
              <label className="asp-label">
                Minimum Bid Decrement Step (₹)
                <span className="asp-hint">Smallest reduction permitted per bid</span>
              </label>
              <input
                type="number"
                min="100"
                step="100"
                className="asp-input"
                value={settings.minBidStep}
                onChange={e => handleChange('minBidStep', Number(e.target.value))}
              />
            </div>

            <div className="asp-field">
              <label className="asp-label">
                Statutory Foreman Commission (%)
                <span className="asp-hint">Under Chit Funds Act 1982 (Standard: 5%)</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                step="0.5"
                className="asp-input"
                value={settings.foremanCommissionPercent}
                onChange={e => handleChange('foremanCommissionPercent', Number(e.target.value))}
              />
            </div>

            <div className="asp-field">
              <label className="asp-label">
                Maximum Permissible Discount Ceiling (%)
                <span className="asp-hint">Maximum bid discount allowed (Cap: 30%)</span>
              </label>
              <input
                type="number"
                min="5"
                max="40"
                className="asp-input"
                value={settings.maxDiscountPercent}
                onChange={e => handleChange('maxDiscountPercent', Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Cycle Scheduling */}
        <div className="asp-card" style={{ gridColumn: '1 / -1' }}>
          <div className="asp-card-header">
            <div className="asp-icon-badge" style={{ background: '#fdf6f0', color: '#a3704c' }}>
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="asp-card-title">Recurring Monthly Cycle Schedules</h2>
              <p className="asp-card-desc">Default day of month assigned for reverse auctions</p>
            </div>
          </div>

          <div className="asp-form-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div className="asp-field">
              <label className="asp-label">Default Monthly Auction Date</label>
              <select
                className="asp-input"
                value={settings.defaultAuctionDay}
                onChange={e => handleChange('defaultAuctionDay', Number(e.target.value))}
              >
                {Array.from({ length: 28 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}th of every month
                  </option>
                ))}
              </select>
            </div>

            <div className="asp-info-note">
              <Info size={16} color="#1b3322" />
              <span>
                These rules are propagated automatically to the live WebSocket engine during reverse auction sessions.
                Individual scheme rules can override these defaults if explicitly configured during group creation.
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AuctionSettingsPage;
