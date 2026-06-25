# CLAUDE.md — panrules-gameos

Contexto persistente para Claude Code. Se lee al inicio de cada sesión. Mantenerlo corto y verdadero.

## Qué es

Juego web educativo: un simulador de consola NGFW de Palo Alto. El jugador recibe "tickets"
(escenarios) y debe configurar la política correcta (zonas, App-ID, servicio, acción, perfil de
seguridad y tipo de NAT), hacer *commit*, y ver un paquete animado cruzar las zonas. El objetivo
pedagógico real es entender **DNAT / SNAT** y la lógica de reglas de seguridad.

Demo en producción: https://rodrigocstu.github.io/panrules-gameos/

## Stack

- React 18 + Vite 5, JavaScript (`.jsx`). Tailwind CSS 3. Iconos: lucide-react.
- Sin backend. Es una SPA estática servida desde GitHub Pages.
- Node.js 18+ requerido para Vite.

## Comandos

- `npm install` — instalar dependencias.
- `npm run dev` — servidor de desarrollo.
- `npm run build` — build de producción a `dist/`.
- `npm run preview` — previsualizar el build.
- `npm run lint` — ESLint.
- `npm run deploy` — publica `dist/` en GitHub Pages vía `gh-pages` (hace build antes).

> `vite.config.js` define `base: "/panrules-gameos/"`. Cualquier ruta de assets absoluta
> (p. ej. `/favicon.svg`) debe respetar ese base o fallará en Pages.

## Arquitectura actual (punto de partida)

- **Todo** vive en `src/App.jsx` (~550 líneas, un solo componente `FirewallNGFW`).
  Contiene: constantes (`ZONES`, `APPS`, `SERVICES`, `PROFILES`, `LEVELS`), ~15 `useState`,
  la animación del paquete, el motor de validación (`evaluateTraffic`) y toda la UI (4 paneles + 2 modales).
- `LEVELS` es un array de escenarios con `{ packet, solution, hint, specialCheck? }`.

## Dirección de arquitectura objetivo (refactor sin cambiar comportamiento primero)

Separar en:
- `src/data/levels.{ts,js}` — escenarios como datos (no embebidos en el componente).
- `src/lib/firewall-engine.ts` — función pura `evaluate(config, level) -> Result`. Sin React, testeable.
- `src/hooks/useGameEngine.ts` y `src/hooks/usePacketAnimation.ts` — estado y animación.
- `src/components/` — `Visualizer`, `PolicyEditor`, `TrafficLog`, `LogModal`, `Onboarding`, `ResultOverlay`.
- `App.jsx` queda como ensamblador delgado.

## Invariantes / "gotchas" (NO reintroducir estos bugs)

El motor de validación es el corazón del juego; al tocarlo, respetar:

1. **El feedback debe coincidir con la acción.** Un escenario cuya solución es `DENY` y el jugador
   acierta NO debe mostrar el banner verde "TRAFFIC ALLOWED". Hoy lo hace (bug). El mensaje de
   éxito debe derivar de la solución, no estar hardcodeado.
2. **Una sola fuente de verdad por campo.** La validación de App-ID debe compararse contra
   `level.solution.app`, no contra `level.packet.app`. Elegir `any` no debe pasar siempre como correcto.
3. **El campo `service` debe validarse** de forma consistente en todos los niveles, no solo dentro de
   `specialCheck` del nivel 3. Si es decorativo, quitarlo; si enseña, validarlo siempre.
4. **`specialCheck` debe cubrir todas sus ramas.** Hoy la rama "Configuration mismatch" se ignora y
   cae a la validación genérica. Toda salida de `specialCheck` debe ser terminal.
5. **Perfiles de seguridad:** la regla actual `profile !== solution.profile && profile !== 'strict'`
   hace que `strict` siempre apruebe y dispara "Profile Missing" aun con un perfil puesto. Definir
   semántica clara (p. ej. "se requiere AL MENOS el perfil X") y mensajes acordes.
6. **NAT es un rulebase separado de Security.** El juego enseña DNAT/SNAT: no colapsar NAT en la fila
   de política de seguridad como simple dropdown sin lógica. La pestaña "NAT" del editor hoy es inerte.
7. **Limpiar timers.** Las animaciones usan `setInterval`/`setTimeout` encadenados; SIEMPRE limpiarlos
   en cleanup de `useEffect`/al desmontar para evitar fugas y estados inconsistentes.
8. **Resetear TODO el estado al cambiar de nivel.** `nextLevel` hoy olvida `service`, `srcZone`,
   `dstZone`, `ruleName`. El reset debe derivarse del nivel, no enumerar campos a mano.
9. **[PCNSE] Security Policy usa IPs pre-NAT y zonas post-NAT.** En PAN-OS real, la security
   policy evalúa el paquete con las IPs originales (pre-NAT) pero la zona destino ya es la
   post-NAT. Los niveles 2 (inbound DNAT) y 4 (hairpin) deben enseñar esto explícitamente en
   su `hint`. No ocultar este comportamiento ni simplificarlo a "solo ponle DNAT".

## Convenciones

- Solo imports ESM. Componentes funcionales con hooks.
- Si se migra a TypeScript: tipar el dominio primero (`Zone`, `App`, `Service`, `Profile`, `NatType`,
  `Level`, `PolicyConfig`, `EvalResult`). Es un dominio ideal para tipos discriminados.
- Cualquier cambio de lógica del motor requiere un test en `src/lib/*.test.ts` (Vitest) antes de mergear.
- Texto de usuario: preparar para i18n (ES/EN); la audiencia objetivo es hispanohablante.
- **Contenido de `hint`:** cada nivel debe tener un hint en **español claro**, 2-3 frases, que
  cite el comportamiento exacto de PAN-OS. No usar códigos de error como texto explicativo.
  Ejemplo correcto: *"En PAN-OS la Security Policy compara las IPs originales del paquete
  (pre-NAT), pero la zona destino ya es la post-NAT. Por eso en DNAT entrante, la regla debe
  tener zona destino DMZ aunque el paquete llega dirigido a la IP pública."*
- Accesibilidad como piso de calidad: foco visible, `prefers-reduced-motion`, contraste AA,
  modales con trap de foco + cierre con Esc + roles ARIA. No usar `alert()`.

## Verificación antes de cerrar una tarea

`npm run lint` y `npm run build` deben pasar. Si hay tests, `npm test` debe pasar.
Probar el flujo de los 5 niveles en `npm run dev` y confirmar que el feedback es coherente con cada solución.
