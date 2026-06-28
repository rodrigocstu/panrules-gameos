# Risk Register — panrules-gameos v4.0

**Marco:** PMI/PMBOK v8 · P = Probabilidad · I = Impacto · Exp = Exposición (A/M/B)

| ID | Riesgo | P | I | Exp | Mitigación | Estado |
|----|--------|---|---|-----|------------|--------|
| R-01 | localStorage no escala >100 usuarios simultáneos | A | A | A | Telemetría anónima agregada (sin PII); IndexedDB como evolución futura. Evaluación PNR-2 (2026-06-28): recomendación **NO-GO** — ver [decision-indexeddb-R01.md](decision-indexeddb-R01.md) | Abierto (aceptado) — decisión final pend. autor |
| R-02 | API de IA con costo en herramienta gratuita | M | A | A | **Mitigado:** el Adaptive Policy Tutor funciona 100% offline (`diffConfig`); la IA (Worker) es opcional vía `VITE_TUTOR_URL` con fallback | Cerrado |
| R-03 | Mobile scope creep extiende el proyecto | A | M | A | **Cerrado:** decisión explícita del autor (gate pre-Sprint 5) = **excluir** companion móvil. Sprint 6 = solo SRE | Cerrado |
| R-04 | Matices L25/L34/L38/L43 sin resolución SME | M | A | A | **Cerrado:** sign-off SME del autor (Rodrigo, PCNSE, 2026-06-28); correcciones text-only aplicadas en `levels.ts`, estado SME `pending`→`corrected`, test de contenido `r04-content.test.js`. Detalle en `accuracy-review.md` §Hallazgos | Cerrado |
| R-05 | WebRTC War Room bloqueado por firewalls corporativos | M | M | M | **Mitigado:** War Room usa BroadcastChannel (same-origin, sin red), no WebRTC | Cerrado |
| R-06 | WCAG AA falla en componentes nuevos | M | M | M | **Mitigado:** gate axe-core en `npm test` (cero violaciones WCAG 2 A/AA) | Cerrado |
| R-07 | Competidor publica feature similar antes del release | B | M | B | Velocidad: disruptivos entregados en Sprint 4-5 | Cerrado |

## Notas

- **R-01 (escala/IndexedDB):** evaluación PNR-2 (2026-06-28). Hallazgo: la telemetría
  (`telemetry.js`) es un agregado de tamaño fijo (incrementa contadores en sitio, no crece por
  evento) y el progreso está acotado a 43 niveles; sin backend, `localStorage` es por dispositivo,
  así que "100 usuarios concurrentes" no concentra datos en un mismo almacén. **Recomendación:
  NO-GO** (no migrar a IndexedDB ahora; aporta cero capacidad/rendimiento e introduce asincronía que
  arriesga el modo offline de `useConsoleData`). El umbral real es **no observado** (sin red por
  diseño). Disparadores que invertirían la decisión: telemetría como log de eventos crudos, un store
  multi-usuario en un mismo origen, o acercarse a ~5 MB. **La decisión final (go/no-go) es del
  autor.** Detalle en [decision-indexeddb-R01.md](decision-indexeddb-R01.md).
- **R-03 (móvil):** decisión registrada el 2026-06-26. Alternativa futura sugerida: PWA
  (manifest + service worker) sobre la SPA existente, sin segunda base de código.
- **R-04 (matices):** **cerrado el 2026-06-28** con sign-off del autor (Rodrigo, PCNSE). Los 4
  niveles (L25/L34/L38/L43) recibieron correcciones **text-only** (hint/desc/explanation/title) en
  `src/data/levels.ts`; el motor y los invariantes no cambiaron. Estado SME `pending`→`corrected`
  en `src/data/sme-status.ts`. Detalle técnico en [accuracy-review.md](accuracy-review.md) §Hallazgos.
- **R-05 (War Room):** el alcance real es colaboración multi-pestaña/same-browser
  (demo de aula / instructor observando). Cross-device exigiría signaling server (fuera de alcance).
