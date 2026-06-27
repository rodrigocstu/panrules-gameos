# Project Plan — panrules-gameos v4.0 (Management Console)

**Marco:** PMI/PMBOK v8 · **Release:** v4.0.0 · **Fecha:** 2026-06-26

> Plan ejecutado en 6 sprints. Planes previos: v2.0 (43 niveles, Cert Prep) y
> v3.0 (paneles arrastrables), ambos completos.

---

## P1 — Acta de Constitución

| Campo | Valor |
|-------|-------|
| **Proyecto** | panrules-gameos v4.0 — Consola de Gestión Integral NGFW Simulator |
| **Patrocinador / SME** | Rodrigo (PCNSE/PCNC, autor) |
| **Objetivo** | Añadir capa de gestión educativa: analytics, Instructor Mode, Level Builder, 3 conceptos disruptivos, SRE/telemetría — sin backend |
| **Alcance IN** | Management Console (SPA), analytics localStorage, cohorts, Level Builder, Adaptive Policy Tutor, MITRE ATT&CK Mapper, War Room, telemetría opt-in, gates de calidad |
| **Alcance OUT** | Backend propio, auth con servidor, PAN-OS real, **companion móvil (excluido por decisión R-03)** |
| **Restricciones** | Sin servidor en producción (GitHub Pages estático); base `/panrules-gameos/` |
| **Criterio de éxito** | Console live; ≥350 tests; WCAG AA gate; 3 disruptivos demo |

## P2 — Roles (PMBOK v8)

| Rol | Responsabilidad | Principios |
|-----|-----------------|-----------|
| Cybersec Architect | SME review, Zero Trust, riesgos | #4 Valor, #10 Riesgo |
| Full Stack Dev | React console, engine, CI/CD | #8 Calidad, #12 Cambio |
| SRE | axe-core, Lighthouse, SLO, telemetría | #5 Sistema, #8 Calidad |
| Mobile Dev | (condicional — **no activado**, R-03) | #7 Tailoring |

## P3 — WBS (resumen)

- **1.0 Gestión:** este plan, registro de riesgos, plan de calidad.
- **2.0 Plataforma:** ErrorBoundary, tests de componentes React, axe-core gate, `requires?` (prerequisite map).
- **3.0 Contenido:** 43 niveles en 3 tiers (10 F + 20 N + 13 A) — entregados en v2.0.
- **4.0 Management Console:** shell `/#/console`, analytics + heatmap, cohorts, Level Catalog (estado SME), Level Builder WYSIWYG, ConsoleSettings (telemetría + SLO + export).
- **5.0 Disruptivos:** Adaptive Policy Tutor (5.1), MITRE ATT&CK Mapper (5.2), Collaborative War Room (5.3).
- **6.0 SRE:** Lighthouse CI, axe-core en `npm test`, SLO dashboard, telemetría opt-in, release v4.0.0.

## P4 — Cronograma (ejecutado)

| Sprint | Entregable | Estado |
|--------|-----------|--------|
| S1 Foundation | ErrorBoundary, 5 suites de componentes, CI gates, `requires?` | ✅ |
| S2 Analytics | Console `/#/console`, dashboard, heatmap (router por hash) | ✅ |
| S3 Instructor | Cohorts, Level Catalog (estado SME), Level Builder | ✅ |
| S4 Disruptivo 1+2 | Adaptive Policy Tutor + MITRE ATT&CK Mapper | ✅ |
| S5 Disruptivo 3 | Collaborative War Room (BroadcastChannel) | ✅ |
| S6 SRE + Release | SLO dashboard, telemetría opt-in, Lighthouse CI, docs, tag v4.0.0 | ✅ |

## P5 — Riesgos

Ver [risk-register.md](risk-register.md).

## P6 — Plan de Calidad (gates de merge)

```
npm run typecheck && npm run lint && npm test && npm run build
```

- **axe-core** corre dentro de `npm test` (`src/test/a11y.test.jsx`): WCAG 2 A/AA, cero violaciones (color-contrast cubierto por Lighthouse).
- **Lighthouse CI** en workflow aparte (`.github/workflows/lighthouse.yml`): Performance/Accessibility/Best-Practices ≥ 90, en PR + manual.
- **SME sign-off:** todo nivel nuevo o modificado requiere fila `SME-verified` en [accuracy-review.md](accuracy-review.md).

## P7 — Definition of Done (v4.0.0)

1. ✅ Management Console live en `/panrules-gameos/#/console` (5 vistas).
2. ✅ 3 conceptos disruptivos con demo funcional.
3. ✅ ≥350 tests; typecheck + lint + axe-core + build verdes (**429 tests**).
4. 🟡 Lighthouse ≥ 90 (gate configurado; se evalúa en el workflow de CI).
5. 🟡 Matices L25/L34/L38/L43 (auditoría 2026-06-25) — pendientes de sign-off del SME.
6. ✅ `docs/project-plan.md` + `docs/risk-register.md`.
