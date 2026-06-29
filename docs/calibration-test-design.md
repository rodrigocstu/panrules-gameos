# Diseño del Test de Calibración Inicial — EGC-3

**Tarea:** EGC-3 · **Tipo:** Diseño de UX + Algoritmo pedagógico
**Autora / aprobadora:** PDE
**Fecha:** 2026-06-28 · **Estado:** En revisión
**Fase:** Fase 0 — prerequisito del Sprint 1 (EGC-10)

> Este documento especifica el algoritmo de bifurcación, el banco de preguntas, las pantallas
> de onboarding y el mapeo al nivel de inicio. Es el entregable directo de EGC-3 y el input
> que EGC-10 (Sprint 1) consume para implementar el flujo de calibración en código.

---

## 1. Algoritmo de calibración

### 1.1 Estructura del test

El test consta de **6 preguntas de opción múltiple** distribuidas en dos grupos:

| Grupo | Preguntas | Tipo |
| --- | --- | --- |
| Bloque conceptual | Q1, Q2, Q3 | Definición y comprensión de conceptos PAN-OS |
| Bloque de configuración práctica | Q4, Q5, Q6 | Escenarios de configuración aplicados |

Cada pregunta tiene **4 opciones (A/B/C/D)** y una sola respuesta correcta. No se penaliza
la respuesta incorrecta (sin puntos negativos). El jugador no ve el resultado por pregunta;
el feedback llega al final del test para reducir ansiedad y evitar gaming.

### 1.2 Criterio de puntuación

| Respuestas correctas | Resultado | Track asignado | Nivel de inicio |
| --- | --- | --- | --- |
| 0 – 3 | **Principiante** | Tier F — Fundamentals | **L1** |
| 4 – 6 | **Intermedio** | Tier N — NGFW Engineer | **L11** |

Umbral de bifurcación: **≥ 4/6 correctas = Intermedio (L11)**. Por debajo de ese umbral
el jugador arranca en L1 para asegurar la base conceptual antes de escalar.

### 1.3 Protección contra respuestas al azar (anti-tap)

Si el tiempo promedio por pregunta es **< 4 segundos**, el sistema ignora el puntaje y
asigna automáticamente el resultado **Principiante (L1)**, independientemente de cuántas
respuestas fueron correctas. Esta regla protege la integridad pedagógica del test:
responder en menos de 4 segundos por pregunta no permite leer el enunciado ni las opciones.

La variante de texto en la Pantalla 5 (Resultado) para este caso es:
> *"Parece que respondiste muy rápido. Te asignamos el nivel base para que explores sin
> presión. Puedes recalibrar desde tu perfil cuando quieras."*

### 1.4 Estimación de tiempo de flujo completo

| Pantalla | Duración estimada |
| --- | --- |
| Splash (P1) | ~10 seg |
| Intro NORA (P2) | ~20 seg |
| 6 preguntas × ~25 seg c/u (P3) | ~150 seg |
| Procesando (P4) | ~5 seg |
| Resultado con bifurcación (P5) | ~30 seg |
| **Total** | **~215 seg (~3 min 35 seg)** |

Resultado: **cumple el AC de flujo ≤ 5 minutos** con margen de ~85 segundos.

### 1.5 Edge cases del algoritmo

| Situación | Manejo |
| --- | --- |
| Usuario salta la calibración | Se asigna L1 por defecto (más seguro pedagógicamente). Se registra `calibration_skipped: true` en el perfil. Tras completar L3, aparece un banner suave: *"¿Quieres ajustar tu nivel? Calibrar ahora →"*. |
| Respuestas al azar (anti-tap) | Tiempo promedio < 4 seg → forzar Principiante (L1) + mostrar variante de texto explicativo. |
| Recalibración posterior | Disponible en Perfil → "Ajustar mi nivel" tras completar ≥ 3 niveles. Reemplaza el track asignado pero no borra el progreso acumulado. Límite: 2 recalibraciones por usuario (la opción desaparece del perfil tras la segunda). |
| Empate exacto (3/6) | Principiante (L1). El umbral es ≥ 4, no ≥ 3. |

---

## 2. Banco de 6 preguntas reales sobre PAN-OS

Las preguntas cubren los conceptos fundamentales de la frontera Tier F / Tier N del
curriculum (ver `src/data/levels.ts`). Los enunciados están formulados para lectura en
móvil (≤ 25 palabras por opción, touch targets WCAG de 48 dp mínimo en la UI).

---

### Q1 — ¿Qué es una zona de seguridad en PAN-OS? [Conceptual]

**Enunciado:**
> En PAN-OS, una zona de seguridad es:

**Opciones:**

| Opción | Texto |
| --- | --- |
| A | Una VLAN configurada en el switch de acceso |
| B | **Un agrupador lógico de interfaces al que se aplican políticas de seguridad** ✓ |
| C | Un rango de IPs reservado para servidores críticos |
| D | Un perfil de amenazas aplicado a una interfaz |

**Respuesta correcta: B**

**Justificación:** En PAN-OS, una zona de seguridad (Security Zone) es la unidad
fundamental de la política de seguridad: agrupa interfaces de red (físicas o lógicas)
bajo un nombre que la Security Policy usa como origen o destino. Todo el tráfico que entra
o sale de una interfaz pertenece a la zona asignada a esa interfaz. Las zonas no son VLANs
(que son segmentación L2), ni rangos de IP, ni perfiles de amenazas: son contenedores
lógicos de interfaz con los que el motor de política evalúa srcZone y dstZone.

**Discrimina:** Un principiante sin experiencia en NGFW confundirá zona con VLAN (opción A)
o con un concepto de direccionamiento IP (opción C). Quien conoce el modelo de zonas
PAN-OS elige B de inmediato.

---

### Q2 — Diferencia entre App-ID y el campo Service [Conceptual]

**Enunciado:**
> En una Security Rule de PAN-OS, ¿cuál es la diferencia entre App-ID y el campo Service?

**Opciones:**

| Opción | Texto |
| --- | --- |
| A | App-ID identifica la aplicación por comportamiento; Service define el puerto TCP/UDP |
| B | Son sinónimos: ambos controlan qué aplicación puede pasar |
| C | Service identifica la aplicación; App-ID controla el puerto permitido |
| D | App-ID aplica solo en tráfico cifrado; Service aplica en tráfico en claro |

**Respuesta correcta: A**

**Justificación:** App-ID es el motor de identificación de aplicaciones de PAN-OS: clasifica
el tráfico por su comportamiento, firma y protocolo de aplicación (capa 7), independientemente
del puerto que use. El campo Service define el puerto de transporte TCP/UDP que la regla
acepta. Configurar `service: application-default` significa "acepta solo el puerto estándar
de la aplicación identificada por App-ID"; configurar `service: any` significa "acepta
cualquier puerto". Son conceptos ortogonales: App-ID opera en L7, Service opera en L4.

**Discrimina:** Las opciones B, C y D representan malentendidos comunes. Un principiante
sin práctica en PAN-OS invertirá los roles (opción C) o los confundirá (opción B).

---

### Q3 — ¿Qué hace la regla DENY implícita en PAN-OS? [Conceptual]

**Enunciado:**
> Al final de toda Security Policy de PAN-OS existe una regla implícita. ¿Qué hace?

**Opciones:**

| Opción | Texto |
| --- | --- |
| A | Permite el tráfico entre zonas del mismo tipo (intrazone) |
| B | Registra en log todo el tráfico que no coincidió con ninguna regla explícita |
| C | **Deniega silenciosamente todo el tráfico que no coincidió con ninguna regla, sin generar log por defecto** ✓ |
| D | Redirige el tráfico no permitido a la zona de cuarentena |

**Respuesta correcta: C**

**Justificación:** PAN-OS aplica un "deny all" implícito al final del rulebase: cualquier
paquete que no coincida con ninguna regla explícita es descartado. Este deny implícito
**no genera entradas de log por defecto** (a diferencia de las reglas explícitas de deny,
que sí pueden configurarse para loggear). Esto significa que el tráfico silenciosamente
denegado puede pasar inadvertido sin una regla explícita de deny con logging habilitado.
La opción A describe la política intrazone (que sí permite por defecto), no el deny
implícito. La opción B describe un comportamiento que NO ocurre por defecto.

**Discrimina:** La ausencia de log es el "gotcha" de este concepto. Un principiante asume
que la denegación genera log (opción B) o desconoce la existencia del deny implícito.

---

### Q4 — ¿Cuándo usar DNAT vs SNAT? [Configuración práctica]

**Enunciado:**
> Un servidor web interno (IP 192.168.1.10) debe ser accesible desde Internet en la IP
> pública 203.0.113.5. ¿Qué tipo de NAT configuras?

**Opciones:**

| Opción | Texto |
| --- | --- |
| A | SNAT — para traducir la IP pública de entrada a la IP privada del servidor |
| B | **DNAT — para traducir la IP destino pública a la IP privada del servidor** ✓ |
| C | SNAT — para traducir la IP privada del servidor a la IP pública al salir |
| D | No se necesita NAT; se usa una ruta estática al servidor |

**Respuesta correcta: B**

**Justificación:** DNAT (Destination NAT) traduce la dirección IP **destino** del paquete
entrante: el tráfico llega dirigido a la IP pública (203.0.113.5) y el firewall lo redirige
a la IP privada del servidor (192.168.1.10). SNAT (Source NAT) traduce la IP **origen** y
se usa en el caso inverso: tráfico saliente donde la IP privada interna se enmascara con
la IP pública del firewall. La opción C describe correctamente el uso de SNAT pero aplica
al escenario equivocado (salida, no entrada).

**Discrimina:** La confusión SNAT/DNAT es el error más frecuente en novatos. Un principiante
elegirá SNAT por intuición ("el firewall tiene la IP pública, entonces usa SNAT"). La opción
correcta requiere entender que la dirección *destino* del paquete es la que se traduce en
este escenario de publicación de servicio.

---

### Q5 — Diferencia entre zonas Trust y Untrust [Configuración práctica]

**Enunciado:**
> ¿Cuál es la diferencia funcional entre las zonas Trust y Untrust en un firewall PAN-OS
> típico?

**Opciones:**

| Opción | Texto |
| --- | --- |
| A | Trust solo acepta tráfico cifrado; Untrust acepta tráfico en claro |
| B | **Trust agrupa las redes internas de confianza; Untrust representa redes externas no confiables (normalmente Internet)** ✓ |
| C | Trust y Untrust son nombres decorativos; no afectan la política de seguridad |
| D | Untrust permite todo el tráfico por defecto; Trust lo deniega todo |

**Respuesta correcta: B**

**Justificación:** Trust y Untrust son las zonas canónicas de una arquitectura de firewall
perimetral en PAN-OS. Trust representa la red interna (usuarios, servidores LAN) que el
firewall considera de confianza relativa. Untrust representa redes externas —típicamente
Internet— donde el nivel de confianza es mínimo. El flujo estándar de tráfico de salida es
Trust → Untrust y requiere SNAT; el tráfico de entrada es Untrust → DMZ/Trust y suele
requerir DNAT. Sus nombres tienen consecuencias directas en la política: las reglas se
escriben usando estas zonas como srcZone y dstZone.

**Discrimina:** La opción C (nombres decorativos) es el error de quien no ha trabajado con
políticas basadas en zonas. La opción D invierte el comportamiento real (la zona Untrust no
"permite todo").

---

### Q6 — ¿Qué es un Security Profile en PAN-OS? [Configuración práctica]

**Enunciado:**
> En una Security Rule con acción ALLOW, ¿para qué sirve un Security Profile?

**Opciones:**

| Opción | Texto |
| --- | --- |
| A | Para cifrar el tráfico permitido mediante TLS en el propio firewall |
| B | Para registrar qué usuario inició la sesión permitida |
| C | Para definir qué zonas puede cruzar el tráfico autorizado |
| D | **Para inspeccionar el contenido del tráfico permitido en busca de amenazas (virus, exploits, URLs maliciosas, etc.)** ✓ |

**Respuesta correcta: D**

**Justificación:** Una Security Rule con acción ALLOW decide qué tráfico puede pasar, pero
no inspecciona su contenido por sí sola. Los Security Profiles (Antivirus, Vulnerability
Protection, Anti-Spyware, URL Filtering, WildFire Analysis, File Blocking) añaden la capa
de inspección de contenido: escanean el payload del tráfico ya permitido para detectar y
bloquear amenazas. Sin un Security Profile, una regla ALLOW deja pasar el tráfico sin
analizar su contenido. Por eso en PAN-OS la práctica recomendada es siempre adjuntar al
menos un perfil de amenaza básico a las reglas de tipo ALLOW.

**Discrimina:** Un principiante confundirá Security Profile con autenticación (opción B) o
con control de cifrado (opción A). La opción C describe la función de las zonas, no de los
perfiles.

---

## 3. Especificación de pantallas de onboarding (5 pantallas)

Las pantallas se especifican en texto para que el equipo de diseño (ADX) las traslade a
Figma. Todas las medidas de touch target siguen WCAG 2.1 (mínimo 44 × 44 dp). El flujo
es lineal sin retroceso salvo la pantalla 5 que ofrece recalibración.

---

### Pantalla 1 — Splash (~10 seg)

**Propósito:** Primera impresión del juego; ancla la identidad de marca antes del test.

**Contenido:**
- Logo del juego centrado (identidad visual principal).
- Tagline: *"Domina PAN-OS. Nivel a nivel."*
- Subtexto: *"Para empezar, evaluemos tu punto de partida."*
- Botón primario (ancho completo): **"Comenzar calibración"**
- Enlace secundario debajo del botón: *"Saltar — empezar desde el nivel 1"*
  (registra `calibration_skipped: true` en el perfil del usuario)

**Comportamiento:** Transición automática a P2 al pulsar el botón primario. El enlace
"Saltar" lleva directamente a L1 sin pasar por el test.

---

### Pantalla 2 — Intro NORA (~20 seg)

**Propósito:** El avatar guía NORA (Network Operations & Response Assistant) presenta
el test y gestiona las expectativas del usuario para reducir la fricción de onboarding.

**Contenido:**
- Avatar NORA en primer plano (posición central o lateral según el Design System).
- Burbuja de diálogo de NORA: *"¡Hola! Soy NORA, tu guía en este simulador. Te haré
  6 preguntas rápidas sobre PAN-OS para asignarte el camino de aprendizaje ideal.
  No hay respuestas incorrectas — esto no es un examen, es un mapa."*
- Indicador visual de duración: icono de reloj + *"~3 minutos"*
- Botón primario: **"¡Vamos!"**

**Comportamiento:** Pulsando el botón se inicia el bloque de preguntas (P3). No hay
botón de retroceso en esta pantalla.

---

### Pantalla 3 — Template de pregunta (× 6, ~25 seg c/u)

**Propósito:** Pantalla reutilizable para las 6 preguntas del test. El mismo template se
renderiza secuencialmente para Q1 → Q6.

**Contenido:**
- **Barra de progreso superior:** indicador visual + texto *"Pregunta N de 6"*
  (N = número actual). La barra se llena progresivamente.
- **Texto de pregunta:** jerarquía tipográfica H2, máximo 2 líneas en pantalla móvil.
- **Cuatro opciones (A/B/C/D):** cards táctiles apiladas verticalmente.
  - Altura mínima: 48 dp (touch target WCAG).
  - Estado inactivo: borde sutil, fondo neutro.
  - Estado seleccionado: borde de acento de color primario, fondo con tint suave,
    icono de selección (círculo relleno o checkmark).
  - Solo una opción puede estar seleccionada a la vez.
- **Botón "Siguiente":** deshabilitado (grisado) hasta que el usuario seleccione una opción.
  Al habilitarse, se ilumina con el color primario del Design System.
- **Sin temporizador visible:** se omite intencionadamente para reducir la ansiedad.
  El tiempo se mide internamente para el anti-tap pero no se muestra al usuario.

**Comportamiento:** Al pulsar "Siguiente" en Q6 (última pregunta), la transición lleva a P4
(Procesando). El tiempo de respuesta por pregunta se registra en background para el
algoritmo anti-tap (< 4 seg promedio → forzar Principiante).

**Secuencia de preguntas:**
- Q1: ¿Qué es una zona de seguridad en PAN-OS? [Conceptual]
- Q2: Diferencia entre App-ID y el campo Service [Conceptual]
- Q3: ¿Qué hace la regla DENY implícita? [Conceptual]
- Q4: ¿Cuándo usar DNAT vs SNAT? [Práctica]
- Q5: Diferencia entre zonas Trust y Untrust [Práctica]
- Q6: ¿Para qué sirve un Security Profile? [Práctica]

---

### Pantalla 4 — Procesando (~5 seg)

**Propósito:** Transición breve que da feedback de que el sistema "analiza" las respuestas.
Cubre el tiempo de cómputo del algoritmo y genera sensación de personalización.

**Contenido:**
- Avatar NORA con animación de "pensando" (animación ya existente en el Design System;
  respetar `prefers-reduced-motion`: si está activo, mostrar spinner estático).
- Texto principal: *"Calculando tu ruta de aprendizaje…"*
- Subtexto opcional (aparece tras 2 seg): *"Analizando tus respuestas con el mapa
  curricular de PAN-OS."*

**Comportamiento:** Duración fija de 3–5 segundos. Transición automática a P5 al completar.
No hay interacción del usuario en esta pantalla.

---

### Pantalla 5 — Resultado con bifurcación (~30 seg)

**Propósito:** Comunica el nivel asignado, explica brevemente el track y ofrece el CTA
para iniciar el juego. Es el punto de bifurcación del flujo.

**Variante A — Principiante (< 4 correctas o anti-tap activado):**
- Título: **"Tu punto de partida: Fundamentos PAN-OS"**
- Subtexto: *"Empezarás desde el Nivel 1 para construir una base sólida en zonas,
  App-ID y NAT. Cada nivel tarda ~10-15 minutos."*
- Descripción de track (2 líneas): *"Track Fundamentos (L1–L10): zonas de seguridad,
  App-ID, tipos de NAT, reglas básicas y perfiles de seguridad."*
- Botón primario: **"Empezar desde L1 — ¡Adelante!"**
- Enlace secundario: *"No estoy de acuerdo — Recalibrar"*
  (solo disponible si no es resultado anti-tap; si es anti-tap, mostrar el texto
  explicativo de tap rápido en su lugar)

**Variante B — Intermedio (≥ 4 correctas, tiempo promedio ≥ 4 seg):**
- Título: **"Tu punto de partida: NGFW Engineer"**
- Subtexto: *"Tienes una base sólida. Empezarás desde el Nivel 11 para profundizar
  en policy-order, GlobalProtect, perfiles avanzados y más."*
- Descripción de track (2 líneas): *"Track NGFW Engineer (L11–L30): first-match,
  address objects, Security Profile Groups, VPN, decryption y HA."*
- Botón primario: **"Empezar desde L11 — ¡Vamos!"**
- Enlace secundario: *"Empezar desde L1 en cambio"*
  (permite al usuario bajar de nivel voluntariamente)

**Variante C — Anti-tap detectado:**
- Título: **"¡Un momento!"**
- Subtexto: *"Parece que respondiste muy rápido. Te asignamos el nivel base para que
  explores sin presión. Puedes recalibrar desde tu perfil cuando quieras."*
- Botón primario: **"Empezar desde L1"**
- Sin enlace de recalibración inmediata (evitar abuso del mecanismo).

---

## 4. Mapeo del resultado al nivel de inicio en `src/data/levels.ts`

### Estructura de tiers en el archivo

El archivo `src/data/levels.ts` exporta el array `LEVELS: Level[]` con 43 niveles
organizados en tres tiers definidos por el campo `tier` de cada nivel:

| Tier | Campo `tier` | Rango de IDs | Descripción |
| --- | --- | --- | --- |
| Fundamentals | `'F'` | L1 – L10 | Conceptos base de PAN-OS (zonas, App-ID, NAT, reglas) |
| NGFW Engineer | `'N'` | L11 – L30 | Configuración avanzada y escenarios de producción |
| NetSec Architect | `'A'` | L31 – L43 | Zero Trust, HA, Cloud, diseño de arquitecturas |

El campo `tier` es de tipo `LevelTier = 'F' | 'N' | 'A'` (definido en
`src/types/domain.ts`).

### Mapeo calibración → nivel de inicio

```typescript
// Resultado de la calibración → ID del nivel de inicio en LEVELS
const CALIBRATION_START: Record<'beginner' | 'intermediate', number> = {
  beginner:     1,   // tier: 'F' — L1: "Acceso seguro a Internet" (SNAT básico, App-ID ssl)
  intermediate: 11,  // tier: 'N' — L11: "First-match: la regla que importa es la primera que aplica"
};

// Uso en el flujo de onboarding:
// const startLevelId = score >= 4 ? CALIBRATION_START.intermediate : CALIBRATION_START.beginner;
// const startLevel = LEVELS.find(l => l.id === startLevelId);
```

### Niveles de referencia

**L1 (`id: 1`, `tier: 'F'`)** — Nivel de inicio para Principiantes:
- Título: *"Acceso seguro a Internet"*
- Concepto: SNAT básico (Trust → Untrust), App-ID `ssl`, `application-default`.
- Enseña el flujo de salida más común de un NGFW.

**L11 (`id: 11`, `tier: 'N'`)** — Nivel de inicio para Intermedios:
- Título: *"First-match: la regla que importa es la primera que aplica"*
- Concepto: Evaluación top-down de reglas (primer match gana), riesgo de rule shadowing.
- Es el primer nivel del Tier N y asume dominio completo de los conceptos del Tier F.

### Nota de implementación para EGC-10

El Sprint 1 (EGC-10) consumirá este documento para implementar el componente de
calibración. La lógica de mapeo es:

1. Recopilar las 6 respuestas del usuario y los 6 timestamps de respuesta.
2. Calcular `score` (suma de respuestas correctas, 0–6).
3. Calcular `avgTime` (promedio en ms dividido entre 1000 para obtener segundos).
4. Si `avgTime < 4`: resultado = `'beginner'` (anti-tap override).
5. Si `avgTime >= 4` y `score >= 4`: resultado = `'intermediate'`.
6. En cualquier otro caso: resultado = `'beginner'`.
7. Obtener `startLevelId` del mapeo `CALIBRATION_START[resultado]`.
8. Persistir `{ calibrationResult, startLevelId, score, avgTime, timestamp }` en el
   perfil del usuario (localStorage en el MVP, IndexedDB según EGC-R01).
9. Navegar al nivel `startLevelId` directamente.

El campo `tracks` de cada Level (`ngfw-engineer` | `netsec-architect`) permite además
pre-filtrar el selector de niveles según el track asignado tras la calibración, pero
esa lógica es responsabilidad del LevelSelect de EGC-10, no del propio test.

---

## Apéndice — Archivos de referencia citados

| Archivo | Rol en este documento |
| --- | --- |
| `src/data/levels.ts` | Fuente de verdad de los 43 niveles; define L1 y L11 como puntos de entrada |
| `src/types/domain.ts` | Tipos `LevelTier`, `CertTrack`, `Level`; el campo `tier` es la clave del mapeo |
| `docs/decision-mobile-ADR.md` | Contexto de plataforma (Capacitor/WebView); los touch targets de 48 dp son consecuencia directa |
| `docs/curriculum.md` | Mapa curricular completo; las 6 preguntas cubren la frontera F/N |
