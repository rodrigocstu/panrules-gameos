import { LEVELS } from '../data/levels';
import { describe, it, expect } from 'vitest';

// Helper para extraer texto de un LocalizedText (puede ser string o { es, en })
function hasText(field) {
  if (!field) return false;
  if (typeof field === 'string') return field.length > 0;
  return typeof field === 'object' && typeof field.es === 'string' && field.es.length > 0;
}

function hasTextEn(field) {
  if (!field) return false;
  if (typeof field === 'string') return field.length > 0; // legacy: mismo texto para ambos idiomas
  return typeof field === 'object' && typeof field.en === 'string' && field.en.length > 0;
}

describe('i18n completeness', () => {
  it('todos los niveles tienen title.es y title.en', () => {
    LEVELS.forEach((l) => {
      expect(hasText(l.title), `Level ${l.id} title.es`).toBe(true);
      expect(hasTextEn(l.title), `Level ${l.id} title.en`).toBe(true);
    });
  });

  it('todos los niveles tienen hint.es y hint.en', () => {
    LEVELS.forEach((l) => {
      expect(hasText(l.hint), `Level ${l.id} hint.es`).toBe(true);
      expect(hasTextEn(l.hint), `Level ${l.id} hint.en`).toBe(true);
    });
  });

  it('todos los niveles tienen desc (description) en es y en', () => {
    LEVELS.forEach((l) => {
      expect(hasText(l.desc), `Level ${l.id} desc.es`).toBe(true);
      expect(hasTextEn(l.desc), `Level ${l.id} desc.en`).toBe(true);
    });
  });

  it('todos los niveles tienen explanation.es y explanation.en', () => {
    LEVELS.forEach((l) => {
      expect(hasText(l.explanation), `Level ${l.id} explanation.es`).toBe(true);
      expect(hasTextEn(l.explanation), `Level ${l.id} explanation.en`).toBe(true);
    });
  });

  it('todos los niveles tienen tier y tracks', () => {
    LEVELS.forEach((l) => {
      expect(l.tier, `Level ${l.id} tier`).toBeTruthy();
      expect(l.tracks, `Level ${l.id} tracks`).toBeTruthy();
      expect(l.tracks.length, `Level ${l.id} tracks.length`).toBeGreaterThan(0);
    });
  });
});
