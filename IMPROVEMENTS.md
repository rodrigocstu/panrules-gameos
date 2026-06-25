# IMPROVEMENTS.md — backlog para palo-rules-game

Backlog priorizado para ejecutar con **Claude Code**. Cada tarea está pensada como **una sesión / un PR**:
acotada, con criterios de aceptación verificables. Sugerencia: ejecutarlas en orden; usar *Plan Mode*
de Claude Code para las de refactor antes de aplicar cambios.

Leyenda de prioridad: 🔴 alta · 🟠 media · 🟢 baja.

---

## FASE 0 · Fundaciones (hacer iterable y seguro el repo)

- [ ] 🔴 **T0.1 — Generar CLAUDE.md.** Ejecutar `/init` en Claude Code y fusionar con el CLAUDE.md
      provisto. Criterio: el archivo describe stack, comandos, arquitectura objetivo e invariantes.
- [ ] 🔴 **T0.2 — Tooling de calidad.** Añadir Prettier, configurar ESLint (ya hay deps) con reglas de
      React Hooks, y un script `npm run format`. Criterio: `npm run lint` pasa limpio en todo el repo.
- [ ] 🔴 **T0.3 — Tests con Vitest.** Añadir Vitest + Testing Library. Crear el primer test del motor
      (aunque el motor aún viva en App.jsx, extraer la función a `src/lib/` mínimamente para testearla).
      Criterio: `npm test` corre y hay ≥1 test verde del motor de validación.
- [ ] 🟠 **T0.4 — CI/CD con GitHub Actions.** Workflow que en cada push a `main` haga `install → lint →
      build → deploy` a Pages (reemplaza el `gh-pages` manual). Criterio: el sitio se publica solo.
      (Settings → Pages → Source: GitHub Actions.)

## FASE 1 · Refactor sin cambiar comportamiento

- [ ] 🔴 **T1.1 — Extraer datos.** Mover `ZONES`, `APPS`, `SERVICES`, `PROFILES`, `LEVELS` a
      `src/data/`. Criterio: el juego funciona idéntico; `App.jsx` ya no define constantes de dominio.
- [ ] 🔴 **T1.2 — Extraer el motor.** Crear `src/lib/firewall-engine.js` con `evaluate(config, level)`
      pura (sin React). `App.jsx` la consume. Criterio: misma lógica, cubierta por tests.
- [ ] 🟠 **T1.3 — Extraer componentes.** Dividir la UI en `Visualizer`, `PolicyEditor`, `TrafficLog`,
      `LogModal`, `Onboarding`, `ResultOverlay`. Criterio: `App.jsx` < 120 líneas, solo ensambla.
- [ ] 🟠 **T1.4 — Hook de animación con cleanup.** Mover la animación a `usePacketAnimation` y limpiar
      TODOS los timers en el cleanup. Criterio: sin warnings de "state update on unmounted"; animación
      cancelable al cambiar de nivel.
- [ ] 🟢 **T1.5 — Migrar a TypeScript.** Renombrar a `.tsx`, tipar el dominio (tipos discriminados para
      `NatType`, `Action`, etc.). Criterio: `tsc --noEmit` pasa; `vite build` pasa.

## FASE 2 · Correctitud pedagógica (los bugs que enseñan conceptos equivocados)

> Estas son las más importantes: es una herramienta educativa, un fallo de lógica enseña algo falso.

- [ ] 🔴 **T2.1 — Mensaje de éxito coherente con la acción.** Un `DENY` correcto (nivel 5) debe mostrar
      "TRAFFIC BLOCKED (correcto)", no el banner verde "TRAFFIC ALLOWED". Derivar el mensaje de la
      solución. Criterio: test que cubre acierto en escenario DENY y verifica copy correcto.
- [ ] 🔴 **T2.2 — Validación de App-ID contra la solución.** Comparar contra `solution.app`; `any` no
      debe ser comodín que siempre aprueba. Criterio: elegir `any` cuando la solución pide `ssl` falla
      con mensaje explicativo; test incluido.
- [ ] 🔴 **T2.3 — Validar `service` de forma consistente** en todos los niveles (no solo en el 3).
      Decidir su rol y aplicarlo siempre. Criterio: el campo afecta el resultado de forma predecible; test.
- [ ] 🔴 **T2.4 — Arreglar `specialCheck`.** Toda rama debe ser terminal (no caer a validación genérica).
      Criterio: niveles con `specialCheck` cubren todos los caminos; test por rama.
- [ ] 🟠 **T2.5 — Semántica de perfiles de seguridad clara.** Reemplazar la condición confusa por
      "se requiere al menos el perfil X"; mensajes precisos (no "Profile Missing" cuando hay uno puesto
      pero incorrecto). Criterio: tests de los 3 estados (sin perfil / perfil insuficiente / correcto).
- [ ] 🟠 **T2.6 — Modelo de NAT como rulebase separado.** Activar la pestaña "NAT" con un mini-editor de
      regla NAT (aunque simplificado) y validar DNAT/SNAT/U-Turn ahí, no en la fila de Security. Quitar
      las IPs de NAT hardcodeadas en las etiquetas de animación (derivarlas del nivel). Criterio: el
      jugador crea NAT y Security por separado, como en PAN-OS real.

## FASE 3 · Funcionalidad, aprendizaje y UX

- [ ] 🟠 **T3.1 — Explicación al fallar (y al acertar).** Surfacear el campo `hint` (¡hoy definido pero
      nunca mostrado!) y añadir un "por qué" de 2-3 frases por escenario, estilo microlección. Criterio:
      cada resultado muestra el concepto detrás, no solo "Zone Mismatch".
- [ ] 🟠 **T3.2 — Persistencia.** Guardar progreso (nivel, completados, intentos) en `localStorage`.
      Criterio: recargar mantiene el avance. (localStorage es válido en la app real de Pages.)
- [ ] 🟠 **T3.3 — Selector de nivel y repetición.** Pantalla para elegir/repetir escenarios; quitar el
      `alert()` final y reemplazarlo por una pantalla de cierre. Criterio: se puede rejugar cualquier nivel.
- [ ] 🟠 **T3.4 — Puente a PAN-OS real (set CLI).** Al acertar, mostrar el comando `set` equivalente a la
      política creada (reutiliza el concepto del otro proyecto del autor). Criterio: cada solución
      muestra su sintaxis `set`, marcada como "validar contra tu versión".
- [ ] 🟠 **T3.5 — Responsive + accesibilidad.** Layout funcional en móvil (hoy es desktop-only); foco
      visible, `prefers-reduced-motion`, contraste AA, tamaños de fuente legibles (eliminar 9-10px),
      modales con trap de foco/Esc/ARIA. Criterio: usable en 375px de ancho; Lighthouse a11y ≥ 90.
- [ ] 🟢 **T3.6 — i18n (ES/EN).** Externalizar strings y permitir cambiar idioma; ES por defecto para la
      audiencia objetivo. Criterio: toda la UI cambia de idioma sin recargar.
- [ ] 🟢 **T3.7 — Más escenarios + puntuación.** Aprovechar que los niveles ya son datos para añadir
      escenarios (App override, NAT con puertos, intra-zona, deny por URL category) y un sistema de
      racha/score. Criterio: ≥10 niveles cargados desde datos; score persistido.

---

### Cómo trabajar cada tarea con Claude Code

1. Abrir el repo y lanzar `claude`.
2. Para refactors (Fase 1): pedir primero un plan en *Plan Mode*; revisar el diff antes de aplicar.
3. Una tarea por rama: `git checkout -b t2.1-deny-feedback` y pedir a Claude Code que la implemente
   con su test.
4. Cerrar con `npm run lint && npm run build && npm test` en verde y abrir PR.
