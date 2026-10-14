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
  const userLanguage = useLanguageStore((state) => state.userLanguage);
  const setAdminLanguage = useLanguageStore((state) => state.setAdminLanguage);
  const setUserLanguage = useLanguageStore((state) => state.setUserLanguage);
  const isLoaded = useLanguageStore((state) => state.isLoaded);
  const storeT = useLanguageStore((state) => state.t);
  const [activeRole, setActiveRole] = useState('user');

  useEffect(() => {
    const detectRole = async () => {
      try {
        const role = await AsyncStorage.getItem('userRole');
        if (role && role.toLowerCase() === 'admin') {
          setActiveRole('admin');
        } else {
          setActiveRole('user');
        }
      } catch (e) {
        setActiveRole('user');
      }
    };
    detectRole();
  }, []);

  const setLanguage = useCallback(async (lang, targetRole = null) => {
    const roleToSet = targetRole || activeRole;
    if (roleToSet === 'admin') {
      await setAdminLanguage(lang);
    } else {
      await setUserLanguage(lang);
    }
  }, [activeRole, setAdminLanguage, setUserLanguage]);

  const t = useCallback((englishText, overrideRole = null) => {
    // If overrideRole is specified, use that; otherwise use active role (default 'user')
    const roleToUse = overrideRole || activeRole;
    return storeT(englishText, roleToUse);
  }, [storeT, activeRole]);

  // Current language is based on active role
  const currentLanguage = activeRole === 'admin' ? adminLanguage : userLanguage;

  const value = {
    language: currentLanguage,
    adminLanguage,
    userLanguage,
    setLanguage,
    setUserLanguage,
    setAdminLanguage,
    t,
    isLoaded,
    setActiveRole,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
