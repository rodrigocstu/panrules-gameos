import { describe, it, expect } from 'vitest';
import { LEVELS } from '../data/levels';

// Fija el contenido corregido tras el sign-off SME de R-04 (Rodrigo, 2026-06-28).
// Correcciones text-only sobre L25/L34/L38/L43; el motor y los invariantes no cambian.
const byId = (id) => LEVELS.find((l) => l.id === id);

describe('R-04 sign-off — contenido corregido de niveles', () => {
  it('L25: App-ID identifica por SNI/certificado sin decryption (ya no "solo ssl")', () => {
    const l = byId(25);
    expect(l.hint.es).toMatch(/SNI/);
    expect(l.hint.en).toMatch(/SNI/);
    expect(l.hint.es).toMatch(/Content-ID/);
    // ya no afirma el absoluto "solo puede identificar ssl"
    expect(l.hint.es).not.toMatch(/solo puede identificar "ssl"/i);
    expect(l.desc.es).not.toMatch(/solo ve "ssl"/i);
    expect(l.hint.en).not.toMatch(/only (sees|identify).{0,12}"ssl"/i);
  });

  it('L25: el specialCheck conserva sus 3 ramas terminales (Invariante #4)', () => {
    const l = byId(25);
    expect(l.specialCheck({ profile: 'none' })).toMatchObject({ success: false });
    expect(l.specialCheck({ profile: 'default' })).toMatchObject({ success: false });
    expect(l.specialCheck({ profile: 'strict' })).toMatchObject({ success: true });
    // la rama strict mantiene el WARNING sobre la Decryption Policy separada
    expect(l.specialCheck({ profile: 'strict' }).msg).toMatch(/Decryption Policy/i);
  });

  it('L34: el MGT se protege con Permitted IP Addresses + Management Interface Settings', () => {
    const l = byId(34);
    expect(l.hint.es).toMatch(/Permitted IP Addresses/);
    expect(l.hint.es).toMatch(/Management Interface Settings/);
    expect(l.hint.en).toMatch(/Permitted IP Addresses/);
    // no usar el término reservado al management in-band de data-plane
    expect(l.hint.es).not.toMatch(/Interface Management Profile/);
    expect(l.hint.en).not.toMatch(/Interface Management Profile/);
    // se conserva el escenario DENY
    expect(l.solution.action).toBe('DENY');
  });

  it('L38: failover Active-Passive sin "Floating IP"; IP/MAC compartida vía HA Group ID + GARP', () => {
    const l = byId(38);
    expect(l.title.es).not.toMatch(/Floating IP/i);
    expect(l.title.en).not.toMatch(/Floating IP/i);
    expect(l.desc.es).not.toMatch(/IP flotante/i);
    expect(l.hint.es).toMatch(/HA Group ID/);
    expect(l.hint.es).toMatch(/GARP/);
    expect(l.hint.es).toMatch(/no cambia en el failover/i);
    expect(l.hint.en).toMatch(/does not change on failover/i);
  });

  it('L43: mantiene PR.AC-4 etiquetado como CSF 1.1 con equivalente CSF 2.0 PR.AA-05', () => {
    const l = byId(43);
    expect(l.hint.es).toMatch(/PR\.AC-4/);
    expect(l.hint.es).toMatch(/PR\.AA-05/);
    expect(l.hint.es).toMatch(/CSF 1\.1/);
    expect(l.hint.en).toMatch(/PR\.AA-05/);
    expect(l.title.es).toMatch(/CSF 1\.1/);
  });
});
