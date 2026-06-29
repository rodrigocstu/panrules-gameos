# ADR — Estrategia de entrega móvil de panrules-gameos (EGC-4)

**Tarea:** EGC-4 · **Tipo:** Architecture Decision Record (decisión de plataforma)
**Autores / aprobadores:** FA (autor principal) + SCA (co-revisor y co-aprobador)
**Fecha:** 2026-06-28 · **Estado:** **Aprobado**
**Fase:** Fase 0 (Semanas 1–2) — gate crítico antes de iniciar Fase 1A
**Decisión:** **Opción B — Capacitor/Ionic** (wrapper nativo sobre el web existente)

> Alcance de este documento: decisión razonada de la estrategia de distribución móvil. No se
> escribió ni modificó código de aplicación; en particular **no** se tocó `vite.config.js` (el cambio
> de `base` descrito en §7 lo ejecuta EGC-9). El ADR documenta tres alternativas con sus trade-offs,
> evalúa el PWA actual contra los criterios vigentes de App Store y Google Play, fija la decisión y
> enumera los cambios técnicos que heredan EGC-6 (arquitectura) y EGC-9 (entorno + CI).

---

## 1. Contexto

panrules-gameos v4.0 es una SPA estática React 18 + Vite 5 + Tailwind 3 (sin backend), servida hoy
desde GitHub Pages bajo el sub-path `/panrules-gameos/` (ver `CLAUDE.md` → Stack; demo en
producción: `https://rodrigocstu.github.io/panrules-gameos/`). El repo **ya tiene una PWA operativa**
configurada con `vite-plugin-pwa` (`^0.21.2`) en `vite.config.js`:

- `VitePWA({ registerType: 'autoUpdate', injectRegister: null, ... })` — el service worker se
  registra explícitamente en `src/main.jsx`; con `autoUpdate` el plugin genera un SW que toma control
  inmediato (Workbox `generateSW`).
- `manifest`: `id`/`start_url`/`scope` = `/panrules-gameos/`, `display: 'standalone'`,
  `theme_color`/`background_color: '#0f172a'`, `lang: 'es'`, e iconos `192x192`, `512x512` y
  `512x512` con `purpose: 'maskable'`.
- `workbox`: precache del app-shell (`globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}']`),
  `navigateFallback: '/panrules-gameos/index.html'`, `cleanupOutdatedCaches: true`,
  `clientsClaim: true`.
- Iconos presentes en `public/icons/`: `pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png`,
  `apple-touch-icon.png`.
- **Lighthouse CI** ya existe en `.github/workflows/lighthouse.yml` (corre en cada `pull_request` y
  bajo `workflow_dispatch`: `npm run build` + `npx @lhci/cli@0.13.x autorun`), con las aserciones en
  `lighthouserc.json` y el gate de calidad ≥ 90 (rendimiento / accesibilidad / best-practices).

En v4.0 el móvil quedó **EXCLUIDO** del roadmap (decisión R-03, ver `CLAUDE.md`). EGC-4 reabre esa
pregunta de cara al MVP educativo: la mecánica de retención (streak, racha D7 ≥ 20 %) y el alcance de
distribución exigen presencia en **App Store (iOS) y Google Play (Android)**, no solo un instalable
web. Esta decisión es el bloqueador de mayor impacto en la ruta crítica: determina el stack de
EGC-6 (arquitectura técnica), el setup de EGC-9 (emuladores + CI móvil) y el shell del Sprint 1
(EGC-10). No se puede diseñar la arquitectura ni el entorno sin fijarla.

---

## 2. Opciones consideradas

### Opción A — PWA standalone (lo que ya existe)

Publicar la PWA actual como única superficie móvil, sin wrapper nativo.

- **Reuso de código:** 100 % — es el propio web; cero retrabajo.
- **Semanas de setup:** 0 — ya está configurada y verificada por Lighthouse CI.
- **Google Play:** viable vía **TWA** (Trusted Web Activity / Bubblewrap). Google admite empaquetar
  una PWA que cumpla los criterios de instalabilidad y un Lighthouse PWA ≥ 90; el manifest, los
  iconos (incluido el `maskable`) y el service worker con `navigateFallback` ya cumplen ese piso.
- **iOS App Store:** **no viable.** Apple **no admite PWAs en el App Store**. En iOS una PWA solo se
  "instala" vía Safari → *Añadir a pantalla de inicio*, que **no es distribución en tienda** y no
  aparece en App Store. Además, las **push notifications** en PWA iOS están limitadas (solo desde
  pantalla de inicio, Safari 16.4+) y no equivalen a push nativo. Para una mecánica de streak con
  recordatorios push, esto es una carencia funcional, no solo de distribución.
- **Performance:** alta — es web nativo del navegador, sin capa WebView extra.
- **DX:** la mejor — el pipeline de build/deploy actual no cambia.

**Veredicto:** descalifica para el MVP por la **exclusión de iOS App Store** y el push iOS limitado.
Sigue siendo valiosa como canal web complementario (no se elimina; convive con el build nativo).

### Opción B — Capacitor/Ionic (RECOMENDADA)

Envolver el web React existente en un contenedor nativo con [Capacitor](https://capacitorjs.com/):
el bundle de Vite (`dist/`) se sirve dentro de una **WebView** nativa, empaquetada como app iOS y
Android publicables en ambas tiendas.

- **Reuso de código:** 100 % — todo el árbol React/Tailwind corre sin modificación dentro de la
  WebView: la UI del juego (`src/App.jsx` → `FirewallNGFW`, editor de políticas, visualizador de
  red, traffic log, selector de niveles, animación del paquete), la Management Console
  (`src/pages/Console.jsx` y sus 5 vistas), el War Room (`WarRoom.jsx`), el Policy Tutor
  (`PolicyTutor.jsx`) y el MITRE Mapper (`MitrePanel.jsx`).
- **Lógica de dominio:** `src/lib/firewall-engine.ts` y `src/data/levels.ts` se reutilizan sin
  cambios (igual que en A; corren en JS dentro de la WebView).
- **iOS App Store + Google Play:** ✅ ambas. Capacitor produce proyectos Xcode (iOS) y Gradle
  (Android) nativos, publicables en las dos tiendas como cualquier app nativa.
- **Push notifications nativas:** ✅ vía `@capacitor/push-notifications` (APNs en iOS, FCM en
  Android) — habilita los recordatorios de streak que la mecánica de retención necesita.
- **Semanas de setup:** 1–2 — instalar plugins, generar los proyectos nativos, ajustar el `base`
  del build y montar el CI multiplataforma (detalle en §7).
- **Performance:** media — corre en WebView. Para un juego **web-first por naturaleza** (UIs de
  configuración de políticas, no GPU gaming) la penalización es aceptable; ver el trade-off y su
  mitigación en §5.

**Veredicto:** única opción que entra en ambas tiendas **dentro del timeline de 16 semanas**
reutilizando el 100 % del web.

### Opción C — React Native + Expo

Reescribir la capa de presentación como UI nativa con React Native + Expo.

- **Reuso de código:** ~15 % — solo la lógica pura portable (`src/lib/firewall-engine.ts`,
  `src/data/levels.ts`) se reaprovecha. **Todos** los componentes UI (~85 % del código) se reescriben:
  React Native no usa DOM ni Tailwind/CSS, así que `App.jsx`, la Management Console, el War Room, el
  Policy Tutor y las animaciones del avatar/paquete se rehacen con primitivas nativas (`View`,
  `Text`, `Animated`, etc.).
- **iOS App Store + Google Play:** ✅ ambas, con la mejor performance nativa.
- **Push notifications nativas:** ✅ (Expo Notifications / APNs+FCM).
- **Semanas de setup:** **4–6 adicionales** por la reescritura de UI — **incompatible** con el
  horizonte MVP de 16 semanas.
- **Performance:** alta (nativa real).

**Veredicto:** mejor performance, pero el costo de reescritura es **prohibitivo** para el timeline.
Queda como posible evolución futura si la WebView resultara insuficiente (ver disparador en §6).

---

## 3. Evaluación del PWA v4.0 contra los criterios de tiendas (AC #2)

Evaluación concreta del PWA existente de panrules-gameos v4.0 contra los criterios de aceptación
**vigentes** de cada tienda, a partir de la configuración real del repo (`vite.config.js`,
`public/icons/`, `.github/workflows/lighthouse.yml`):

| Criterio de tienda | Estado del PWA v4.0 | Evidencia / fuente |
| --- | --- | --- |
| **Google Play — instalabilidad PWA / TWA** | ✅ Cumple el piso técnico | Manifest con `name`/`short_name`/`start_url`/`scope`/`display: standalone`/`theme_color`; iconos 192 + 512 + `maskable`; SW con `navigateFallback`. Empaquetable con Bubblewrap/TWA. |
| **Google Play — Lighthouse PWA ≥ 90** | ✅ Gate ya existente | `.github/workflows/lighthouse.yml` corre `@lhci/cli autorun` en cada PR con el umbral ≥ 90 definido en `lighthouserc.json` (rendimiento/accesibilidad/best-practices). Falta añadir explícitamente la categoría PWA al assert si se persiguiera la ruta TWA. |
| **iOS App Store — admisión de PWA** | ❌ **No admitido** | Apple no acepta PWAs en App Store. En iOS la única "instalación" es Safari → *Añadir a pantalla de inicio*, que **no** es distribución en tienda. |
| **iOS — push notifications** | ⚠️ Limitado | Push en PWA iOS solo desde la pantalla de inicio (Safari 16.4+), sin equivalencia con push nativo; insuficiente para la mecánica de streak. |
| **Incompatibilidad de `base` con empaquetado nativo** | ⚠️ Requiere cambio | `vite.config.js` fija `base: '/panrules-gameos/'` (correcto para GitHub Pages). Un empaquetado Capacitor/TWA sirve desde la raíz del contenedor y necesita `base: '/'` (ver §7). |

**Conclusión de la evaluación:** el PWA v4.0 **cumple técnicamente** los criterios de Google Play
(TWA, Lighthouse ≥ 90, manifest e iconos completos), pero **queda excluido de iOS App Store** por
política de Apple, y su push iOS es insuficiente para la retención. Esa exclusión de iOS —no una
deficiencia técnica del PWA— es el dato que **elimina la Opción A como estrategia única del MVP**.

---

## 4. Tabla comparativa

Cada celda se justifica en las secciones §2 y §3.

| Eje de evaluación | A — PWA standalone | **B — Capacitor/Ionic** | C — React Native + Expo |
| --- | --- | --- | --- |
| Publicación iOS App Store | ❌ No (política Apple) | ✅ Sí (proyecto Xcode) | ✅ Sí (nativo) |
| Publicación Google Play | ✅ Sí (TWA) | ✅ Sí (proyecto Gradle) | ✅ Sí (nativo) |
| Reuso de código React + Tailwind | 100 % | **100 %** | ~15 % (solo lógica pura) |
| Semanas de setup adicionales | 0 | **1–2** | 4–6 |
| Push notifications nativas iOS | ❌ No (limitado) | ✅ Sí (APNs vía plugin) | ✅ Sí (Expo/APNs) |
| Performance mid-range Android | Alta | Media (WebView) | Alta (nativa) |
| Riesgo en timeline de 16 semanas | Bajo, **pero sin iOS** | **Bajo** | Alto — incompatible |

---

## 5. Decisión

**Se adopta la Opción B — Capacitor/Ionic**: empaquetar el web React/Tailwind existente en
contenedores nativos iOS y Android con Capacitor, manteniendo la PWA/Pages como canal web
complementario.

Justificación frente a las alternativas:

1. **Cobertura de tiendas dentro del timeline.** Es la **única** opción que publica en App Store
   **y** Google Play dentro de las 16 semanas del MVP. A queda fuera de iOS; C no entra en plazo.
2. **Cero retrabajo de UI.** Todo el árbol React + Tailwind (UI del juego en `src/App.jsx`,
   Management Console en `src/pages/Console.jsx`, War Room, Policy Tutor, MITRE Mapper, animaciones)
   corre sin modificación en la WebView. C exigiría reescribir ~85 % del código.
3. **Lógica de dominio intacta.** `src/lib/firewall-engine.ts` y `src/data/levels.ts` se reutilizan
   sin cambios; el motor de validación —el corazón del juego— no se toca.
4. **Push nativo para la retención.** `@capacitor/push-notifications` habilita los recordatorios de
   streak (APNs/FCM) que A no puede ofrecer en iOS y que sostienen la meta de retención D7 ≥ 20 %.
5. **Penalización de WebView aceptable.** El juego es **web-first por naturaleza** (UIs de
   configuración de políticas, no rendering GPU intensivo), así que el overhead de la WebView no
   compromete la experiencia central.

### Trade-off principal aceptado

La WebView de Capacitor puede mostrar **lag perceptible en Android mid-range (≤ 4 GB RAM)** durante
animaciones complejas (avatar, paquete cruzando zonas). Se acepta este riesgo con la siguiente
**mitigación**, que ejecuta EGC-9:

- Presupuesto de rendimiento explícito: **LCP < 2.5 s** y **FID < 100 ms**, medido en **Lighthouse
  desde el Sprint 3 (S3)** sobre el build Capacitor, sumado al gate ≥ 90 ya existente en
  `.github/workflows/lighthouse.yml` / `lighthouserc.json`.
- Pruebas en **dispositivos Android reales** mid-range desde el Sprint 1, no solo en emulador.
- Respetar `prefers-reduced-motion` (ya es invariante de accesibilidad del proyecto) como vía de
  degradación de animaciones en gama baja.

---

## 6. Consecuencias

### Positivas

- **Cero retrabajo de UI** y una sola base de código React/Tailwind para web + iOS + Android.
- **Timeline viable**: 1–2 semanas de setup, compatible con el MVP de 16 semanas.
- **Acceso a ambas tiendas** y a **push nativo** (streak/retención).
- La **PWA/Pages se conserva** como canal web complementario (no se elimina la inversión de v4.0).
- El gate de calidad existente (Lighthouse CI, axe-core en `npm test`) se **reutiliza** para vigilar
  el presupuesto de rendimiento de la WebView.

### Negativas / riesgos aceptados

- **Performance de WebView** inferior a la nativa en Android mid-range (mitigación en §5).
- **CI más complejo**: se añade un job macOS + Xcode (iOS) y un job Ubuntu + Gradle (Android) además
  del pipeline web actual (detalle en §7), con su coste de mantenimiento y de credenciales de firma.
- **Doble build / doble `base`**: hay que mantener el build de Pages (`base: '/panrules-gameos/'`) y
  el build Capacitor (`base: '/'`) sin que diverjan.
- **Dependencia del ecosistema Capacitor** y de las políticas de revisión de Apple/Google para cada
  release.

### Disparador para reconsiderar (revisitar Opción C)

Si, ya con mitigación aplicada, las pruebas en dispositivos reales mostraran que el presupuesto
**LCP < 2.5 s / FID < 100 ms no se alcanza** de forma sostenida en gama media, o si una mecánica
futura exigiera rendering nativo intensivo, se reabriría la evaluación de **React Native (Opción C)**
para la capa de presentación, conservando la lógica de dominio ya portable.

---

## 7. Cambios técnicos que hereda EGC-9 (no se ejecutan en este ADR)

Lista exacta de cambios para habilitar el build Capacitor (los ejecuta EGC-9; aquí solo se
especifican):

1. **`vite.config.js`** — añadir un build Capacitor con `base: '/'` (p. ej. condicionado por variable
   de entorno), **manteniendo** el build de GitHub Pages con `base: '/panrules-gameos/'`. *(No se
   modifica en EGC-4.)*
2. **Dependencias** — instalar `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`,
   `@capacitor/android` (hoy ausentes en `package.json`).
3. **`capacitor.config.ts`** (nuevo) — `webDir: 'dist'`, más `appId` y `appName`.
4. **Scripts en `package.json`** — añadir `cap sync`, `cap run ios`, `cap run android` junto a los
   actuales (`build`, `lint`, `typecheck`, `test`, `deploy`).
5. **CI en `.github/workflows/`** — job macOS con Xcode (build/firma iOS) y job Ubuntu con Gradle
   (build/firma Android), separados del deploy a Pages y del Lighthouse CI existente.
6. **Plugins mínimos del MVP** — `@capacitor/push-notifications`, `@capacitor/splash-screen`,
   `@capacitor/status-bar`.

---

## 8. Próximos pasos

- **EGC-6 — Definir arquitectura técnica completa**: hereda esta decisión. El stack, las APIs y el
  modelo de datos se diseñan asumiendo el contenedor Capacitor (WebView + plugins nativos) sobre el
  web React existente.
- **EGC-9 — Auditar Zero Trust y configurar entorno de desarrollo**: ejecuta los cambios técnicos del
  §7, monta emuladores iOS/Android, el CI multiplataforma y el presupuesto de rendimiento
  (LCP < 2.5 s / FID < 100 ms) en Lighthouse desde S3.
- **EGC-10 — Sprint 1**: construye el shell/auth/calibración ya sobre el contenedor Capacitor, con
  pruebas en dispositivos Android reales desde el primer sprint.

La aprobación de este ADR por **FA + SCA** (vía revisión del PR) y su merge antes de iniciar la
**Fase 1A** cierran el AC #3 y desbloquean EGC-6 y EGC-9.

---

## Apéndice — Evidencia citada

- `vite.config.js`: `const BASE = '/panrules-gameos/'`, `base: BASE`; `VitePWA` con
  `registerType: 'autoUpdate'`, `injectRegister: null`, manifest (`display: 'standalone'`, iconos
  192/512/maskable, `scope`/`start_url` = BASE), `workbox` (`globPatterns`, `navigateFallback`,
  `cleanupOutdatedCaches`, `clientsClaim: true`).
- `public/icons/`: `pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png`, `apple-touch-icon.png`.
- `.github/workflows/lighthouse.yml`: Lighthouse CI en PR + `workflow_dispatch`; `npm run build` +
  `npx @lhci/cli@0.13.x autorun`; gate ≥ 90.
- `lighthouserc.json`: aserciones del gate de Lighthouse.
- `package.json`: React 18.2 + react-dom + lucide-react; Vite 5.2; `vite-plugin-pwa ^0.21.2`;
  Tailwind 3.4; TypeScript 6 (`typecheck: tsc --noEmit`); Vitest. **Sin** dependencias de Capacitor.
- `src/lib/firewall-engine.ts`, `src/data/levels.ts`: lógica de dominio pura, portable a cualquiera
  de las tres opciones.
- `src/App.jsx`, `src/pages/Console.jsx`: superficie React/Tailwind reutilizada al 100 % por la
  Opción B.
- `CLAUDE.md`: stack (SPA estática sin backend, GitHub Pages), v4.0 con móvil EXCLUIDO (R-03),
  invariante de accesibilidad `prefers-reduced-motion`.
- Edges de EGC-4: `EGC-6` (arquitectura) y `EGC-9` (entorno + CI) dependen de esta decisión; `EGC-10`
  (Sprint 1) la consume aguas abajo.
