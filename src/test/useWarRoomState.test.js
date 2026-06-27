import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  DEFAULT_STATE,
  DEFAULT_CONFIG,
  ROLES,
  makePlayerId,
  applyJoin,
  applyLeave,
  applyConfig,
  applyPause,
  applyResult,
  applyTicket,
  loadState,
  useWarRoomState,
} from '../hooks/useWarRoomState.js';

const STORAGE = 'panrules-gameos:warroom:state:v1';

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('makePlayerId', () => {
  it('genera ids únicos', () => {
    expect(makePlayerId()).not.toBe(makePlayerId());
  });
});

describe('ROLES', () => {
  it('expone los 4 roles', () => {
    expect(ROLES).toEqual(['security', 'nat', 'validator', 'instructor']);
  });
});

describe('applyJoin', () => {
  it('añade un jugador con rol', () => {
    const s = applyJoin(DEFAULT_STATE, 'p1', 'Ana', 'security');
    expect(s.players).toHaveLength(1);
    expect(s.players[0]).toMatchObject({ id: 'p1', name: 'Ana', role: 'security' });
  });

  it('reemplaza al mismo jugador en vez de duplicar', () => {
    let s = applyJoin(DEFAULT_STATE, 'p1', 'Ana', 'security');
    s = applyJoin(s, 'p1', 'Ana', 'nat');
    expect(s.players).toHaveLength(1);
    expect(s.players[0].role).toBe('nat');
  });

  it('usa fallback de nombre si viene vacío', () => {
    const s = applyJoin(DEFAULT_STATE, 'p1', '   ', 'validator');
    expect(s.players[0].name).toBe('Jugador');
  });

  it('incrementa la versión', () => {
    const s = applyJoin(DEFAULT_STATE, 'p1', 'Ana', 'security');
    expect(s.version).toBe(DEFAULT_STATE.version + 1);
  });
});

describe('applyLeave', () => {
  it('elimina al jugador por id', () => {
    let s = applyJoin(DEFAULT_STATE, 'p1', 'Ana', 'security');
    s = applyJoin(s, 'p2', 'Beto', 'nat');
    s = applyLeave(s, 'p1');
    expect(s.players).toHaveLength(1);
    expect(s.players[0].id).toBe('p2');
  });
});

describe('applyConfig', () => {
  it('actualiza un campo de la config', () => {
    const s = applyConfig(DEFAULT_STATE, { app: 'ssl' });
    expect(s.config.app).toBe('ssl');
  });

  it('NO edita si la sesión está en pausa', () => {
    const paused = applyPause(DEFAULT_STATE, true);
    const s = applyConfig(paused, { app: 'ssl' });
    expect(s.config.app).toBe(DEFAULT_CONFIG.app);
  });
});

describe('applyPause', () => {
  it('alterna el flag de pausa', () => {
    expect(applyPause(DEFAULT_STATE, true).paused).toBe(true);
  });
});

describe('applyResult', () => {
  it('guarda el resultado del commit', () => {
    const s = applyResult(DEFAULT_STATE, { isWin: true, reasonCode: 'OK_ALLOW' });
    expect(s.result.isWin).toBe(true);
  });
});

describe('applyTicket', () => {
  it('cambia de nivel y resetea config + resultado', () => {
    let s = applyConfig(DEFAULT_STATE, { app: 'ssl' });
    s = applyResult(s, { isWin: false });
    s = applyTicket(s, 3);
    expect(s.levelId).toBe(3);
    expect(s.config.app).toBe(DEFAULT_CONFIG.app);
    expect(s.result).toBeNull();
  });
});

describe('loadState', () => {
  it('devuelve estado por defecto sin datos', () => {
    expect(loadState().players).toEqual([]);
  });

  it('tolera JSON corrupto', () => {
    localStorage.setItem(STORAGE, '{bad');
    expect(loadState().players).toEqual([]);
  });

  it('tolera esquema inválido', () => {
    localStorage.setItem(STORAGE, JSON.stringify({ foo: 1 }));
    expect(loadState().players).toEqual([]);
  });
});

describe('useWarRoomState — integración en una pestaña', () => {
  it('arranca sin jugador propio', () => {
    const { result } = renderHook(() => useWarRoomState());
    expect(result.current.me).toBeNull();
  });

  it('join registra al jugador y persiste', () => {
    const { result } = renderHook(() => useWarRoomState());
    act(() => result.current.join('Ana', 'security'));
    expect(result.current.me).toMatchObject({ name: 'Ana', role: 'security' });
    expect(loadState().players).toHaveLength(1);
  });

  it('updateConfig propaga al estado', () => {
    const { result } = renderHook(() => useWarRoomState());
    act(() => result.current.join('Ana', 'security'));
    act(() => result.current.updateConfig({ app: 'ssl' }));
    expect(result.current.state.config.app).toBe('ssl');
  });

  it('pausa congela la edición de config', () => {
    const { result } = renderHook(() => useWarRoomState());
    act(() => result.current.join('Ana', 'instructor'));
    act(() => result.current.setPaused(true));
    act(() => result.current.updateConfig({ app: 'ssl' }));
    expect(result.current.state.config.app).toBe(DEFAULT_CONFIG.app);
  });

  it('newTicket avanza el nivel y limpia la config', () => {
    const { result } = renderHook(() => useWarRoomState());
    act(() => result.current.join('Ana', 'instructor'));
    act(() => result.current.updateConfig({ app: 'ssl' }));
    act(() => result.current.newTicket(4));
    expect(result.current.state.levelId).toBe(4);
    expect(result.current.state.config.app).toBe(DEFAULT_CONFIG.app);
  });
});
