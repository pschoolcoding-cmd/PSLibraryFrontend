import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  I18nProvider,
  useI18n,
  LANG_STORAGE_KEY,
  normalizeLangCode,
  getInitialLangCode
} from './I18nContext';

const ThemeContext = createContext(null);

export const THEME_STORAGE_KEY = 'ps_library_theme';
const LEGACY_CATALOG_THEME_KEY = 'ps_library_catalog_theme_v1';
const SHELVES_STORAGE_KEY = 'ps_library_shelves';

const DEFAULT_SHELVES = [
  { id: 'grade-10-lit', name: 'Grade 10 Literature', count: 6 },
  { id: 'olympiad-prep', name: 'Olympiad Prep', count: 4 },
  { id: 'world-classics', name: 'World Classics', count: 5 },
  { id: 'stem-reference', name: 'STEM Reference', count: 3 }
];

const normalizeThemeValue = (value) => {
  if (!value) return null;
  const v = String(value).toLowerCase().trim();
  if (v === 'day' || v === 'light') return 'day';
  if (v === 'night' || v === 'dark') return 'night';
  return null;
};

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'day';
  try {
    const stored = normalizeThemeValue(localStorage.getItem(THEME_STORAGE_KEY));
    if (stored) return stored;

    const legacy = normalizeThemeValue(localStorage.getItem(LEGACY_CATALOG_THEME_KEY));
    if (legacy) return legacy;
  } catch (e) {
    console.warn('Unable to read theme from localStorage:', e);
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'night';
  }
  return 'day';
};

const getInitialShelves = () => {
  if (typeof window === 'undefined') return DEFAULT_SHELVES;
  try {
    const stored = localStorage.getItem(SHELVES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_SHELVES;
};

const ThemeInnerProvider = ({ children, languageState, setLanguageState }) => {
  const i18n = useI18n();
  const [theme, setThemeState] = useState(getInitialTheme);
  const [hasExplicitPreference, setHasExplicitPreference] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return Boolean(
        normalizeThemeValue(localStorage.getItem(THEME_STORAGE_KEY)) ||
          normalizeThemeValue(localStorage.getItem(LEGACY_CATALOG_THEME_KEY))
      );
    } catch {
      return false;
    }
  });
  const [shelves, setShelves] = useState(getInitialShelves);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Apply theme attributes & classes to <html> and <body>
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-theme', theme);
    body.setAttribute('data-theme', theme);

    if (theme === 'night') {
      root.classList.add('dark', 'theme-night');
      root.classList.remove('light', 'theme-day');
      body.classList.add('dark', 'theme-night');
      body.classList.remove('light', 'theme-day');
    } else {
      root.classList.add('light', 'theme-day');
      root.classList.remove('dark', 'theme-night');
      body.classList.add('light', 'theme-day');
      body.classList.remove('dark', 'theme-night');
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      localStorage.setItem(LEGACY_CATALOG_THEME_KEY, theme === 'day' ? 'light' : 'dark');
    } catch (e) {
      console.warn('Failed to persist theme to localStorage:', e);
    }
  }, [theme]);

  // Listen to OS prefers-color-scheme changes if user hasn't explicitly overridden
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      if (!hasExplicitPreference) {
        setThemeState(e.matches ? 'night' : 'day');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [hasExplicitPreference]);

  const setTheme = useCallback((nextTheme) => {
    const normalized = normalizeThemeValue(nextTheme);
    if (normalized) {
      setHasExplicitPreference(true);
      setThemeState(normalized);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setHasExplicitPreference(true);
    setThemeState((prev) => (prev === 'day' ? 'night' : 'day'));
  }, []);

  const resetToSystemTheme = useCallback(() => {
    setHasExplicitPreference(false);
    try {
      localStorage.removeItem(THEME_STORAGE_KEY);
      localStorage.removeItem(LEGACY_CATALOG_THEME_KEY);
    } catch {
      // ignore
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setThemeState('night');
    } else {
      setThemeState('day');
    }
  }, []);

  const setLanguage = useCallback(
    (lang) => {
      const normalized = normalizeLangCode(lang);
      setLanguageState(normalized);
      try {
        localStorage.setItem(LANG_STORAGE_KEY, normalized);
      } catch {
        // ignore
      }
    },
    [setLanguageState]
  );

  const createShelf = useCallback((shelfName) => {
    const trimmed = (shelfName || '').trim();
    if (!trimmed) return null;
    const id =
      trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-') +
      '-' +
      Date.now().toString().slice(-4);
    const newShelf = { id, name: trimmed, count: 0 };
    setShelves((prev) => {
      const updated = [...prev, newShelf];
      try {
        localStorage.setItem(SHELVES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    return newShelf;
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDay: theme === 'day',
        isLight: theme === 'day',
        isNight: theme === 'night',
        isDark: theme === 'night',
        toggleTheme,
        setTheme,
        resetToSystemTheme,
        language: languageState,
        languageUpper: languageState.toUpperCase(),
        setLanguage,
        t: i18n.t,
        translateCategory: i18n.translateCategory,
        translateShelf: i18n.translateShelf,
        translateStatus: i18n.translateStatus,
        supportedLanguages: i18n.supportedLanguages,
        dictionary: i18n.dictionary,
        shelves,
        createShelf,
        advancedSearchOpen,
        setAdvancedSearchOpen,
        mobileSidebarOpen,
        setMobileSidebarOpen
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const ThemeProvider = ({ children }) => {
  const [languageState, setLanguageState] = useState(getInitialLangCode);

  return (
    <I18nProvider externalLang={languageState} onExternalLangChange={setLanguageState}>
      <ThemeInnerProvider languageState={languageState} setLanguageState={setLanguageState}>
        {children}
      </ThemeInnerProvider>
    </I18nProvider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
