import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from './translations';
import ApiService from '../services/ApiService';

import useLanguageStore from '../store/useLanguageStore';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const adminLanguage = useLanguageStore((state) => state.adminLanguage);
  const setAdminLanguage = useLanguageStore((state) => state.setAdminLanguage);
  const isLoaded = useLanguageStore((state) => state.isLoaded);
  const storeT = useLanguageStore((state) => state.t);

  const setLanguage = useCallback(async (lang) => {
    await setAdminLanguage(lang);
  }, [setAdminLanguage]);

  const t = useCallback((englishText) => {
    return storeT(englishText, 'admin');
  }, [storeT]);

  const value = {
    language: adminLanguage,
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
