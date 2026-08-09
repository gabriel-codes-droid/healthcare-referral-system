import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { translations, type Lang } from '../i18n/translations';

type LanguageContextType = {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Lang>(() => {
    return (localStorage.getItem('sympra_language') as Lang) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('sympra_language', language);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const t = (key: string) => translations[language][key] || translations.en[key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
