import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from '../i18n/en';
import hi from '../i18n/hi';

const dictionaries = { en, hi };
const LanguageContext = createContext(null);
export const useT = () => useContext(LanguageContext);
const KEY = 'agritech_lang';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => { try { return localStorage.getItem(KEY) || 'en'; } catch { return 'en'; } });
  useEffect(() => {
    try { localStorage.setItem(KEY, lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo(() => ({ lang, setLang, t: (k) => dictionaries[lang]?.[k] ?? en[k] ?? k }), [lang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
