import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { getUserProfile } from '@/services/firebaseService';
import dataManager from '@/services/dataManager';
import i18n from '@/app/i18n';

export type Language = 'en' | 'de';
export type Theme = 'light' | 'dark';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  translations: Record<string, string>;
  user: User | null;
  userProfile: any;
  updateUserProfile: (data: any) => Promise<void>;
  setUser: (user: User | null) => void;
}

const defaultTranslations = {
  en: {
    readMore: 'Read More',
    subscribe: 'Subscribe',
    favorites: 'Favorites',
    profile: 'Profile',
    settings: 'Settings',
    saved: 'Saved',
  },
  de: {
    readMore: 'Weiterlesen',
    subscribe: 'Abonnieren',
    favorites: 'Favoriten',
    profile: 'Profil',
    settings: 'Einstellungen',
    saved: 'Gespeichert',
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme();
  const [language, setLanguage] = useState<Language>('de');
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Load saved preferences
    const loadPreferences = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        const savedLanguage = await AsyncStorage.getItem('language');
        
        if (savedTheme) {
          setTheme(savedTheme as Theme);
        }
        if (savedLanguage) {
          setLanguage(savedLanguage as Language);
          i18n.locale = savedLanguage;
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();

    // Set up Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setIsLoggedIn(true);
        await dataManager.persistAuthState(user);
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } else {
        setUser(null);
        setIsLoggedIn(false);
        await dataManager.clearPersistedAuthState();
        setUserProfile(null);
      }
    });

    // Check for persisted auth state on startup
    const checkPersistedAuth = async () => {
      const persistedUser = await dataManager.getPersistedAuthState();
      if (persistedUser) {
        setUser(persistedUser);
        setIsLoggedIn(true);
        const profile = await getUserProfile(persistedUser.uid);
        setUserProfile(profile);
      }
    };

    checkPersistedAuth();

    return () => unsubscribe();
  }, []);

  // Update theme when system theme changes
  useEffect(() => {
    setTheme(systemTheme === 'dark' ? 'dark' : 'light');
  }, [systemTheme]);

  // Save preferences when they change
  useEffect(() => {
    const savePreferences = async () => {
      try {
        await AsyncStorage.setItem('theme', theme);
        await AsyncStorage.setItem('language', language);
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
    };

    savePreferences();
  }, [theme, language]);

  // Update i18n locale when language changes
  useEffect(() => {
    i18n.locale = language;
  }, [language]);

  const translations = defaultTranslations[language];

  const updateUserProfile = async (data: any) => {
    if (!user) return;
    try {
      // Update profile logic here using Firebase service
      setUserProfile({ ...userProfile, ...data });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    language,
    setLanguage,
    theme,
    setTheme,
    isLoggedIn,
    setIsLoggedIn,
    translations,
    user,
    userProfile,
    updateUserProfile,
    setUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
} 