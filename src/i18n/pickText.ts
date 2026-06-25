// Helper puro (sin React) para texto bilingüe (T3.6). Un campo de nivel puede ser
// string (legacy) o { es, en }. Devuelve la variante del idioma, con fallback a ES
// y a string. Vive aparte de I18nContext para que la capa lib (motor, explicaciones)
// lo use sin arrastrar React.

import type { Lang, LocalizedText } from '../types/domain.js';

export const DEFAULT_LANG: Lang = 'es';

export function pickText(field: LocalizedText | null | undefined, lang: Lang): string {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  return field[lang] ?? field[DEFAULT_LANG] ?? '';
}
