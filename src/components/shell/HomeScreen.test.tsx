import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { HomeScreen } from './HomeScreen';
import { FIREWALL_LEVELS } from '../../hooks/useFirewallModule';
import { NAT_LEVELS } from '../../hooks/useNatModule';
import { POLICY_LEVELS } from '../../hooks/usePolicyModule';

// HomeScreen (EGC-19): overview navegable del track Fundamentos. Lee progreso read-only de
// localStorage (claves egc_firewall_progress / egc_nat_progress / egc_policy_progress) y los CTA
// navegan SIEMPRE a firewall/nat/policy (modelo open-access). navigateTo escribe window.location.hash,
// así que las aserciones de navegación se hacen sobre el hash.

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '';
});
afterEach(() => {
  localStorage.clear();
  window.location.hash = '';
});

describe('HomeScreen', () => {
  it('renderiza las 3 tarjetas de módulo del track', () => {
    render(<HomeScreen />);
    expect(screen.getByRole('heading', { name: 'El Portero' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'La Centralita' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Políticas de Red' })).toBeInTheDocument();
  });

  it('lee el progreso real de localStorage (3/9 para Firewall sembrado)', () => {
    localStorage.setItem('egc_firewall_progress', JSON.stringify({ completed: [1, 2, 3] }));
    render(<HomeScreen />);
    const card = screen.getByRole('region', { name: /El Portero/ });
    // El nombre accesible de la tarjeta codifica el progreso ("3 de 9 niveles completados").
    expect(card).toHaveAccessibleName(/3 de 9/);
  });

  it('degrada a 0/N cuando la clave está ausente, y el CTA sigue navegable', () => {
    render(<HomeScreen />);
    const card = screen.getByRole('region', { name: /La Centralita/ });
    expect(card).toHaveAccessibleName(/0 de 6/);
    fireEvent.click(within(card).getByRole('button'));
    expect(window.location.hash).toBe('#/nat');
  });

  it('muestra el badge "Completado" cuando completados >= total', () => {
    localStorage.setItem(
      'egc_firewall_progress',
      JSON.stringify({ completed: [1, 2, 3, 4, 5, 6, 7, 8, 9] })
    );
    render(<HomeScreen />);
    const card = screen.getByRole('region', { name: /El Portero/ });
    expect(within(card).getByText('Completado')).toBeInTheDocument();
    expect(card).toHaveAccessibleName(/9 de 9/);
  });

  it('los 3 CTA navegan a firewall, nat y policy respectivamente', () => {
    render(<HomeScreen />);

    fireEvent.click(within(screen.getByRole('region', { name: /El Portero/ })).getByRole('button'));
    expect(window.location.hash).toBe('#/firewall');

    fireEvent.click(
      within(screen.getByRole('region', { name: /La Centralita/ })).getByRole('button')
    );
    expect(window.location.hash).toBe('#/nat');

    fireEvent.click(
      within(screen.getByRole('region', { name: /Políticas de Red/ })).getByRole('button')
    );
    expect(window.location.hash).toBe('#/policy');
  });

  it('no lanza ante JSON corrupto en una clave (cae a 0/N)', () => {
    localStorage.setItem('egc_policy_progress', 'no-es-json{{{');
    expect(() => render(<HomeScreen />)).not.toThrow();
    const card = screen.getByRole('region', { name: /Políticas de Red/ });
    expect(card).toHaveAccessibleName(/0 de 9/);
  });

  // EGC-14 (bug bash, P2 drift silencioso): los totales de las tarjetas (9/6/9) están hardcodeados
  // en MODULES, desacoplados de las fuentes de verdad de niveles (FIREWALL/NAT/POLICY_LEVELS). Si
  // alguien cambia el rango de niveles de un módulo sin actualizar MODULES, las tarjetas mentirían
  // sobre el progreso y ningún test lo notaría. Este test ancla el total RENDERIZADO de cada
  // tarjeta a la longitud real de su array de niveles: sembrando el progreso a "todo completo"
  // hasta la longitud real, el nombre accesible debe leer "<len> de <len>" y mostrar el badge
  // "Completado". Si el total se desincroniza en cualquier dirección, la aserción falla.
  // (Aserción sobre el render en vez de exportar MODULES: exportar una const no-componente desde
  //  HomeScreen.tsx dispara react-refresh/only-export-components, que rompe la norma cero-warnings).
  describe('sincronización de totales con las fuentes de niveles (anti-drift, EGC-14)', () => {
    const MODULES_UNDER_TEST = [
      { storageKey: 'egc_firewall_progress', cardName: /El Portero/, levels: FIREWALL_LEVELS },
      { storageKey: 'egc_nat_progress', cardName: /La Centralita/, levels: NAT_LEVELS },
      { storageKey: 'egc_policy_progress', cardName: /Políticas de Red/, levels: POLICY_LEVELS },
    ];

    it.each(MODULES_UNDER_TEST)(
      'la tarjeta $storageKey usa la longitud real de su array de niveles como total',
      ({ storageKey, cardName, levels }) => {
        const len = levels.length;
        // Sembrar el módulo como "todo completo" hasta su longitud real de niveles.
        localStorage.setItem(
          storageKey,
          JSON.stringify({ completed: Array.from({ length: len }, (_, i) => i + 1) })
        );
        render(<HomeScreen />);
        const card = screen.getByRole('region', { name: cardName });
        // El total renderizado debe ser exactamente la longitud real: "<len> de <len>".
        expect(card).toHaveAccessibleName(new RegExp(`${len} de ${len}`));
        // Y como completados (len) >= total, debe mostrarse el badge "Completado".
        expect(within(card).getByText('Completado')).toBeInTheDocument();
      }
    );
  });
});
