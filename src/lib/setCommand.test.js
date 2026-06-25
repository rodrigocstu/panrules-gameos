import { describe, it, expect } from 'vitest';
import { buildSetCommands } from './setCommand.js';
import { LEVELS } from '../data/levels.js';

const byId = (id) => LEVELS.find((l) => l.id === id);

describe('buildSetCommands() — Security rulebase', () => {
  it('nivel 1 (ALLOW + SNAT + default): regla allow con zonas, App-ID, servicio y perfil', () => {
    const { security } = buildSetCommands(byId(1), 'Rule-1');
    expect(security[0]).toBe(
      'set rulebase security rules "Rule-1" from Trust-L3 to Untrust-L3 ' +
        'source any destination any application ssl service application-default action allow'
    );
    // profile-setting presente para una regla que permite tráfico.
    expect(security[1]).toContain('profile-setting profiles virus default');
  });

  it('usa el nombre de regla provisto por el jugador', () => {
    const { security } = buildSetCommands(byId(1), 'Mi-Regla');
    expect(security[0]).toContain('rules "Mi-Regla"');
  });

  it('cae a Rule-<id> si no se pasa nombre', () => {
    const { security } = buildSetCommands(byId(2));
    expect(security[0]).toContain('rules "Rule-2"');
  });

  it('nivel 5 (DENY): acción deny y SIN profile-setting (una deny no inspecciona)', () => {
    const { security } = buildSetCommands(byId(5), 'Block-DNS');
    expect(security[0]).toContain('action deny');
    expect(security.some((l) => l.includes('profile-setting'))).toBe(false);
  });

  it('nivel 3 (profile none): regla allow sin profile-setting', () => {
    const { security } = buildSetCommands(byId(3));
    expect(security[0]).toContain('action allow');
    expect(security).toHaveLength(1);
  });
});

describe('buildSetCommands() — NAT rulebase (tabla separada)', () => {
  it('nivel 1 (SNAT): source-translation y destino any, sin destination-translation', () => {
    const { nat } = buildSetCommands(byId(1));
    expect(nat).toHaveLength(1);
    expect(nat[0]).toContain('rulebase nat rules "NAT-1"');
    expect(nat[0]).toContain('destination any');
    expect(nat[0]).toContain(
      'source-translation dynamic-ip-and-port interface-address ip 203.0.113.1'
    );
    expect(nat[0]).not.toContain('destination-translation');
  });

  it('nivel 2 (DNAT): matchea la IP pública y traduce al servidor interno', () => {
    const { nat } = buildSetCommands(byId(2));
    expect(nat[0]).toContain('destination 203.0.113.1');
    expect(nat[0]).toContain('destination-translation translated-address 192.168.50.10');
    expect(nat[0]).not.toContain('source-translation');
  });

  it('nivel 4 (U-Turn): incluye source-translation Y destination-translation', () => {
    const { nat } = buildSetCommands(byId(4));
    expect(nat[0]).toContain('source-translation dynamic-ip-and-port');
    expect(nat[0]).toContain('destination-translation translated-address 192.168.50.10');
  });

  it('niveles sin NAT (3 y 5): no generan regla NAT', () => {
    expect(buildSetCommands(byId(3)).nat).toHaveLength(0);
    expect(buildSetCommands(byId(5)).nat).toHaveLength(0);
  });
});
