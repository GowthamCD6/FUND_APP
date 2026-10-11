import React, { useState, useEffect } from 'react';
import { makeRequest } from '../../../../api/apiClient.js';
import { Languages, X, Check } from 'lucide-react';
import './AdminModals.css';

const LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    description: 'Executive English interface for financial reporting & auctions',
    isDefault: true
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    description: 'முழுமையான தமிழ் நிர்வாக இடைமுகம் மற்றும் அறிவிப்புகள்',
    isDefault: false
  }
];

const AdminLanguageModal = ({ isOpen, onClose, onLanguageChanged }) => {
  const [selectedLang, setSelectedLang] = useState('en');

  useEffect(() => {
    if (!isOpen) return;
    const stored = localStorage.getItem('app_language') || 'en';
    setSelectedLang(stored);
  }, [isOpen]);

  const handleSelect = async (code) => {
    setSelectedLang(code);
    localStorage.setItem('app_language', code);

    try {
      await makeRequest('/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: code })
      });
    } catch (e) {}

    if (onLanguageChanged) {
      onLanguageChanged(code);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal-card" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <div className="adm-modal-title-group">
            <div className="adm-modal-icon-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Languages size={20} />
            </div>
            <div>
              <h2 className="adm-modal-title">Admin Language Settings</h2>
              <p className="adm-modal-subtitle">Choose interface language for the admin portal</p>
            </div>
          </div>
          <button className="adm-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="adm-modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {LANGUAGES.map(lang => {
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
                    border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                    background: isSelected ? '#f0fdf4' : '#ffffff',
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
                      background: isSelected ? '#dcfce7' : '#f1f5f9',
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
                    border: isSelected ? '2px solid #059669' : '2px solid #cbd5e1',
                    background: isSelected ? '#059669' : 'transparent',
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

        <div className="adm-modal-footer">
          <button className="adm-btn-primary" onClick={onClose} style={{ width: '100%' }}>
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLanguageModal;
