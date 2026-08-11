import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from '../utils/translations';
import ApiService from '../services/ApiService';

const ADMIN_LANG_KEY = 'adminLanguage';
const USER_LANG_KEY = 'appLanguage';

export const useLanguageStore = create((set, get) => ({
  adminLanguage: 'en',
  userLanguage: 'en',
  isLoaded: false,

  // Load language settings for both Admin and User roles
  loadLanguages: async () => {
    try {
      const savedAdminLang = await AsyncStorage.getItem(ADMIN_LANG_KEY);
      const savedUserLang = await AsyncStorage.getItem(USER_LANG_KEY);
      
      let adminLang = savedAdminLang && (savedAdminLang === 'en' || savedAdminLang === 'ta') ? savedAdminLang : 'en';
      let userLang = savedUserLang && (savedUserLang === 'en' || savedUserLang === 'ta') ? savedUserLang : 'en';

      // Sync with backend API user preferences
      try {
        const token = await ApiService.getAccessToken();
        if (token) {
          const res = await ApiService.getUserPreferences();
          if (res?.success && res.data?.language) {
            const dbLang = res.data.language;
            if (dbLang === 'en' || dbLang === 'ta') {
              adminLang = dbLang;
              userLang = dbLang;
              await AsyncStorage.setItem(ADMIN_LANG_KEY, dbLang);
              await AsyncStorage.setItem(USER_LANG_KEY, dbLang);
            }
          }
        }
      } catch (err) {
        console.log('useLanguageStore: Backend sync error:', err.message);
      }

      set({
        adminLanguage: adminLang,
        userLanguage: userLang,
        isLoaded: true,
      });
    } catch (error) {
      console.error('Failed to load language preferences in store:', error);
      set({ isLoaded: true });
    }
  },

  // Set Admin language (Zustand + AsyncStorage + Backend API Sync)
  setAdminLanguage: async (lang) => {
    try {
      set({ adminLanguage: lang });
      await AsyncStorage.setItem(ADMIN_LANG_KEY, lang);

      const token = await ApiService.getAccessToken();
      if (token) {
        ApiService.updateUserPreferences({ language: lang }).catch(err => {
          console.error('Failed to sync admin language to backend:', err);
        });
      }
    } catch (error) {
      console.error('Failed to save admin language preference:', error);
    }
  },

  // Set User language (Zustand + AsyncStorage + Backend API Sync)
  setUserLanguage: async (lang) => {
    try {
      set({ userLanguage: lang });
      await AsyncStorage.setItem(USER_LANG_KEY, lang);

      const token = await ApiService.getAccessToken();
      if (token) {
        ApiService.updateUserPreferences({ language: lang }).catch(err => {
          console.error('Failed to sync user language to backend:', err);
        });
      }
    } catch (error) {
      console.error('Failed to save user language preference:', error);
    }
  },

  // Helper for translating English text to selected role language
  t: (englishText, role = 'admin') => {
    const lang = role === 'user' ? get().userLanguage : get().adminLanguage;
    if (lang === 'en') return englishText;
    const tamilDict = translations.ta || {};
    return tamilDict[englishText] || englishText;
  },
}));

// Auto-load store on module import
useLanguageStore.getState().loadLanguages();

export default useLanguageStore;
