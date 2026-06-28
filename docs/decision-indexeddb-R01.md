# Decisión: ¿Evolucionar la persistencia a IndexedDB? (riesgo R-01)

**Tarea:** PNR-2 · **Tipo:** investigación + recomendación (NO spike, NO migración)
**Autor de la decisión final:** Rodrigo · **Fecha de evaluación:** 2026-06-28
**Estado:** Recomendación emitida — **go/no-go final pendiente del autor**

> Alcance de este documento: investigación y una recomendación go/no-go razonada. No se
> escribió código, no se migró persistencia, no se modificó código de aplicación. AC2 (spike
> si "go") queda condicional y sin ejecutar; AC3 (decisión registrada en el risk register) la
> cierra el autor cuando confirme la recomendación.

---

## 1. Qué guarda hoy `localStorage` y cómo crece

La app es una SPA estática sin backend (ver `CLAUDE.md` → Stack). Toda la persistencia vive en
`localStorage`, **aislada por navegador/dispositivo**. El inventario completo de claves escritas
(`grep -rn "localStorage.(setItem|getItem|removeItem)" src/`) es de **al menos seis** claves —
las cuatro centrales para la analítica más dos de preferencias de UI/i18n:

| Clave | Origen (archivo) | Forma | Crecimiento |
|-------|------------------|-------|-------------|
| `panrules-gameos:telemetry:v1` | `src/lib/telemetry.js` (`FLAG`) | string `'true'`/`'false'` | Constante (1 valor). |
| `panrules-gameos:telemetry:data:v1` | `src/lib/telemetry.js` (`DATA`) | objeto agregado | **Acotado y casi fijo** (ver abajo). |
| `panrules-gameos:progress:v2` | `src/hooks/useProgress.js` / leída por `useConsoleData.js` | objeto de progreso | Acotado por 43 niveles. |
| `panrules-gameos:cohorts:v1` | `src/hooks/useCohorts.js` | array de cohorts | **El único no acotado por esquema** (crece por cohort creado; ver §1.3). |
| `panrules-gameos:warroom:state:v1` | `src/hooks/useWarRoomState.js` (`STORAGE`) | objeto de estado del War Room | Acotado: `players[]` ≈ nº de pestañas/jugadores en una máquina; `config` de tamaño fijo. Trivial (ver §1.4). |
| `panrules-gameos:layout:v1:<panel>` | `src/hooks/useDragResize.js` (`PREFIX`+`storageKey`) | un `Number` (px) por panel redimensionable | Acotado: una clave por panel; valor escalar. Trivial. |
| `panrules-gameos:lang:v1` | `src/i18n/I18nContext.jsx` (`STORAGE_KEY`) | string `'es'`/`'en'` | Constante (1 valor de ≤2 chars). |

> **Esta tabla NO es una lista de "solo cuatro claves relevantes".** Es el inventario observado de
> claves que la app escribe hoy. Las dos últimas (preferencias de layout e idioma) y el estado del
> War Room son de tamaño **acotado o trivial**, por lo que **no alteran la conclusión de capacidad**
> de §2 — pero se listan para que el inventario sea veraz y no se presente como exhaustivo cuando no
> lo es. Si en el futuro se añaden claves, deben revisarse contra el mismo criterio (¿acotadas?).

### 1.1 Telemetría (`telemetry.js`) — agregados que NO crecen por evento

El contrato (documentado en la cabecera del archivo y en PNR-21) es: **100% local, sin red, sin
PII, OFF por defecto**. `recordResultEvent()` es no-op si no hay opt-in (`isTelemetryEnabled()`).

La estructura persistida es `EMPTY_TELEMETRY`:

```js
{ totalCommits, wins, failures, byReason: {}, byTier: {} }
```

Lo decisivo para el dimensionamiento: `recordResultEvent()` **incrementa contadores en sitio**
(`data.totalCommits += 1`, `data.byReason[reasonCode] += 1`, `data.byTier[tier]`), no agrega
filas. Por tanto el tamaño NO crece con el número de commits jugados:

- `totalCommits`, `wins`, `failures`: 3 enteros, tamaño fijo.
- `byReason`: una clave por `reasonCode` distinto que emite el motor de validación; cada entrada es
  `reasonCode → int`. **Supuesto explícito (condicionante del NO-GO):** que `byReason` esté acotado
  depende de que el **vocabulario de reasonCodes del motor (`firewall-engine.ts`) sea cerrado** —un
  conjunto fijo y pequeño (decenas como máximo) de códigos enumerados. Mientras eso se cumpla,
  `byReason` tiene un techo de claves y el agregado permanece de tamaño fijo. Si ese vocabulario
  pasara a ser **abierto** (p. ej. reasonCodes derivados de entrada del usuario, IDs de nivel,
  combinaciones dinámicas o cadenas libres), `byReason` crecería sin tope y la premisa de "agregado
  acotado" se rompería — ver el disparador correspondiente en §4.
- `byTier`: a lo sumo 3 claves (`F`, `N`, `A`), cada una `{ wins, failures }`.

Cota realista: un objeto JSON de **cientos de bytes, ~1 KB en el peor caso**, **independiente** de
cuántas partidas se jueguen. Es un agregado de tamaño fijo, no un log de eventos.

### 1.2 Progreso (`useProgress.js` / `useConsoleData.js`)

`panrules-gameos:progress:v2` guarda `{ levelIdx, completed[], attempts{}, score, streak,
bestStreak, scored[] }`. Todo está acotado por el catálogo de **43 niveles** (3 tiers, ver
`CLAUDE.md` v2.0): `completed`/`scored` son a lo sumo 43 ids, `attempts` a lo sumo 43 claves
`id → int`. Cota: **~1–2 KB por jugador**, techo duro. `useConsoleData.buildConsoleData()` la lee
una sola vez por montaje de la consola (`useMemo`, lectura síncrona) y la cruza con `LEVELS` para
derivar la analítica por nivel y los totales del dashboard/heatmap.

### 1.3 Cohorts (`useCohorts.js`)

`panrules-gameos:cohorts:v1` es el único array que crece sin tope de esquema: un cohort =
`{ id, name, track, createdAt }`, ~100–150 bytes. Es el almacenamiento de instructor de la
`StudentList`. Aun así, 1.000 cohorts en un mismo navegador ≈ ~150 KB: muy por debajo del
presupuesto de ~5 MB por origen.

### 1.4 War Room — el otro estado sincronizado entre pestañas (sopesado)

`src/hooks/useWarRoomState.js` es la **otra** pieza de estado que se sincroniza entre pestañas, y se
sopesó explícitamente para esta decisión. Su modelo es distinto al de la analítica:

- Sincroniza vía **`BroadcastChannel`** (`panrules-gameos:warroom:v1`) con **fallback a
  `localStorage` + el evento `storage` síncrono** (`saveState`/`onStorage` en el hook): una pestaña
  que se une recupera el estado vigente de las demás, same-origin/same-browser, sin red.
- El estado persistido (`panrules-gameos:warroom:state:v1`) es `{ players[], config, paused,
  levelId, result, version }`: acotado (los jugadores son las pestañas de **una** máquina), de
  tamaño trivial.

Relevancia para IndexedDB: este patrón refuerza el NO-GO en dos sentidos. (a) Confirma que el
contrato vigente depende de **lectura/escritura síncrona** y del evento `storage` de `localStorage`
—que IndexedDB (async) no emite—, así que migrar añadiría complejidad sin beneficio. (b) Su volumen
es trivial y acotado, igual que el resto. **No cambia la conclusión: NO-GO.**

---

## 2. El umbral de R-01 (~100 usuarios concurrentes / analítica) vs. el uso real

R-01 en el registro: *"localStorage no escala >100 usuarios simultáneos"* (P=A, I=A, Exp=A,
aceptado). Dos observaciones estructurales:

1. **El umbral es no observado.** Por diseño, la telemetría es local, sin red y sin PII (contrato
   de PNR-21). **No existe ningún canal que recoja uso real fuera del dispositivo**, así que no hay
   métrica de "usuarios concurrentes" ni volumen agregado que podamos citar. Cualquier afirmación
   numérica sobre el umbral sería inventada. Lo que sigue se basa en **estructura del código +
   estimaciones**, etiquetado como tal.

2. **El modelo "concurrente" no aplica a un store por-dispositivo.** No hay backend ni almacén
   compartido: cada navegador contiene **solo los datos de ese usuario**. 100 usuarios concurrentes
   son 100 `localStorage` aislados de ~2–3 KB cada uno, **no** un store único de 100× tamaño. La
   premisa de R-01 (que el volumen escale con el número de usuarios en un mismo almacén) no se
   materializa con la arquitectura actual: telemetría agregada de tamaño fijo + progreso acotado a
   43 niveles. El presupuesto de ~5 MB por origen **no se acerca ni de lejos** para un usuario único.

Conclusión de esta sección: con la forma de datos actual, el uso realista **no se aproxima** a
ningún límite de `localStorage`. El riesgo R-01, tal como está redactado, describe un fallo que solo
ocurriría bajo un modelo de datos distinto (ver §4, condición de disparo).

---

## 3. Costo/beneficio de migrar la analítica agregada a IndexedDB

IndexedDB aporta tres cosas frente a `localStorage`: (a) cuota mucho mayor (cientos de MB), (b)
consultas indexadas sobre datasets grandes, y (c) API asíncrona que no bloquea el hilo principal.

**Beneficio para ESTE caso:** prácticamente nulo hoy.
- (a) Cuota: innecesaria — el dataset por dispositivo es sub-100 KB con amplio margen.
- (b) Índices: innecesarios — `useConsoleData` lee el objeto completo una vez y deriva todo en
  memoria sobre 43 niveles; no hay consultas por rango ni datasets que justifiquen un índice.
- (c) Asíncrono: para volúmenes de KB la lectura síncrona de `localStorage` ni siquiera produce
  jank perceptible.

**Costo de migrar (preservando el contrato):**
- **Riesgo sobre el modo offline y la lectura síncrona.** `useConsoleData` (consumidor de PNR-17,
  las 5 vistas de la consola) hoy lee de forma **síncrona** dentro de `useMemo` en el montaje.
  IndexedDB es **asíncrono**: la migración obligaría a reescribir el hook a un modelo con estados
  de carga (loading/empty/ready), tocar el dashboard, el heatmap y todo lo que asume datos
  presentes al primer render. Eso es precisamente lo que la nota del edge a PNR-17 advierte: "leer
  desde ahí sin romper el modo offline ni las 5 vistas".
- **Preservar el contrato de PNR-21** (sin red, sin PII, opt-in OFF) es factible en IndexedDB, pero
  no aporta nada: el contrato ya se cumple en `localStorage`.
- **Superficie de complejidad nueva:** apertura de DB, versionado de `onupgradeneeded`, manejo de
  transacciones y errores async, y mantener `localStorage` para `cohorts`/`progress` o migrarlos
  también (más trabajo, más riesgo). Más código que probar contra el gate de 429 tests y el de
  accesibilidad.

**Balance:** migrar hoy paga un costo real de complejidad y riesgo sobre el modo offline a cambio de
cero beneficio de capacidad o rendimiento. Es optimizar un cuello de botella que no existe.

---

## 4. Recomendación: **NO-GO (diferir)** — con condición de disparo explícita

**Recomendación: NO-GO.** No migrar la persistencia a IndexedDB en este momento.

Razonamiento (basado en estructura del código + estimaciones; el umbral real es **no observado**
por diseño):
- La telemetría es un **agregado de tamaño fijo** que incrementa contadores en sitio: no crece con
  el volumen de juego.
- El progreso está **acotado por 43 niveles**; cohorts es trivial aun con miles de entradas.
- Sin backend, `localStorage` es **por dispositivo**: "100 usuarios concurrentes" no concentra datos
  en un mismo almacén, así que la premisa cuantitativa de R-01 no se cumple con la arquitectura
  actual.
- IndexedDB no aporta capacidad ni rendimiento útiles aquí, e **introduce asincronía** que pone en
  riesgo la lectura síncrona/offline de la que dependen `useConsoleData` y las 5 vistas de la consola
  (PNR-17).

Mantener R-01 como **Abierto (aceptado)**: la decisión consciente es seguir en `localStorage` y NO
invertir en la migración mientras no cambie el modelo de datos.

### Condición de disparo (qué invertiría la recomendación a GO)

Reconsiderar IndexedDB si ocurre **cualquiera** de estos cambios estructurales:

1. **La telemetría pasa de agregados a un log de eventos crudos** (append por commit en vez de
   contadores en sitio) → crecimiento no acotado, y ahí sí la cuota de `localStorage` se vuelve un
   límite real.
2. **Un mismo dispositivo/origen concentra datos de muchos usuarios** en un solo almacén (p. ej. un
   dispositivo-instructor que sincronice progreso/eventos crudos de toda una cohorte localmente, o
   se añade un backend/sync real) → el modelo "100 usuarios" deja de ser hipotético.
3. **Un único store se acerca al presupuesto de ~5 MB** del origen, o aparece jank medible por
   escrituras síncronas en el hilo principal.
4. **El vocabulario de reasonCodes del motor deja de ser cerrado** (ver el supuesto de §1.1): si
   `firewall-engine.ts` empieza a emitir reasonCodes abiertos/derivados de datos en vez de un enum
   fijo, `byReason` en `telemetry.js` crece una clave por código nuevo sin tope → el agregado deja
   de ser de tamaño fijo y reabre la pregunta de capacidad.

Si se cumple cualquiera de los cuatro, el beneficio de IndexedDB (cuota mayor + índices + escritura
async sin bloquear) empieza a justificar el costo, y procedería el spike de AC2: adaptar
`useConsoleData`/`telemetry.js` a una lectura async desde IndexedDB **preservando** el contrato de
PNR-21 (sin red, sin PII, opt-in OFF) y el modo offline de la consola (PNR-17), con fallback a
`localStorage` para los datos que sigan acotados.

---

## Apéndice — Evidencia citada

- `src/lib/telemetry.js`: `EMPTY_TELEMETRY`, `recordResultEvent()` (incremento en sitio de
  `totalCommits`/`byReason`/`byTier`), claves `FLAG` y `DATA`, contrato opt-in/no-op.
- `src/hooks/useConsoleData.js`: `readProgress()`, `buildConsoleData()`, lectura síncrona vía
  `useMemo` por montaje; consumidor de la clave `progress:v2`.
- `src/hooks/useProgress.js`: esquema de `progress:v2` acotado a 43 niveles.
- `src/hooks/useCohorts.js`: array `cohorts:v1` (único no acotado, crecimiento trivial).
- `docs/risk-register.md`: R-01 (P=A, I=A, Exp=A, aceptado).
- Edges de PNR-2: relates_to → PNR-21 (contrato de telemetría) y PNR-17 (consumidor vía
  `useConsoleData`, no romper offline).
