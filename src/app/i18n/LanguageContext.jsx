import { createContext, useContext, useState, useEffect } from 'react';
import en from './translations/en.json';
import fr from './translations/fr.json';
import es from './translations/es.json';

// Translation dictionaries
const translations = {
  en,
  fr,
  es
};

// Log available translations
console.log('Available translations:', Object.keys(translations));

// Language metadata
export const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' }
];

// Get nested value from object using dot notation
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

// Create context
const LanguageContext = createContext(null);

// Provider component
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load language from localStorage or user settings on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        // First check localStorage
        const storedLang = localStorage.getItem('app_language');
        if (storedLang && translations[storedLang]) {
          setLanguage(storedLang);
        } else {
          // Try to get from user settings API
          const userStr = localStorage.getItem('busfare_current_user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.id) {
              try {
                const response = await fetch('/api/settings.php', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'get', user_id: user.id })
                });
                const data = await response.json();
                if (data.success && data.data && data.data.settings && data.data.settings.language) {
                  const userLang = data.data.settings.language;
                  if (translations[userLang]) {
                    setLanguage(userLang);
                    localStorage.setItem('app_language', userLang);
                  }
                }
              } catch (e) {
                console.log('Could not load language from settings');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  // Change language
  const changeLanguage = async (langCode) => {
    console.log('Changing language to:', langCode);
    
    if (!translations[langCode]) {
      console.warn(`Language ${langCode} not supported, falling back to English`);
      langCode = 'en';
    }

    console.log('Setting language to:', langCode);
    setLanguage(langCode);
    localStorage.setItem('app_language', langCode);
    console.log('Language updated in state and localStorage');

    // Update user settings if logged in
    try {
      const userStr = localStorage.getItem('busfare_current_user');
      console.log('User string:', userStr);
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('User parsed:', user);
        if (user && user.id) {
          console.log('Calling API to save language preference...');
          const response = await fetch('/api/settings.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_language',
              language: langCode,
              user_id: user.id
            })
          });
          const data = await response.json();
          console.log('API response:', data);
        }
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    }

    // Force re-render by briefly toggling language
    setLanguage('');
    setTimeout(() => setLanguage(langCode), 10);
  };

  // Translation function
  const t = (key, params = {}) => {
    const translation = getNestedValue(translations[language], key) || 
                        getNestedValue(translations['en'], key) || 
                        key;

    // Replace parameters like {{name}} with actual values
    if (typeof translation === 'string' && Object.keys(params).length > 0) {
      return Object.entries(params).reduce((acc, [paramKey, value]) => {
        return acc.replace(new RegExp(`{{${paramKey}}}`, 'g'), value);
      }, translation);
    }

    return translation;
  };

  // Get current language info
  const currentLanguage = languages.find(l => l.code === language) || languages[0];

  const value = {
    language,
    changeLanguage,
    t,
    isLoading,
    currentLanguage,
    languages: languages.filter(l => translations[l.code])
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use translations
export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

// Higher-order component for components that need translations
export function withTranslation(Component) {
  return function WrappedComponent(props) {
    const { t, language, changeLanguage, currentLanguage, languages } = useTranslation();
    return (
      <Component
        {...props}
        t={t}
        language={language}
        changeLanguage={changeLanguage}
        currentLanguage={currentLanguage}
        languages={languages}
      />
    );
  };
}

export default LanguageContext;
