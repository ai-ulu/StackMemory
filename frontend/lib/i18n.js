/**
 * AI-ULU Multi-Language Support
 * 
 * Internationalization for memories and UI.
 * Supports: Turkish (tr), English (en), German (de), French (fr)
 */

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
];

// Default language
export const DEFAULT_LANGUAGE = 'tr';

// Translations
const translations = {
  tr: {
    // Common
    'common.save': 'Kaydet',
    'common.cancel': 'İptal',
    'common.delete': 'Sil',
    'common.edit': 'Düzenle',
    'common.loading': 'Yükleniyor...',
    'common.error': 'Hata',
    'common.success': 'Başarılı',
    
    // Memory types
    'memory.type.identity': 'Kimlik',
    'memory.type.preference': 'Tercih',
    'memory.type.fact': 'Bilgi',
    
    // Chat
    'chat.placeholder': 'Bir şey yazın...',
    'chat.send': 'Gönder',
    'chat.memories_used': 'Kullanılan hafızalar',
    
    // Settings
    'settings.title': 'Ayarlar',
    'settings.memory': 'Hafıza',
    'settings.privacy': 'Gizlilik',
    'settings.language': 'Dil',
    
    // Memory
    'memory.add': 'Hafıza Ekle',
    'memory.search': 'Hafızalarda Ara',
    'memory.empty': 'Henüz hafıza yok',
    'memory.graph': 'Hafıza Grafiği',
    
    // Analytics
    'analytics.title': 'Analitik',
    'analytics.total': 'Toplam',
    'analytics.today': 'Bugün',
    'analytics.health': 'Sağlık Puanı',
    
    // Teams
    'team.create': 'Takım Oluştur',
    'team.invite': 'Davet Et',
    'team.members': 'Üyeler',
    
    // Errors
    'error.auth': 'Oturum açmanız gerekiyor',
    'error.network': 'Bağlantı hatası',
    'error.notfound': 'Bulunamadı',
  },
  
  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Memory types
    'memory.type.identity': 'Identity',
    'memory.type.preference': 'Preference',
    'memory.type.fact': 'Fact',
    
    // Chat
    'chat.placeholder': 'Type something...',
    'chat.send': 'Send',
    'chat.memories_used': 'Memories used',
    
    // Settings
    'settings.title': 'Settings',
    'settings.memory': 'Memory',
    'settings.privacy': 'Privacy',
    'settings.language': 'Language',
    
    // Memory
    'memory.add': 'Add Memory',
    'memory.search': 'Search Memories',
    'memory.empty': 'No memories yet',
    'memory.graph': 'Memory Graph',
    
    // Analytics
    'analytics.title': 'Analytics',
    'analytics.total': 'Total',
    'analytics.today': 'Today',
    'analytics.health': 'Health Score',
    
    // Teams
    'team.create': 'Create Team',
    'team.invite': 'Invite',
    'team.members': 'Members',
    
    // Errors
    'error.auth': 'Authentication required',
    'error.network': 'Connection error',
    'error.notfound': 'Not found',
  },
  
  de: {
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.loading': 'Laden...',
    'memory.type.identity': 'Identität',
    'memory.type.preference': 'Präferenz',
    'memory.type.fact': 'Fakt',
    'chat.placeholder': 'Schreiben Sie etwas...',
    'chat.send': 'Senden',
    'settings.title': 'Einstellungen',
    'memory.add': 'Speicher hinzufügen',
    'memory.search': 'Speicher durchsuchen',
  },
  
  fr: {
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.loading': 'Chargement...',
    'memory.type.identity': 'Identité',
    'memory.type.preference': 'Préférence',
    'memory.type.fact': 'Fait',
    'chat.placeholder': 'Écrivez quelque chose...',
    'chat.send': 'Envoyer',
    'settings.title': 'Paramètres',
    'memory.add': 'Ajouter mémoire',
    'memory.search': 'Rechercher mémoires',
  },
};

/**
 * Get translation
 */
export function t(key, lang = DEFAULT_LANGUAGE) {
  const langTranslations = translations[lang] || translations[DEFAULT_LANGUAGE];
  return langTranslations[key] || translations[DEFAULT_LANGUAGE][key] || key;
}

/**
 * Get all translations for a language
 */
export function getTranslations(lang) {
  return translations[lang] || translations[DEFAULT_LANGUAGE];
}

/**
 * Detect language from text
 */
export function detectLanguage(text) {
  const patterns = {
    tr: /[ğüşıöçĞÜŞİÖÇ]/,
    de: /[äöüßÄÖÜ]/,
    fr: /[àâçéèêëîïôùûü]/,
    ar: /[\u0600-\u06FF]/,
    es: /[áéíóúüñ¿¡]/,
  };

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      return lang;
    }
  }

  return 'en'; // Default to English
}

/**
 * Format date according to locale
 */
export function formatDate(date, lang = DEFAULT_LANGUAGE) {
  const d = new Date(date);
  const localeMap = {
    tr: 'tr-TR',
    en: 'en-US',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
    ar: 'ar-SA',
  };
  
  return d.toLocaleDateString(localeMap[lang] || 'tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format relative time
 */
export function formatRelativeTime(date, lang = DEFAULT_LANGUAGE) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const labels = {
    tr: {
      now: 'Şimdi',
      minute: 'dakika önce',
      minutes: 'dakika önce',
      hour: 'saat önce',
      hours: 'saat önce',
      day: 'gün önce',
      days: 'gün önce',
    },
    en: {
      now: 'Just now',
      minute: 'minute ago',
      minutes: 'minutes ago',
      hour: 'hour ago',
      hours: 'hours ago',
      day: 'day ago',
      days: 'days ago',
    },
  };
  
  const l = labels[lang] || labels.en;
  
  if (seconds < 60) return l.now;
  if (minutes < 60) return `${minutes} ${minutes === 1 ? l.minute : l.minutes}`;
  if (hours < 24) return `${hours} ${hours === 1 ? l.hour : l.hours}`;
  return `${days} ${days === 1 ? l.day : l.days}`;
}

/**
 * Get language direction
 */
export function getDirection(lang) {
  return SUPPORTED_LANGUAGES.find(l => l.code === lang)?.rtl ? 'rtl' : 'ltr';
}

/**
 * Language context for React
 */
import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext({
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('ai-ulu-lang');
    if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
      setLang(stored);
    }
  }, []);

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('ai-ulu-lang', newLang);
    document.documentElement.dir = getDirection(newLang);
    document.documentElement.lang = newLang;
  };

  const translate = (key) => t(key, lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export default {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  t,
  detectLanguage,
  formatDate,
  formatRelativeTime,
  getDirection,
};
