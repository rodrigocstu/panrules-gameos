import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { STRINGS } from './strings';
import { pickText } from './pickText';

// i18n ligero por Context (T3.6). Sin dependencias externas: el dominio es
// pequeño y un Context + función `t` cubre el caso ES/EN cambiando sin recargar.
//
// - lang: 'es' | 'en' (ES por defecto, audiencia hispanohablante).
// - t(key, vars?): busca la clave en STRINGS[lang]; interpola {var} con `vars`.
//   Si falta la clave, cae a ES y, en último caso, devuelve la propia clave.
// - El idioma se persiste en localStorage para mantenerlo entre sesiones.

const STORAGE_KEY = 'panrules-gameos:lang:v1';
const SUPPORTED = ['es', 'en'];
const DEFAULT_LANG = 'es';

const I18nContext = createContext(null);

function readInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch {
    // localStorage no disponible: usar default.
  }
  return DEFAULT_LANG;
}

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(readInitialLang);

  const setLang = useCallback((next) => {
    if (!SUPPORTED.includes(next)) return;
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignorar fallos de persistencia.
    }
  }, []);

  const t = useCallback(
    (key, vars) => {
      const fromLang = STRINGS[lang]?.[key];
      const fromEs = STRINGS[DEFAULT_LANG]?.[key];
      const raw = fromLang ?? fromEs ?? key;
      return interpolate(raw, vars);
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n debe usarse dentro de <I18nProvider>');
  return ctx;
}

// Re-export del helper puro de texto bilingüe (vive en pickText.js sin React).
export { pickText };
