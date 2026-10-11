import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, ArrowLeft, Check, Sparkles } from 'lucide-react';
import './ProfilePages.css';

const LanguageSettings = () => {
  const navigate = useNavigate();
  const [selectedLang, setSelectedLang] = useState(
    localStorage.getItem('app_language') || 'en'
  );
  const [saved, setSaved] = useState(false);

  const handleSelect = (lang) => {
    setSelectedLang(lang);
    localStorage.setItem('app_language', lang);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="pp-container">
      <div className="pp-header">
        <button className="pp-back-btn" onClick={() => navigate('/user/profile')}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="pp-title">Language & Regional Preferences</h2>
          <p className="pp-subtitle">
            Choose your preferred language for navigating the GDK Chit Fund portal.
          </p>
        </div>
      </div>

      <div className="pp-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* English */}
          <div
            onClick={() => handleSelect('en')}
            style={{
              padding: '20px 24px',
              borderRadius: 'var(--radius)',
              border: `2px solid ${selectedLang === 'en' ? 'var(--primary)' : 'var(--border)'}`,
              background: selectedLang === 'en' ? 'var(--primary-light)' : 'var(--surface2)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>English</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Standard international interface</div>
            </div>
            {selectedLang === 'en' && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={16} />
              </div>
            )}
          </div>

          {/* Tamil */}
          <div
            onClick={() => handleSelect('ta')}
            style={{
              padding: '20px 24px',
              borderRadius: 'var(--radius)',
              border: `2px solid ${selectedLang === 'ta' ? 'var(--primary)' : 'var(--border)'}`,
              background: selectedLang === 'ta' ? 'var(--primary-light)' : 'var(--surface2)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>தமிழ் (Tamil)</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>தமிழ் பதிப்பு (Tamil Regional Interface)</div>
            </div>
            {selectedLang === 'ta' && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={16} />
              </div>
            )}
          </div>
        </div>

        {saved && (
          <div
            style={{
              marginTop: 20,
              padding: 12,
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius)',
              color: '#065f46',
              fontSize: 13.5,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            Language preference updated successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSettings;
