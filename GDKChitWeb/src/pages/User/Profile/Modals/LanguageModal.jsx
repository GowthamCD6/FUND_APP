import React, { useState, useEffect } from 'react';
import { makeRequest } from '../../../../api/apiClient.js';
import { Languages, X, Check, Globe } from 'lucide-react';
import './ProfileModals.css';

const LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    description: 'Standard English interface for all Chit Fund services',
    isDefault: true
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    description: 'முழுமையான தமிழ் மொழி இடைமுகம் மற்றும் அறிவிப்புகள்',
    isDefault: false
  }
];

const LanguageModal = ({ isOpen, onClose, onLanguageChanged }) => {
  const [selectedLang, setSelectedLang] = useState('en');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const stored = localStorage.getItem('app_language') || 'en';
    setSelectedLang(stored);
  }, [isOpen]);

  const handleSelect = async (code) => {
    setSelectedLang(code);
    setSaving(true);
    localStorage.setItem('app_language', code);

    // Save to user preferences if logged in
    try {
      await makeRequest('/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: code })
      });
    } catch (e) {
      // Non-blocking preference sync
    }

    setSaving(false);
    if (onLanguageChanged) {
      onLanguageChanged(code);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="prof-modal-backdrop" onClick={onClose}>
      <div className="prof-modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="prof-modal-header">
          <div className="prof-modal-title-group">
            <div className="prof-modal-icon-badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Languages size={20} />
            </div>
            <div>
              <h2 className="prof-modal-title">Language Preferences</h2>
              <p className="prof-modal-subtitle">Choose your preferred application language</p>
            </div>
          </div>
          <button className="prof-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="prof-modal-body">
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
            Select the primary language for your dashboard, chit contracts, notices, and payment receipts.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <div
                  key={lang.code}
                  onClick={() => handleSelect(lang.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    background: isSelected ? '#f8faff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      fontSize: 24,
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: isSelected ? '#eff6ff' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {lang.flag}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                          {lang.name}
                        </span>
                        <span style={{ fontSize: 13, color: '#64748b' }}>
                          ({lang.nativeName})
                        </span>
                        {lang.isDefault && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: '#e2e8f0',
                            color: '#475569',
                            padding: '2px 6px',
                            borderRadius: 4
                          }}>
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                        {lang.description}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: isSelected ? '2px solid #2563eb' : '2px solid #cbd5e1',
                    background: isSelected ? '#2563eb' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff'
                  }}>
                    {isSelected && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="prof-modal-footer">
          <button className="prof-btn-primary" onClick={onClose} style={{ width: '100%' }}>
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageModal;
