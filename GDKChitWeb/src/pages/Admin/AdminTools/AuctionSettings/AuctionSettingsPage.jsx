import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gavel, ArrowLeft, Check, Timer, TrendingDown, ShieldAlert,
  Percent, Save, RotateCcw, AlertCircle, Info, Zap
} from 'lucide-react';
import './AuctionSettingsPage.css';

const DEFAULT_AUCTION_CONFIG = {
  defaultDurationMinutes: 5,
  defaultDurationSeconds: 300,
  minBidStep: 1000,
  maxDiscountPercent: 30,
  autoExtendOnLastSeconds: true,
  extendMinutes: 1,
  extendSeconds: 60,
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
        const parsed = JSON.parse(stored);
        const mins = parsed.defaultDurationMinutes || Math.round((parsed.defaultDurationSeconds || 300) / 60);
        const extMins = parsed.extendMinutes || (parsed.extendSeconds ? Math.max(1, Math.round(parsed.extendSeconds / 60)) : 1);
        setSettings({
          ...DEFAULT_AUCTION_CONFIG,
          ...parsed,
          defaultDurationMinutes: mins,
          defaultDurationSeconds: mins * 60,
          extendMinutes: extMins,
          extendSeconds: extMins * 60
        });
      } catch (e) {}
    }
  }, []);

  const handleChange = (field, val) => {
    setSettings(prev => ({ ...prev, [field]: val }));
    setIsDirty(true);
  };

  const handleDurationMinutesChange = (mins) => {
    const validMins = Math.max(1, Math.min(60, mins));
    setSettings(prev => ({
      ...prev,
      defaultDurationMinutes: validMins,
      defaultDurationSeconds: validMins * 60
    }));
    setIsDirty(true);
  };

  const handleExtendMinutesChange = (mins) => {
    const validMins = Math.max(1, Math.min(10, mins));
    setSettings(prev => ({
      ...prev,
      extendMinutes: validMins,
      extendSeconds: validMins * 60
    }));
    setIsDirty(true);
  };

  const handleSave = (e) => {
    e.preventDefault();

    const durationMins = settings.defaultDurationMinutes || Math.round(settings.defaultDurationSeconds / 60);
    if (durationMins < 1 || durationMins > 60) {
      alert('Auction duration must be between 1 minute and 60 minutes.');
      return;
    }
    const extMins = settings.extendMinutes || Math.max(1, Math.round((settings.extendSeconds || 60) / 60));
    if (settings.autoExtendOnLastSeconds && (extMins < 1 || extMins > 10)) {
      alert('Dynamic clock extension must be between 1 minute and 10 minutes.');
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

    const payload = {
      ...settings,
      defaultDurationMinutes: durationMins,
      defaultDurationSeconds: durationMins * 60,
      extendMinutes: extMins,
      extendSeconds: extMins * 60
    };

    localStorage.setItem('admin_auction_settings', JSON.stringify(payload));
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
                Default Auction Duration (Minutes)
                <span className="asp-hint">{(settings.defaultDurationMinutes || 5) * 60} seconds total</span>
              </label>
              <div className="asp-input-wrapper">
                <input
                  type="number"
                  min="1"
                  max="60"
                  step="1"
                  className="asp-input"
                  value={settings.defaultDurationMinutes || 5}
                  onChange={e => handleDurationMinutesChange(Number(e.target.value))}
                />
                <span className="asp-unit-tag">min</span>
              </div>
              <div className="asp-preset-pills">
                {[3, 5, 10, 15, 20, 30].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    className={`asp-pill ${(settings.defaultDurationMinutes || 5) === mins ? 'active' : ''}`}
                    onClick={() => handleDurationMinutesChange(mins)}
                  >
                    {mins} mins {mins === 5 ? '(Standard)' : ''}
                  </button>
                ))}
              </div>
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
                  <p>Extends remaining timer by {settings.extendMinutes || 1} min ({((settings.extendMinutes || 1) * 60)}s) if a bid is placed in closing minutes</p>
                </div>
              </label>
            </div>

            {settings.autoExtendOnLastSeconds && (
              <div className="asp-field">
                <label className="asp-label">
                  Extension Duration (Minutes)
                  <span className="asp-hint">+{(settings.extendMinutes || 1) * 60} seconds per late bid</span>
                </label>
                <div className="asp-input-wrapper">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    className="asp-input"
                    value={settings.extendMinutes || 1}
                    onChange={e => handleExtendMinutesChange(Number(e.target.value))}
                  />
                  <span className="asp-unit-tag">min</span>
                </div>
                <div className="asp-preset-pills">
                  {[1, 2, 3, 5].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      className={`asp-pill ${(settings.extendMinutes || 1) === mins ? 'active' : ''}`}
                      onClick={() => handleExtendMinutesChange(mins)}
                    >
                      +{mins} min{mins > 1 ? 's' : ''} {mins === 1 ? '(Standard)' : ''}
                    </button>
                  ))}
                </div>
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
            {/* Minimum Bid Step */}
            <div className="asp-field">
              <label className="asp-label">
                Minimum Bid Decrement Step (₹)
                <span className="asp-hint">Smallest reduction permitted per bid</span>
              </label>
              <div className="asp-input-wrapper">
                <input
                  type="number"
                  min="100"
                  step="100"
                  className="asp-input"
                  value={settings.minBidStep}
                  onChange={e => handleChange('minBidStep', Number(e.target.value))}
                />
                <span className="asp-unit-tag">₹</span>
              </div>
              <div className="asp-preset-pills">
                {[500, 1000, 2000, 5000].map(step => (
                  <button
                    key={step}
                    type="button"
                    className={`asp-pill ${settings.minBidStep === step ? 'active' : ''}`}
                    onClick={() => handleChange('minBidStep', step)}
                  >
                    ₹{step.toLocaleString('en-IN')} {step === 1000 ? '(Standard)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Foreman Commission */}
            <div className="asp-field">
              <label className="asp-label">
                Statutory Foreman Commission (%)
                <span className="asp-hint">Under Chit Funds Act 1982 (Standard: 5%)</span>
              </label>
              <div className="asp-input-wrapper">
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  className="asp-input"
                  value={settings.foremanCommissionPercent}
                  onChange={e => handleChange('foremanCommissionPercent', Number(e.target.value))}
                />
                <span className="asp-unit-tag">%</span>
              </div>
              <div className="asp-preset-pills">
                {[4, 5, 7, 10].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    className={`asp-pill ${settings.foremanCommissionPercent === pct ? 'active' : ''}`}
                    onClick={() => handleChange('foremanCommissionPercent', pct)}
                  >
                    {pct}% {pct === 5 ? '(Statutory Std)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Maximum Bid Discount */}
            <div className="asp-field">
              <label className="asp-label">
                Maximum Bid Discount Ceiling (%)
                <span className="asp-hint">Maximum allowable discount bid ({settings.maxDiscountPercent}%)</span>
              </label>
              <div className="asp-input-wrapper">
                <input
                  type="number"
                  min="5"
                  max="40"
                  step="1"
                  className="asp-input"
                  value={settings.maxDiscountPercent}
                  onChange={e => handleChange('maxDiscountPercent', Math.max(5, Math.min(40, Number(e.target.value))))}
                />
                <span className="asp-unit-tag">%</span>
              </div>
              <div className="asp-preset-pills">
                {[20, 25, 30, 35, 40].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    className={`asp-pill ${settings.maxDiscountPercent === pct ? 'active' : ''}`}
                    onClick={() => handleChange('maxDiscountPercent', pct)}
                  >
                    {pct}% {pct === 30 ? '(Standard)' : pct === 40 ? '(Statutory Max)' : ''}
                  </button>
                ))}
              </div>

              {/* Live Calculation Preview */}
              <div className="asp-calc-preview">
                <div className="asp-calc-title">
                  <span>💡 Live Calculation Preview (Example on ₹1,00,000 Scheme)</span>
                </div>
                <div className="asp-calc-grid">
                  <div className="asp-calc-item">
                    <span className="asp-calc-label">Max Bid Discount</span>
                    <span className="asp-calc-value">₹{Math.round((100000 * (settings.maxDiscountPercent || 30)) / 100).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="asp-calc-item">
                    <span className="asp-calc-label">Min Prize Money</span>
                    <span className="asp-calc-value highlight">₹{Math.round(100000 - (100000 * (settings.maxDiscountPercent || 30)) / 100).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="asp-calc-item">
                    <span className="asp-calc-label">Est. Dividend Pool</span>
                    <span className="asp-calc-value">₹{Math.round(Math.max(0, (100000 * (settings.maxDiscountPercent || 30)) / 100 - (100000 * (settings.foremanCommissionPercent || 5)) / 100)).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AuctionSettingsPage;
