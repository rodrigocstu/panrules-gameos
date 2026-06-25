import { describe, it, expect } from 'vitest';
import { evaluate } from './firewall-engine.js';

/**
 * Fixtures que reflejan los niveles reales de App.jsx. En WP-2 (T1.1) los niveles
 * se extraerán a src/data/levels.js y estos tests importarán los datos reales.
 */
const level1 = {
  id: 1,
  packet: {
    srcZone: 'trust',
    dstZone: 'untrust',
    srcIp: '10.1.1.55',
    dstIp: '142.250.1.1',
    proto: 'TCP/443',
    app: 'ssl',
  },
  solution: {
    srcZone: 'trust',
    dstZone: 'untrust',
    app: 'ssl',
    service: 'application-default',
    action: 'ALLOW',
    nat: 'SNAT',
    profile: 'default',
  },
};

const level3 = {
  id: 3,
  packet: {
    srcZone: 'trust',
    dstZone: 'dmz',
    srcIp: '10.1.1.100',
    dstIp: '192.168.50.5',
    proto: 'TCP/2222',
    app: 'ssh',
  },
  solution: {
    srcZone: 'trust',
    dstZone: 'dmz',
    app: 'ssh',
    service: 'application-default',
    action: 'ALLOW',
    nat: 'NONE',
    profile: 'none',
  },
  specialCheck: (cfg) => {
    if (cfg.service === 'application-default')
      return {
        success: false,
        msg: "DROPPED: App-ID 'ssh' on port 2222 contradicts 'application-default' (Port 22). Good job enforcing standards!",
      };
    if (cfg.service === 'any')
      return {
        success: true,
        msg: 'WARNING: You allowed SSH on a non-standard port. It works, but violates security best practice.',
      };
    return { success: false, msg: 'Configuration mismatch.' };
  },
};

const level5 = {
  id: 5,
  packet: {
    srcZone: 'guest',
    dstZone: 'untrust',
    srcIp: '172.16.0.99',
    dstIp: '1.2.3.4',
    proto: 'UDP/53',
    app: 'dns',
  },
  solution: {
    srcZone: 'guest',
    dstZone: 'untrust',
    app: 'dns',
    service: 'application-default',
    action: 'DENY',
    nat: 'NONE',
    profile: 'any',
  },
};

const correctLevel1Config = {
  srcZone: 'trust',
  dstZone: 'untrust',
  app: 'ssl',
  service: 'application-default',
  action: 'ALLOW',
  nat: 'SNAT',
  profile: 'default',
};

describe('evaluate() — camino feliz (nivel 1, ALLOW)', () => {
  it('aprueba la configuración correcta y deja pasar el tráfico', () => {
    const verdict = evaluate(correctLevel1Config, level1);
    expect(verdict.isWin).toBe(true);
    expect(verdict.finalAction).toBe('allow');
    expect(verdict.terminal).toBe(false);
  });
});

describe('evaluate() — mismatches (nivel 1)', () => {
  it('marca Action Mismatch si el jugador pone DENY donde se requiere ALLOW', () => {
    const verdict = evaluate({ ...correctLevel1Config, action: 'DENY' }, level1);
    expect(verdict.isWin).toBe(false);
    expect(verdict.resultMsg).toBe('Action Mismatch');
    expect(verdict.finalAction).toBe('drop');
  });

  it('marca Zone Mismatch si la zona destino es incorrecta', () => {
    const verdict = evaluate({ ...correctLevel1Config, dstZone: 'dmz' }, level1);
    expect(verdict.isWin).toBe(false);
    expect(verdict.resultMsg).toBe('Zone Mismatch');
  });

  it('marca NAT Mismatch si falta el SNAT', () => {
    const verdict = evaluate({ ...correctLevel1Config, nat: 'NONE' }, level1);
    expect(verdict.isWin).toBe(false);
    expect(verdict.resultMsg).toBe('NAT Mismatch');
  });
});

describe('evaluate() — specialCheck terminal (nivel 3)', () => {
  it('devuelve un veredicto terminal cuando application-default contradice el puerto 2222', () => {
    const verdict = evaluate(
      { ...level3.solution, nat: 'NONE', service: 'application-default' },
      level3
    );
    expect(verdict.terminal).toBe(true);
    expect(verdict.isWin).toBe(true);
    expect(verdict.resultMsg).toContain('DROPPED');
  });
});

describe('evaluate() — comportamiento ACTUAL con bugs conocidos (referencia para WP-3)', () => {
  // Bug #1 (CLAUDE.md): un DENY correcto hoy devuelve "Traffic Allowed".
  // Este test FIJA el comportamiento actual; T2.1 (WP-3) lo cambiará a un mensaje
  // de bloqueo y este test deberá actualizarse junto con el fix.
  it('[BUG #1] nivel 5 DENY correcto: isWin true y finalAction drop, pero msg dice "Traffic Allowed"', () => {
    const verdict = evaluate(
      {
        srcZone: 'guest',
        dstZone: 'untrust',
        app: 'dns',
        service: 'application-default',
        action: 'DENY',
        nat: 'NONE',
        profile: 'any',
      },
      level5
    );
    expect(verdict.isWin).toBe(true);
    expect(verdict.finalAction).toBe('drop');
    expect(verdict.resultMsg).toBe('Traffic Allowed'); // <- a corregir en T2.1
  });
});
