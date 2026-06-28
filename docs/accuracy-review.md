# Accuracy Review — panrules-gameos v2.0

Tabla de revisión SME (Subject Matter Expert) para todos los niveles.
Cada nivel debe ser verificado por un profesional certificado PCNSE o NetSec Architect antes de producción.

> **Auditoría factual 2026-06-25 (criterio #1, PAN-OS 11.x).** Revisión técnica de los campos
> `hint`/`explanation` de los 43 niveles. Resultado inicial: **40 PASS**, **2 CRÍTICOS** (L4/L10),
> **4 con matiz de precisión** (L25/L34/L38/L43).
>
> **Correcciones aplicadas 2026-06-25:** los 2 críticos (L4/L10) y los 2 menores (L15/L28) fueron
> **CORREGIDOS** (gates verdes: typecheck + lint + 208 tests + build). Los **4 matices** (L25/L34/L38/L43)
> quedan **PENDIENTE de feedback del autor** antes de tocarlos. Estado `SME-verified` refleja **solo el
> criterio #1 (Factual accuracy)**; los criterios #2–#4 quedan PENDIENTE de firma del autor.
> Detalle en §"Hallazgos de la auditoría factual".

| ID  | Concepto                                     | Tier | Track            | SME-verified | Notas |
|-----|----------------------------------------------|------|------------------|--------------|-------|
| L1  | SNAT salida Trust→Untrust                    | F    | ngfw-engineer    | PASS (factual) | |
| L2  | DNAT inbound publicar servidor DMZ           | F    | ngfw-engineer    | PASS (factual) | IPs pre-NAT / zonas post-NAT — dato `dstZone=dmz` ✅ coincide con texto |
| L3  | application-default fuerza puerto estándar   | F    | ngfw-engineer    | PASS (factual) | specialCheck |
| L4  | U-Turn NAT (DNAT+SNAT)                       | F    | ngfw-engineer    | ✅ CORREGIDO  | `dstZone` cambiado a `dmz` (post-NAT); dstIp pública pre-NAT permanece. Cumple Invariante #9 |
| L5  | DNS exfiltration — DENY                      | F    | ngfw-engineer    | PASS (factual) | |
| L6  | Intra-zone RDP (sin NAT)                     | F    | ngfw-engineer    | PASS (factual) | |
| L7  | URL Filtering Guest (strict + SNAT)          | F    | ngfw-engineer    | PASS (factual) | |
| L8  | Publicar jump host RDP (DNAT + strict)       | F    | ngfw-engineer    | PASS (factual) | `dstZone=dmz` ✅ |
| L9  | Bloquear FTP saliente (App-ID + service any) | F    | ngfw-engineer    | PASS (factual) | |
| L10 | U-Turn para RDP jump host                    | F    | ngfw-engineer    | ✅ CORREGIDO  | `dstZone` cambiado a `dmz` (post-NAT); igual que L4 |
| L11 | First-match evaluation (ssl vs web-browsing) | N    | ngfw-engineer    | PASS (factual) | |
| L12 | Rule shadowing (any-any oculta DENY específico) | N | ngfw-engineer    | PASS (factual) | |
| L13 | Implicit deny: FTP DMZ→Untrust               | N    | ngfw-engineer    | PASS (factual) | |
| L14 | Intra-zone default allow: DENY lateral DMZ   | N    | ngfw-engineer    | PASS (factual) | intrazone-default citado correctamente |
| L15 | Una zona cubre múltiples interfaces          | N    | ngfw-engineer    | PASS (factual) | ✅ menor corregido: srcIp ahora 10.1.2.200 (coherente con WiFi 10.1.2.0/24) |
| L16 | Service object custom TCP/8443               | N    | ngfw-engineer    | PASS (factual) | |
| L17 | unknown-tcp aplicación propietaria           | N    | ngfw-engineer    | PASS (factual) | |
| L18 | Dynamic Address Group (DAG) tag-based        | N    | ngfw-engineer    | PASS (factual) | |
| L19 | Named Address Objects (no IP literales)      | N    | ngfw-engineer    | PASS (factual) | Best practice: objetos nombrados vs IPs directas |
| L20 | Address Group para simplificar política      | N    | ngfw-engineer    | PASS (factual) | Static vs Dynamic (DAG) |
| L21 | AV-only vs Threat Prevention completo        | N    | ngfw-engineer    | PASS (factual) | profileGroup con 4 componentes — descripción AV/Vuln/AntiSpyware/WildFire correcta |
| L22 | URL Filtering por categoría (strict)         | N    | ngfw-engineer    | PASS (factual) | Acciones allow/block/alert/continue correctas |
| L23 | File Blocking Profile DLP básico             | N    | ngfw-engineer    | PASS (factual) | MIME type vs extensión |
| L24 | External Dynamic List (EDL) threat intel     | N    | ngfw-engineer    | PASS (factual) | srcAddress = EDL; nodo Tor conocido ✅ |
| L25 | Decryption Policy SSL Forward Proxy          | N    | ngfw-engineer    | ✅ CORREGIDO (SME) | desc/hint/explanation reformulados: App-ID identifica por SNI/certificado sin decryption; el descifrado habilita Content-ID y sub-apps anidadas. specialCheck intacto. Rodrigo, sign-off 2026-06-28 |
| L26 | User-ID: política basada en grupo AD         | N    | ngfw-engineer    | PASS (factual) | Agentless vs Windows-based User-ID |
| L27 | Log Forwarding Profile → SIEM                | N    | ngfw-engineer    | PASS (factual) | PCI-DSS 10.x / 12 meses correcto |
| L28 | Application Filter: bloqueo por categoría    | N    | ngfw-engineer    | PASS (factual) | ✅ menor corregido: desc reformulado (firewall observa la sesión a Facebook como ssl) |
| L29 | Zone Protection Profile SYN flood            | N    | ngfw-engineer    | PASS (factual) | Actúa antes del security rulebase |
| L30 | Policy-Based Forwarding (PBF)                | N    | ngfw-engineer    | PASS (factual) | Orden PBF/NAT/Security aceptable (ver nota) |
| L31 | Zero Trust: micro-segmentación DMZ           | A    | netsec-architect | PASS (factual) | Intra-zone allow by default → DENY explícito |
| L32 | Zero Trust: Never-Trust-Always-Verify        | A    | netsec-architect | PASS (factual) | User-ID + HIP + perfil strict |
| L33 | Zero Trust: Least Privilege ruleset          | A    | netsec-architect | PASS (factual) | Policy Optimizer de Panorama ✅ |
| L34 | Management Plane Separation (OOB)            | A    | netsec-architect | ✅ CORREGIDO (SME) | hint reformulado: MGT protegido por Permitted IP Addresses + Management Interface Settings (Device > Setup > Management), no por Security Policy a zona management. Escenario DENY conservado. Rodrigo, sign-off 2026-06-28 |
| L35 | Prisma Access: SASE vs VPN tradicional       | A    | netsec-architect | PASS (factual) | PoP / Service Connection / Mobile Users |
| L36 | HA Active-Passive vs Active-Active           | A    | netsec-architect | PASS (factual) | Session Owner/Setup sync en AA |
| L37 | HA links: HA1 control vs HA2 datos           | A    | netsec-architect | PASS (factual) | Split-brain si HA1 falla |
| L38 | HA failover: IP/MAC compartida + Gratuitous ARP | A | netsec-architect | ✅ CORREGIDO (SME) | title/desc/hint/explanation reformulados: quitado "Floating IP" (término Active-Active); A/P comparte IP + MAC virtual (HA Group ID), failover por GARP, la MAC no cambia. Rodrigo, sign-off 2026-06-28 |
| L39 | Multi-ISP: ECMP + PBF                        | A    | netsec-architect | PASS (factual) | SD-WAN extiende con métricas de calidad |
| L40 | Panorama: Device Groups + Template Stacks    | A    | netsec-architect | PASS (factual) | Separación DG/Template correcta |
| L41 | Prisma Access: Service Connection vs Remote Network | A | netsec-architect | PASS (factual) | Branch=Remote Network; DC=Service Connection |
| L42 | SD-WAN: traffic steering SaaS (Office 365)   | A    | netsec-architect | PASS (factual) | DIA vs backhauling; App-ID office365-base |
| L43 | Compliance: NIST CSF PR.AC-4 (CSF 1.1) → PAN-OS | A | netsec-architect | ✅ CORREGIDO (SME) | curriculum.md no ancla versión CSF (solo cita funciones Detect/Respond) → se mantiene PR.AC-4 etiquetado "CSF 1.1" + equivalente CSF 2.0 PR.AA-05 (consolida PR.AC-3+PR.AC-4). Rodrigo, sign-off 2026-06-28 |

## Notas de revisión SME

### Criterios de verificación

Para marcar un nivel como **VERIFICADO**, el revisor SME debe confirmar:

1. **Factual accuracy**: El comportamiento de PAN-OS descrito en `hint` y `explanation` es correcto para PAN-OS 11.x.
2. **Pedagogical value**: El concepto enseñado es relevante para los exámenes NGFW Engineer o NetSec Architect.
3. **Solution correctness**: La `solution` del nivel es la respuesta óptima según best practices de Palo Alto.
4. **Hint clarity**: El `hint` es claro, conciso (2-3 frases) y no contiene errores que confundan al estudiante.

### Notas especiales

- **L2, L4, L10**: La invariante #9 (IPs pre-NAT / zonas post-NAT) debe estar explícita en el hint. Verificar que el texto no simplifique este comportamiento.
- **L21**: El `profileGroup` con 4 componentes es una mecánica nueva en v2. Verificar que el engine valide correctamente cada componente.
- **L25**: El `specialCheck` tiene 3 ramas (strict=WARNING, none=DROPPED, default=mismatch). Verificar que los mensajes sean pedagógicamente correctos.
- **L34**: La zona `management` en el simulador representa el Management Plane separado. En PAN-OS real, el puerto MGT no es parte del data plane — verificar que el hint lo explique correctamente.
- **L43**: El mapeo NIST CSF → PAN-OS es un tema complejo. Requiere revisión por alguien con experiencia en compliance además de conocimiento técnico de PAN-OS.

---

## Hallazgos de la auditoría factual (2026-06-25 · PAN-OS 11.x)

Criterio aplicado: *"El comportamiento de PAN-OS descrito en `hint` y `explanation` es correcto
para PAN-OS 11.x."* Auditoría por revisor con conocimiento PCNSE. **Código NO modificado** —
estos hallazgos quedan registrados para decisión del autor.

### ✅ RESUELTO (2026-06-25) — L4 y L10 (Hairpin / U-Turn): el dato ahora coincide con el texto

> Corregido: `packet.dstZone` y `solution.dstZone` cambiados de `untrust` a `dmz` en L4 y L10.
> La `dstIp` pública pre-NAT permanece. Gates verdes (typecheck + lint + 208 tests + build).
> Descripción del bug original (conservada para trazabilidad):

#### 🔴 CRÍTICO (original) — el texto era correcto pero el dato lo contradecía

El motor valida `config.dstZone === level.packet.dstZone` (firewall-engine.ts:80). En L4 y L10:

| Campo | Valor actual | Valor PCNSE-correcto |
|---|---|---|
| `packet.dstZone` | `untrust` | `dmz` |
| `solution.dstZone` | `untrust` | `dmz` |

La `explanation` enseña correctamente *"la regla debe ir de zona origen Trust a zona destino DMZ
aunque el paquete llegue dirigido a la IP pública"*, pero el motor valida `dstZone=untrust`. Es
decir: el juego entrena al jugador a configurar `untrust`, justo el error que el texto prohíbe.
Esto **viola el Invariante #9** de CLAUDE.md. Los DNAT puros (L2, L8) lo hacen bien (`dstZone=dmz`).

**Razón PAN-OS:** en U-Turn, tras el DNAT el route-lookup de la post-NAT IP (192.168.50.10/.20)
resuelve hacia DMZ → la Security Policy usa **dst zone = DMZ (post-NAT)** con **dst IP = pública
(pre-NAT)**. Es exactamente la lección que el nivel pretende enseñar.

**Fix propuesto:** en L4 y L10, cambiar `packet.dstZone` y `solution.dstZone` de `untrust` a `dmz`
(la `dstIp` pública pre-NAT permanece). Ajustar los tests correspondientes y revisar el
`packetLabel`/animación.

### ✅ RESUELTO (SME sign-off — Rodrigo, 2026-06-28) — MATIZ de precisión 11.x (L25/L34/L38/L43)

> El autor (PCNSE) firmó los 4 veredictos PROPUESTOS del dossier R-04 y autorizó aplicar las
> correcciones **text-only** (sin cambios de motor ni de invariantes). Estado SME de los 4 niveles:
> `pending` → `corrected` (`src/data/sme-status.ts`). R-04 pasa a **Cerrado** en `risk-register.md`.
> Descripción original del matiz conservada para trazabilidad, con la resolución aplicada por nivel:

- **L25 (Decryption):** *(original)* *"sin decryption, App-ID solo puede identificar 'ssl'"* — impreciso
  en 11.x. **Resolución (sign-off):** `desc`/`hint`/`explanation` reformulados: App-ID identifica muchas
  apps HTTPS por **SNI + certificado TLS** (p. ej. linkedin-base, facebook-base) sin descifrar; el
  descifrado habilita **Content-ID** (Threat Prevention/WildFire/URL Filtering) y App-ID sobre sub-apps
  anidadas. El `specialCheck` (3 ramas terminales, WARNING de la rama `strict`) se conserva intacto.
- **L34 (Mgmt plane):** *(original)* PAN-OS protege el puerto MGT con Permitted IP Addresses, no con una
  Security Policy a una "zona management". **Resolución (sign-off):** `hint` reformulado para nombrar el
  mecanismo real — **Permitted IP Addresses + Management Interface Settings (Device > Setup > Management)**,
  no una Security Policy a una zona `management`; la "zona management" del simulador se declara como
  representación didáctica. Se conserva el escenario y la solución `DENY`.
- **L38 (HA failover):** *(original)* llamaba *"Floating IP"* (término Active-Active) al failover
  Active-Passive. **Resolución (sign-off):** `title`/`desc`/`hint`/`explanation` reformulados — se quita
  "Floating IP"; en A/P el par **comparte la misma IP y una MAC virtual (derivada del HA Group ID)** y el
  failover se anuncia por **GARP**; la MAC **no cambia** en el failover (solo cambia el puerto que responde).
- **L43 (NIST CSF):** *(original)* usa **PR.AC-4** (NIST CSF 1.1). **Resolución (sign-off):** `curriculum.md`
  **no ancla** una versión de CSF (solo cita funciones Detect/Respond, comunes a 1.1 y 2.0) → ambiguo, por lo
  que se **mantiene PR.AC-4** etiquetado explícitamente **"CSF 1.1"** con su equivalente **CSF 2.0 = PR.AA-05**
  (que consolida PR.AC-3 + PR.AC-4, no es un renombrado 1:1). El mapeo PAN-OS y el motor no cambian.

> **Dossier SME (R-04):** análisis grounded por nivel + veredictos en [sme-dossier-R04.md](sme-dossier-R04.md).
> Los 4 veredictos quedaron **FIRMADOS** por el autor (Rodrigo, 2026-06-28) y aplicados text-only; R-04 cerrado.

### 🔵 MENORES (datos del escenario, no del comportamiento PAN-OS)

- **L15:** el `desc` menciona WiFi `10.1.2.0/24` pero `srcIp=10.1.1.200` (pertenece a la LAN).
- **L28:** `packet.app='ssl'` mientras el escenario habla de *social-networking* (el catálogo de
  apps no incluye redes sociales; se usa `ssl` como proxy).

### Nota sobre L30 (orden PBF)

*"PBF se evalúa antes del security rulebase pero después de la NAT rulebase"* es aceptable a nivel
examen: PBF se evalúa tras el **destination-NAT lookup** (para el route-lookup) y antes de la
Security Policy; el **source-NAT** se aplica después. Verdadero con la salvedad de que "NAT rulebase"
se interpreta como el *lookup* de destino, no la aplicación completa de NAT.
