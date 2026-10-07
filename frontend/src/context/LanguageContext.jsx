import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('bengkel_lang') || 'id';
  });

  useEffect(() => {
    localStorage.setItem('bengkel_lang', language);
  }, [language]);

  const toggleLanguage = (lang) => {
    if (lang) setLanguage(lang);
    else setLanguage((prev) => (prev === 'id' ? 'en' : 'id'));
  };

  const t = (key, params) => {
    let text = translations[language]?.[key] || translations['id']?.[key] || key;
    if (params) {
      Object.keys(params).forEach((p) => {
        text = text.split(`{${p}}`).join(params[p]);
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
