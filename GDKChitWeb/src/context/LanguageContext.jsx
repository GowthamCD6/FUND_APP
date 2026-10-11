import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import translations from '../utils/translations/index.js';
import { makeRequest, safeJson } from '../api/apiClient.js';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'app_language';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  });

  // Keep in sync if another tab changes localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'en' || e.newValue === 'ta')) {
        setLanguageState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync preference with backend if logged in
  useEffect(() => {
    const syncBackend = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await makeRequest('/user/preferences');
        const data = await safeJson(res);
        if (data?.success && data.data?.language) {
          const dbLang = data.data.language;
          if ((dbLang === 'en' || dbLang === 'ta') && dbLang !== language) {
            setLanguageState(dbLang);
            localStorage.setItem(STORAGE_KEY, dbLang);
          }
        }
      } catch (e) {
        // Silent catch for guest or offline mode
      }
    };
    syncBackend();
  }, []);

  const changeLanguage = useCallback(async (lang) => {
    if (lang !== 'en' && lang !== 'ta') return;
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);

    // Broadcast custom event so listeners can update immediately
    window.dispatchEvent(new Event('languagechange'));

    // Optionally sync with backend
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await makeRequest('/user/preferences', {
          method: 'PUT',
          body: JSON.stringify({ language: lang }),
        });
      }
    } catch (e) {
      // Non-blocking
    }
  }, []);

  // Translation helper function `t`
  const t = useCallback(
    (text) => {
      if (!text) return '';
      if (language === 'en') return text;
      const dict = translations.ta || {};
      return dict[text] || text;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      changeLanguage,
      t,
      isTamil: language === 'ta',
    }),
    [language, changeLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};

export default LanguageContext;
