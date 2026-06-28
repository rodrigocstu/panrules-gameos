# SME Dossier — Riesgo R-04: matices L25/L34/L38/L43

> **Estado: PREPARADO PARA SIGN-OFF — NO ES UN VEREDICTO.**
> Este dossier lo prepara un agente por decisión del autor (Rodrigo, 2026-06-28:
> *"Agente prepara dossier para sign-off"*). Los veredictos de abajo están marcados
> **PROPUESTO / pendiente de firma**. El veredicto SME real es de Rodrigo (PCNSE) y
> **todavía no se ha dado**. Mientras no firme:
> - R-04 sigue **Abierto** en `docs/risk-register.md`.
> - No se han tocado `src/data/levels.ts`, `src/data/sme-status.ts`, ni el motor.
> - Los criterios de aceptación de PNR-1 (veredicto documentado / test si se corrige /
>   R-04 cerrado) quedan **sin marcar**.
>
> Fuentes: `src/data/levels.ts` (definición de cada nivel), `src/data/sme-status.ts`
> (`SME_PENDING_IDS = [25, 34, 38, 43]`), `docs/accuracy-review.md` §Hallazgos, e
> Invariante #9 de `CLAUDE.md` (la Security Policy usa IPs pre-NAT, zonas post-NAT).
> Razonamiento a nivel PCNSE contra el comportamiento real de PAN-OS 11.x.

---

## Resumen de veredictos PROPUESTOS (pendientes de firma)

| Nivel | Matiz | Veredicto PROPUESTO | Alcance del cambio (si se firma) |
|-------|-------|---------------------|----------------------------------|
| L25 | "Sin decryption, App-ID solo ve `ssl`" | **corregir** (solo dato/texto) | Reformular `desc`/`hint`/`explanation`. Motor intacto. |
| L34 | MGT se "protege" con una Security Policy a una zona `management` | **corregir** (solo dato/texto) | Reformular `hint`/`explanation` para nombrar el mecanismo real. Solución `DENY` se conserva. Motor intacto. |
| L38 | Llama "Floating IP" al failover Active-Passive | **corregir** (solo dato/texto) | Reformular `title`/`desc`/`hint`/`explanation`. Motor intacto. |
| L43 | Usa `PR.AC-4` (NIST CSF 1.1) | **corregir condicional** (solo dato/texto) | Decisión de versión: si el curriculum es CSF 2.0 → `PR.AA-05`; si es 1.1 → marcar `correcto` y etiquetar "CSF 1.1". Motor intacto. |

**Observación transversal:** ninguno de los cuatro matices es un bug del motor. Los cuatro
son cuestiones de **precisión del contenido** (texto del nivel). Por tanto, de firmarse
"corregir", el cambio baja a **datos del nivel en `levels.ts`**, no a `firewall-engine.ts`.
El test que pide AC2 sería, en estos casos, un test de contenido (aserción sobre el `hint`/
`solution`), no un test de lógica del motor — salvo L25, donde además conviene fijar que las
tres ramas del `specialCheck` siguen siendo terminales (Invariante #4).

---

## L25 — Decryption Policy: SSL Forward Proxy

### 1. Qué enseña hoy (cita de `levels.ts`)
- `packet`: `trust → untrust`, `ssl`, `TCP/443`, SNAT a `203.0.113.1`.
- `solution`: `ALLOW`, `app=ssl`, `service=application-default`, `nat=SNAT`, `profile=strict`.
- `specialCheck` (3 ramas, todas terminales):
  - `profile==='none'` → `DROPPED: Sin perfil… no tiene inspección…`
  - `profile==='default'` → `Service Mismatch: … "default" no incluye URL Filtering ni WildFire…`
  - `profile==='strict'` → `success:true` con `WARNING: … también necesitas una Decryption
    Policy separada (SSL Forward Proxy) para que la inspección de contenido sea efectiva…`
- `hint`/`desc`: *"Sin decryption, App-ID solo ve 'ssl' — no puede identificar si es YouTube,
  Gmail o malware dentro del SSL."*

### 2. El matiz preciso
La afirmación *"sin decryption, App-ID solo puede identificar `ssl`"* es la simplificación
que el §Hallazgos marca como "técnicamente desactualizada para 11.x".

### 3. Análisis contra PAN-OS real (PCNSE)
Incorrecto como absoluto. En PAN-OS 11.x, App-ID identifica **muchas** apps cifradas **sin
descifrar**, usando señales del handshake TLS:
- **SNI** (Server Name Indication) del `ClientHello`.
- **CN/SAN del certificado** del servidor.
- Patrones de la negociación TLS.

Por eso el firewall etiqueta tráfico como `office365`, `google-base`, `youtube-base`,
`facebook-base`, etc. **sin** Decryption Policy. Lo que la decryption habilita no es
"identificar la app", sino **ver el contenido**: App-ID completo sobre apps anidadas/evasivas,
y todo **Content-ID** (Threat Prevention, WildFire, URL Filtering sobre la ruta completa, DLP).
La formulación correcta es: *"sin decryption, App-ID suele identificar la app por SNI/certificado,
pero no puede inspeccionar el contenido (amenazas, URL completa, archivos)."*

Nota: el `WARNING` de la rama `strict` ya está **bien** — dice que se necesita una Decryption
Policy separada para que la inspección de contenido sea efectiva. El error vive solo en el
`desc`/`hint` ("solo ve ssl").

**Invariante #9:** no aplica como problema. Es SNAT de salida; la Security Policy evalúa la IP
origen pre-NAT (`10.1.1.100`) y `dstZone=untrust` post-NAT — coherente. El matiz es de App-ID,
no de NAT.

### 4. Veredicto PROPUESTO — *pendiente de sign-off*
**`corregir` (solo dato del nivel).** Reformular `desc`, `hint` y `explanation` para sustituir
"App-ID solo ve ssl" por "App-ID identifica la app por SNI/certificado pero no ve el contenido
sin decryption". **No** se toca el motor; las 3 ramas del `specialCheck` se conservan.
Test que acompañaría (AC2): aserción de contenido sobre el `hint` (que ya no afirme el absoluto)
+ test que confirme que la solución `strict` sigue ganando y que las 3 ramas siguen siendo
terminales (Invariante #4). **PROPUESTO.**

---

## L34 — Management Plane Separation (OOB)

### 1. Qué enseña hoy (cita de `levels.ts`)
- `packet`: `trust → management`, `ssh`, `TCP/22`, `dstIp=192.168.1.5`, `nat=NONE`.
- `solution`: `DENY`, `app=ssh`, `service=application-default`, `nat=NONE`, `profile=any`.
- `hint`/`explanation`: la administración (SSH/HTTPS/SNMP) debe ir **exclusivamente** por el
  puerto MGT dedicado en una red OOB aislada; el MGT *"tiene su propia tabla de routing y no
  comparte interfaces con el data plane"* (esto último es correcto).

### 2. El matiz preciso
El principio (separación de planos, OOB, denegar admin in-band) es correcto. Lo impreciso es la
**mecánica**: el simulador modela `management` como una **zona de seguridad** y enseña a
**denegar con una Security Policy**. En PAN-OS real, el puerto MGT **no** es parte del data plane
y el tráfico hacia él **no** lo evalúa el security rulebase de zonas.

### 3. Análisis contra PAN-OS real (PCNSE)
- La interfaz MGT dedicada vive en el **management plane**; **no se asigna a una zona de
  seguridad** y su tráfico **no atraviesa la Security Policy** de zonas data-plane.
- El acceso al MGT se controla con **Device → Setup → Management → Permitted IP Addresses** y el
  **Management Profile** (qué servicios —SSH/HTTPS/SNMP— se exponen).
- Si se habilita gestión **in-band** sobre una interfaz de data plane, el control es un
  **Interface Management Profile** sobre esa interfaz (y, opcionalmente, reglas intrazone/interzone);
  no una zona "management".
- Conclusión: la idea pedagógica ("no administres in-band; usa OOB") es **válida y correcta**;
  la **representación** (zona `management` + regla `DENY`) es una **simplificación didáctica** que
  el `hint` debería declarar honestamente.

**Invariante #9:** no aplica (no hay NAT; `nat=NONE`).

### 4. Veredicto PROPUESTO — *pendiente de sign-off*
**`corregir` (solo dato del nivel).** Conservar el escenario y la solución `DENY` (sigue siendo
un buen "esto no debería permitirse"), pero **reformular `hint`/`explanation`** para nombrar el
mecanismo real: el MGT se protege con **Permitted IP Addresses + Management/Interface Management
Profile**, no con una regla de Security Policy a una zona `management`; y aclarar que la "zona
management" del simulador es una representación didáctica del plano separado. **No** se toca el
motor. Test que acompañaría (AC2): aserción de contenido sobre el `hint` (que mencione
"Permitted IP" / "Management Profile"). **PROPUESTO.**

---

## L38 — HA failover: Floating IP + Gratuitous ARP

### 1. Qué enseña hoy (cita de `levels.ts`)
- `title`: *"HA failover: Floating IP y Gratuitous ARP"*.
- `desc`/`hint`: *"En HA Active-Passive… los dispositivos necesitan saber que la **IP flotante**
  ahora está en otro puerto… el nuevo activo envía GARP…"*; *"las **Floating IPs** son IPs
  asignadas al firewall activo que se mueven al pasivo en caso de failover."*
- `packet`/`solution`: `untrust → trust`, `web-browsing`, DNAT, `ALLOW`, `profile=default`
  (vehículo genérico; el contenido HA vive solo en el texto).

### 2. El matiz preciso
El nivel llama **"Floating IP"** al mecanismo de **Active-Passive**. En PAN-OS, *"Floating IP"*
es terminología de **Active-Active**. El GARP descrito **sí es correcto**.

### 3. Análisis contra PAN-OS real (PCNSE)
- **Active/Passive:** los dos miembros del par comparten la **misma IP y MAC** en las interfaces
  de data plane; al hacer failover, el pasivo asume esa misma IP/MAC y envía **GARP** para que
  switches/routers actualicen ARP cache y tablas CAM. **No existe el concepto de "floating IP"**
  en A/P.
- **Active/Active:** aquí sí se usan **Floating IP addresses** (y/o ARP load-sharing). Cada
  floating IP la "posee" un dispositivo según **device priority** y puede migrar al peer en
  failover. **Este** es el contexto donde "Floating IP" es el término correcto.
- El nivel mezcla el término A/A con la narrativa A/P. La parte de GARP/CAM (≈ms vs ~20 min de
  expiración de ARP cache) es correcta y A/P-céntrica.

**Invariante #9:** observación fuera de alcance de R-04 — el bloque `nat` declara DNAT pero
`destination.original === translated === 10.1.1.100` (sin traducción real) y `dstZone=trust`
post-NAT; el paquete es un mero "vehículo" para el contenido HA, no un ejemplo limpio de DNAT.
No es el matiz de R-04 y no se aborda aquí.

### 4. Veredicto PROPUESTO — *pendiente de sign-off*
**`corregir` (solo dato del nivel).** Dos opciones para que Rodrigo elija:
- **(A) Reencuadrar a Active-Active** y mantener "Floating IP" como término correcto (cambia la
  narrativa de failover).
- **(B, recomendada) Mantener Active-Passive** y **quitar "Floating IP"**: decir que el par
  **comparte IP/MAC de interfaz** y que el failover se anuncia por **GARP** (conserva la
  narrativa GARP/CAM ya correcta). Implica tocar `title`, `desc`, `hint`, `explanation` en
  `levels.ts` y la fila de `accuracy-review.md`.
**No** se toca el motor (el contenido HA es puramente textual). Test que acompañaría (AC2):
aserción de contenido sobre `title`/`hint` (que A/P ya no diga "Floating IP"). **PROPUESTO.**

---

## L43 — Compliance: NIST CSF PR.AC-4 → PAN-OS

### 1. Qué enseña hoy (cita de `levels.ts`)
- `title`/`desc`: mapeo de **NIST CSF PR.AC-4** (least privilege) a funcionalidad PAN-OS.
- `packet`/`solution`: `trust → dmz`, `ssh`, `TCP/22`, `nat=NONE`, `ALLOW`, `profile=default`.
- `hint`/`explanation`: PR.AC-4 ↔ Security Policy + User-ID (grupo AD) + RBAC + zona exacta como
  evidencia de acceso por identidad. El mapeo de producto es sólido.

### 2. El matiz preciso
`PR.AC-4` es identificador de **NIST CSF 1.1**. En **CSF 2.0** (el que suele seguir el
curriculum) el control equivalente es **PR.AA-05**. Mismatch de versión del estándar.

### 3. Análisis contra el estándar real
- **NIST CSF 1.1 — PR.AC-4:** *"Access permissions and authorizations are managed, incorporating
  the principles of least privilege and separation of duties."*
- **NIST CSF 2.0** (publicado en feb-2024): la categoría de control de acceso se reorganizó en
  **PR.AA** ("Identity Management, Authentication, and Access Control"). El equivalente de
  PR.AC-4 es **PR.AA-05**: *"Access permissions, entitlements, and authorizations are defined in a
  policy, managed, enforced, and reviewed, and incorporate the principles of least privilege and
  separation of duties."*
- El **mapeo técnico a PAN-OS** (Security Policy + User-ID + RBAC + zona/App-ID) es **correcto en
  ambas versiones**; lo único en disputa es **qué versión del CSF** ancla el material.

**Invariante #9:** no aplica (no hay NAT; `nat=NONE`, intra `trust → dmz`).

### 4. Veredicto PROPUESTO — *pendiente de sign-off*
**`corregir` condicional (solo dato del nivel) — la decisión es de versión y es de Rodrigo:**
- Si el curriculum apunta a **CSF 2.0** → cambiar `PR.AC-4` por **`PR.AA-05`** en `title`/`desc`/
  `hint` (y, si se quiere, citar el linaje 1.1 → 2.0). Veredicto efectivo: **corregir**.
- Si el material se mantiene en **CSF 1.1** → el contenido es **`correcto`**; basta **etiquetar
  explícitamente "CSF 1.1"** para eliminar la ambigüedad.
En cualquier caso el mapeo PAN-OS no cambia y el **motor no se toca**. Test que acompañaría (AC2):
aserción de contenido sobre el identificador del control en el `hint`. **PROPUESTO.**

---

## Qué falta para cerrar R-04 (lo que NO hace este dossier)

1. **Firma per-nivel de Rodrigo** sobre cada veredicto PROPUESTO (incluida la elección A/B en L38
   y la versión CSF en L43).
2. Si firma "corregir": aplicar el cambio de texto en `levels.ts`, actualizar el `hint`, añadir el
   **test que fija el comportamiento** (AC2) y mover el nivel de `pending` → `corrected` en
   `src/data/sme-status.ts` y en la tabla de `accuracy-review.md`.
3. Pasar **R-04 a "Cerrado"** en `docs/risk-register.md`.

Hasta entonces, AC1/AC2/AC3 de PNR-1 permanecen **sin marcar**.
