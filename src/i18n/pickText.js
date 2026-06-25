// Helper puro (sin React) para texto bilingüe (T3.6). Un campo de nivel puede ser
// string (legacy) o { es, en }. Devuelve la variante del idioma, con fallback a ES
// y a string. Vive aparte de I18nContext para que la capa lib (motor, explicaciones)
// lo use sin arrastrar React.

export const DEFAULT_LANG = 'es';

export function pickText(field, lang) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  return field[lang] ?? field[DEFAULT_LANG] ?? '';
}
