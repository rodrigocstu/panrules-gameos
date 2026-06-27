import { describe, it, expect } from 'vitest';
import { mitreFor, MITRE_MAP } from '../data/mitre-map';
import { LEVELS } from '../data/levels';

describe('mitreFor', () => {
  it('devuelve [] para un nivel sin mapeo', () => {
    expect(mitreFor(999)).toEqual([]);
  });

  it('mapea L5 (exfil DNS) a T1048 Exfiltration', () => {
    const techs = mitreFor(5);
    expect(techs).toHaveLength(1);
    expect(techs[0].techniqueId).toBe('T1048');
    expect(techs[0].tactic).toBe('Exfiltration');
  });

  it('mapea L24 (EDL Tor) a T1090.003 Multi-hop Proxy', () => {
    const techs = mitreFor(24);
    expect(techs[0].techniqueId).toBe('T1090.003');
  });

  it('mapea L25 (decryption) a T1573 Encrypted Channel', () => {
    expect(mitreFor(25)[0].techniqueId).toBe('T1573');
  });
});

describe('MITRE_MAP — integridad de datos', () => {
  it('todos los niveles mapeados existen en LEVELS', () => {
    const ids = new Set(LEVELS.map((l) => l.id));
    Object.keys(MITRE_MAP).forEach((id) => {
      expect(ids.has(Number(id))).toBe(true);
    });
  });

  it('cada técnica tiene TID, táctica, nombre, url y blurb bilingüe', () => {
    Object.values(MITRE_MAP)
      .flat()
      .forEach((tech) => {
        expect(tech.techniqueId).toMatch(/^T\d{4}(\.\d{3})?$/);
        expect(tech.tacticId).toMatch(/^TA\d{4}$/);
        expect(tech.techniqueName.length).toBeGreaterThan(0);
        expect(tech.url).toContain('attack.mitre.org/techniques/');
        expect(tech.blurb.es.length).toBeGreaterThan(0);
        expect(tech.blurb.en.length).toBeGreaterThan(0);
      });
  });

  it('las URLs de sub-técnicas usan el formato /Txxxx/yyy/', () => {
    const sub = mitreFor(24)[0]; // T1090.003
    expect(sub.url).toBe('https://attack.mitre.org/techniques/T1090/003/');
  });

  it('las URLs de técnicas base usan el formato /Txxxx/', () => {
    const base = mitreFor(5)[0]; // T1048
    expect(base.url).toBe('https://attack.mitre.org/techniques/T1048/');
  });
});
