import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import enDict from '../i18n/en.json';
import uzDict from '../i18n/uz.json';
import ruDict from '../i18n/ru.json';

export const LANG_STORAGE_KEY = 'ps_library_lang';

export const DICTIONARIES = {
  en: enDict,
  uz: uzDict,
  ru: ruDict
};

export const SUPPORTED_LANGUAGES = [
  { code: 'uz', upper: 'UZ', label: 'O‘zbekcha', short: 'UZ' },
  { code: 'ru', upper: 'RU', label: 'Русский', short: 'RU' },
  { code: 'en', upper: 'EN', label: 'English', short: 'EN' }
];

export const normalizeLangCode = (raw) => {
  if (!raw) return 'en';
  const clean = String(raw).toLowerCase().trim();
  if (clean === 'uz' || clean === 'uzbek' || clean === "o'zbek" || clean === 'o‘zbekcha') return 'uz';
  if (clean === 'ru' || clean === 'russian' || clean === 'русский') return 'ru';
  if (clean === 'en' || clean === 'english') return 'en';
  return 'en';
};

export const getInitialLangCode = () => {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored) {
      return normalizeLangCode(stored);
    }
  } catch {
    // ignore storage errors
  }
  return 'en';
};

const I18nContext = createContext(null);

export const I18nProvider = ({ children, externalLang, onExternalLangChange }) => {
  const [internalLang, setInternalLang] = useState(getInitialLangCode);

  const language = externalLang ? normalizeLangCode(externalLang) : internalLang;

  const setLanguage = useCallback(
    (nextLang) => {
      const normalized = normalizeLangCode(nextLang);
      setInternalLang(normalized);
      if (onExternalLangChange) {
        onExternalLangChange(normalized);
      }
      try {
        localStorage.setItem(LANG_STORAGE_KEY, normalized);
      } catch {
        // ignore
      }
    },
    [onExternalLangChange]
  );

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', language);
    }
    try {
      localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch {
      // ignore
    }
  }, [language]);

  const dictionary = useMemo(() => DICTIONARIES[language] || DICTIONARIES.en, [language]);

  // Build case-insensitive category lookup map for active language
  const categoryLookup = useMemo(() => {
    const map = new Map();
    const categoriesObj = dictionary.categories || {};
    Object.entries(categoriesObj).forEach(([key, val]) => {
      map.set(key.toLowerCase().trim(), val);
    });
    return map;
  }, [dictionary]);

  // Dot-path translation resolver: e.g. t('nav.browseCatalog')
  const t = useCallback(
    (path, fallback) => {
      if (!path) return fallback || '';
      const keys = String(path).split('.');
      let current = dictionary;
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          current = undefined;
          break;
        }
      }
      if (current !== undefined && typeof current !== 'object') {
        return current;
      }

      // Fallback to English dictionary
      let enCurrent = DICTIONARIES.en;
      for (const k of keys) {
        if (enCurrent && typeof enCurrent === 'object' && k in enCurrent) {
          enCurrent = enCurrent[k];
        } else {
          enCurrent = undefined;
          break;
        }
      }
      if (enCurrent !== undefined && typeof enCurrent !== 'object') {
        return enCurrent;
      }

      return fallback !== undefined ? fallback : path;
    },
    [dictionary]
  );

  // Translate canonical taxonomy category/genre names while keeping custom tags intact
  const translateCategory = useCallback(
    (categoryName) => {
      if (!categoryName) return '';
      const raw = String(categoryName).trim();
      const exact = dictionary.categories?.[raw];
      if (exact) return exact;
      const lowerMatch = categoryLookup.get(raw.toLowerCase());
      if (lowerMatch) return lowerMatch;
      return raw;
    },
    [dictionary, categoryLookup]
  );

  // Translate default shelf names while keeping custom student-created shelf names intact
  const translateShelf = useCallback(
    (shelfName) => {
      if (!shelfName) return '';
      const raw = String(shelfName).trim();
      return dictionary.sidebar?.defaultShelves?.[raw] || raw;
    },
    [dictionary]
  );

  // Translate status badges ("Available", "Borrowed", "Reserved")
  const translateStatus = useCallback(
    (statusKey) => {
      if (!statusKey) return dictionary.status?.available || 'Available';
      const lower = String(statusKey).toLowerCase().trim();
      if (lower === '0' || lower === 'available' || lower === 'in stock') {
        return dictionary.status?.available || 'Available';
      }
      if (lower === 'reserved') {
        return dictionary.status?.reserved || 'Reserved';
      }
      if (lower === 'loaned') {
        return dictionary.status?.loaned || 'Loaned';
      }
      if (lower === 'pending') {
        return dictionary.status?.pending || 'Pending';
      }
      return dictionary.status?.borrowed || 'Borrowed';
    },
    [dictionary]
  );

  const value = useMemo(
    () => ({
      language,
      languageUpper: language.toUpperCase(),
      setLanguage,
      dictionary,
      dictionaries: DICTIONARIES,
      supportedLanguages: SUPPORTED_LANGUAGES,
      t,
      translateCategory,
      translateShelf,
      translateStatus
    }),
    [language, setLanguage, dictionary, t, translateCategory, translateShelf, translateStatus]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export default I18nContext;

