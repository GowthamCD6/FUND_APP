import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from './translations';
import ApiService from '../services/ApiService';

const LanguageContext = createContext();

const LANGUAGE_STORAGE_KEY = 'appLanguage';

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en'); // Default is English
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved language preference on mount (Local + Backend sync)
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ta')) {
          setLanguageState(savedLanguage);
        }

        // Try syncing from backend DB if logged in
        const token = await ApiService.getAccessToken();
        if (token) {
          const res = await ApiService.getUserPreferences();
          if (res?.success && res.data?.language) {
            const dbLang = res.data.language;
            if (dbLang === 'en' || dbLang === 'ta') {
              setLanguageState(dbLang);
              await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, dbLang);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load language preference:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadLanguage();
  }, []);

  // Set language and persist to AsyncStorage + Backend DB
  const setLanguage = useCallback(async (lang) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);

      // Sync to backend DB asynchronously
      const token = await ApiService.getAccessToken();
      if (token) {
        ApiService.updateUserPreferences({ language: lang }).catch(err => {
          console.error('Failed to sync language to backend:', err);
        });
      }
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  }, []);

  // Translation function
  // When language is 'en', returns the original English text as-is (no changes)
  // When language is 'ta', looks up Tamil translation; falls back to English if not found
  const t = useCallback((englishText) => {
    if (language === 'en') {
      return englishText; // English - return original text unchanged
    }

    // Tamil - look up translation
    const tamilTranslations = translations.ta;
    if (tamilTranslations && tamilTranslations[englishText]) {
      return tamilTranslations[englishText];
    }

    // Fallback to English if no Tamil translation found
    return englishText;
  }, [language]);

  const value = {
    language,
    setLanguage,
    t,
    isLoaded,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
