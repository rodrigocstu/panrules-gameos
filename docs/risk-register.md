# Risk Register — panrules-gameos v4.0

**Marco:** PMI/PMBOK v8 · P = Probabilidad · I = Impacto · Exp = Exposición (A/M/B)

| ID | Riesgo | P | I | Exp | Mitigación | Estado |
|----|--------|---|---|-----|------------|--------|
| R-01 | localStorage no escala >100 usuarios simultáneos | A | A | A | Telemetría anónima agregada (sin PII); IndexedDB como evolución futura | Abierto (aceptado) |
| R-02 | API de IA con costo en herramienta gratuita | M | A | A | **Mitigado:** el Adaptive Policy Tutor funciona 100% offline (`diffConfig`); la IA (Worker) es opcional vía `VITE_TUTOR_URL` con fallback | Cerrado |
| R-03 | Mobile scope creep extiende el proyecto | A | M | A | **Cerrado:** decisión explícita del autor (gate pre-Sprint 5) = **excluir** companion móvil. Sprint 6 = solo SRE | Cerrado |
| R-04 | Matices L25/L34/L38/L43 sin resolución SME | M | A | A | No se modificaron esos niveles; marcados como "Matiz pendiente" en el Level Catalog y `accuracy-review.md` | Abierto (pend. SME) |
| R-05 | WebRTC War Room bloqueado por firewalls corporativos | M | M | M | **Mitigado:** War Room usa BroadcastChannel (same-origin, sin red), no WebRTC | Cerrado |
| R-06 | WCAG AA falla en componentes nuevos | M | M | M | **Mitigado:** gate axe-core en `npm test` (cero violaciones WCAG 2 A/AA) | Cerrado |
| R-07 | Competidor publica feature similar antes del release | B | M | B | Velocidad: disruptivos entregados en Sprint 4-5 | Cerrado |

## Notas

- **R-03 (móvil):** decisión registrada el 2026-06-26. Alternativa futura sugerida: PWA
  (manifest + service worker) sobre la SPA existente, sin segunda base de código.
- **R-04 (matices):** los 4 niveles con matiz de precisión 11.x quedan intactos hasta
  sign-off del autor. Detalle técnico en [accuracy-review.md](accuracy-review.md) §Hallazgos.
- **R-05 (War Room):** el alcance real es colaboración multi-pestaña/same-browser
  (demo de aula / instructor observando). Cross-device exigiría signaling server (fuera de alcance).
