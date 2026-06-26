# Curriculum Map — panrules-gameos v2.0

Mapa curricular de 43 niveles que cubre las certificaciones **NGFW Engineer** y **NetSec Architect** de Palo Alto Networks. Los niveles 1–10 ya están implementados. Los niveles 11–43 son el roadmap de contenido futuro.

**Columnas:**
- **ID** — identificador curricular único
- **Concepto PAN-OS** — habilidad o conocimiento enseñado
- **Nivel cubierto** — `L<n>` (implementado) o `PENDIENTE — Level N` (por crear)
- **Mechanic** — mecánica de juego principal del nivel
- **Tier** — `F` Fundamentals · `N` NGFW Engineer · `A` NetSec Architect

---

## NGFW Engineer Track

Seis dominios del examen oficial PCNSE / NGFW Engineer.

### Dominio 1: Configuration of PAN-OS Networking

| ID | Concepto PAN-OS | Nivel cubierto | Mechanic | Tier |
|---|---|---|---|---|
| NGFW-D1-01 | Security zones y asignación de interfaz L3 | L1 | policy-config | F |
| NGFW-D1-02 | SNAT saliente (egress masquerading) | L1 | policy-config + nat | F |
| NGFW-D1-03 | DNAT entrante (publicar servidor en DMZ) | L2 | policy-config + nat | F |
| NGFW-D1-04 | U-Turn / Hairpin NAT (DNAT+SNAT simultáneo) | L4 | policy-config + nat | F |
| NGFW-D1-05 | Tráfico intra-zona (misma zona, sin NAT) | L6 | policy-config | F |
| NGFW-D1-06 | Servicio application-default vs. puerto explícito | L3 | policy-config + specialCheck | F |
| NGFW-D1-07 | U-Turn NAT aplicado a RDP (jump host) | L10 | policy-config + nat | F |
| NGFW-D1-08 | Routing asimétrico y SNAT correctivo | PENDIENTE — Level 11 | policy-config + nat | N |
| NGFW-D1-09 | VPN IPSec site-to-site (ipsec-esp-udp) | PENDIENTE — Level 12 | policy-config + nat | N |
| NGFW-D1-10 | GlobalProtect (SSL/IPSec gateway) | PENDIENTE — Level 13 | policy-config | N |

### Dominio 2: Configuration of Device Settings

| ID | Concepto PAN-OS | Nivel cubierto | Mechanic | Tier |
|---|---|---|---|---|
| NGFW-D2-01 | NTP y sincronización de tiempo del dispositivo | PENDIENTE — Level 14 | policy-config | F |
| NGFW-D2-02 | Syslog y envío de logs a servidor externo | PENDIENTE — Level 15 | policy-config | F |
| NGFW-D2-03 | SNMP para monitoreo de dispositivo | PENDIENTE — Level 16 | policy-config | N |
| NGFW-D2-04 | Panorama: gestión centralizada (push de política) | PENDIENTE — Level 17 | policy-config | N |
| NGFW-D2-05 | Acceso de gestión (HTTPS a zona Management) | PENDIENTE — Level 18 | policy-config | N |

### Dominio 3: Integration and Automation

| ID | Concepto PAN-OS | Nivel cubierto | Mechanic | Tier |
|---|---|---|---|---|
| NGFW-D3-01 | External Dynamic Lists (EDL) como fuente en política | PENDIENTE — Level 19 | policy-config + address-objects | N |
| NGFW-D3-02 | DAG (Dynamic Address Groups) con tags de VM | PENDIENTE — Level 20 | policy-config + address-objects | N |
| NGFW-D3-03 | Bloqueo por reputación IP con EDL de Palo Alto | PENDIENTE — Level 21 | policy-config + address-objects | N |
| NGFW-D3-04 | XML API: commit y push programático | PENDIENTE — Level 22 | policy-config | N |

### Dominio 4: Creation of Object Configurations

| ID | Concepto PAN-OS | Nivel cubierto | Mechanic | Tier |
|---|---|---|---|---|
| NGFW-D4-01 | Address Objects: ip-netmask, FQDN, ip-range | PENDIENTE — Level 23 | policy-config + address-objects | N |
| NGFW-D4-02 | Address Groups: estáticos y dinámicos (DAG) | PENDIENTE — Level 24 | policy-config + address-objects | N |
| NGFW-D4-03 | Service Objects: puertos TCP/UDP personalizados | PENDIENTE — Level 25 | policy-config | N |
| NGFW-D4-04 | Security Profile Groups: componentes individuales | PENDIENTE — Level 26 | policy-config + profile-group | N |
| NGFW-D4-05 | Tags: organización de objetos y DAG | PENDIENTE — Level 27 | policy-config + address-objects | N |

### Dominio 5: Creation of Policies

| ID | Concepto PAN-OS | Nivel cubierto | Mechanic | Tier |
|---|---|---|---|---|
| NGFW-D5-01 | App-ID como clasificador (no puerto) — FTP en 2121 | L9 | policy-config | F |
| NGFW-D5-02 | Deny implícito al final del rulebase | L5 | policy-config | F |
| NGFW-D5-03 | URL Filtering en Security Profile (no en acción) | L7 | policy-config | F |
| NGFW-D5-04 | Bloqueo de DNS tunelizado (exfiltración) | L5 | policy-config | F |
| NGFW-D5-05 | Regla de DENY explícita vs. deny implícito | PENDIENTE — Level 28 | policy-config | N |
| NGFW-D5-06 | Orden de reglas: shadowing y first-match | PENDIENTE — Level 29 | rule-order | N |
| NGFW-D5-07 | Security Profile: AV + Vulnerability + WildFire | L8 | policy-config | F |
| NGFW-D5-08 | Política de Decryption (SSL Forward Proxy) | PENDIENTE — Level 30 | policy-config + decryption | N |
| NGFW-D5-09 | Decryption: SSL Inbound Inspection | PENDIENTE — Level 31 | policy-config + decryption | N |
| NGFW-D5-10 | DoS Protection Policy (rate limiting) | PENDIENTE — Level 32 | policy-config | N |

### Dominio 6: Management and Operation of NGFW

| ID | Concepto PAN-OS | Nivel cubierto | Mechanic | Tier |
|---|---|---|---|---|
| NGFW-D6-01 | Commit y verificación de cambios | L1–L10 | policy-config | F |
| NGFW-D6-02 | Traffic log: lectura e interpretación | PENDIENTE — Level 33 | log-analysis | N |
| NGFW-D6-03 | Threat log: identificar y responder a alertas | PENDIENTE — Level 34 | log-analysis | N |
| NGFW-D6-04 | WildFire: análisis de archivos sospechosos | PENDIENTE — Level 35 | policy-config | N |
| NGFW-D6-05 | Pre-NAT IP / Post-NAT zone en Security Policy | L2 + L4 + L8 + L10 | policy-config + nat | F |

---

## NetSec Architect Track

Cuatro dominios de diseño para arquitectura de seguridad de red.

### Dominio A1: Zero Trust Architecture Design

| ID | Concepto PAN-OS / Zero Trust | Nivel cubierto | Mechanic | Tier |
|---|---|---|---|---|
| ARCH-A1-01 | Microsegmentación con zonas granulares (IoT, Industrial) | PENDIENTE — Level 36 | policy-config + address-objects | A |
| ARCH-A1-02 | Least-privilege App-ID: bloquear `any` en producción | PENDIENTE — Level 37 | policy-config | A |
| ARCH-A1-03 | User-ID: política basada en usuario/grupo de AD | PENDIENTE — Level 38 | policy-config | A |
| ARCH-A1-04 | Segmentación de red OT/IT (zona Industrial) | PENDIENTE — Level 39 | policy-config + address-objects | A |
| ARCH-A1-05 | EDL de threat-intel: bloqueo dinámico de IPs/dominios | PENDIENTE — Level 40 | policy-config + address-objects | A |

### Dominio A2: HA & Redundancy Design

| ID | Concepto PAN-OS / HA | Nivel cubierto | Mechanic | Tier |
|---|---|---|---|---|
| ARCH-A2-01 | Active/Passive HA: failover y sincronización de sesión | PENDIENTE — Level 41 | design-choice | A |
| ARCH-A2-02 | Active/Active HA: distribución de carga y sesiones asimétricas | PENDIENTE — Level 42 | design-choice | A |
| ARCH-A2-03 | Virtual Systems (vSys): segmentación de tenant en un único chassis | PENDIENTE — Level 43 | design-choice | A |

### Dominio A3: Cloud & Scale Architecture

| ID | Concepto PAN-OS / Cloud | Nivel cubierto | Mechanic | Tier |
|---|---|---|---|---|
| ARCH-A3-01 | VM-Series en AWS/Azure: route tables y security VPC | PENDIENTE — Level 44 | design-choice | A |
| ARCH-A3-02 | Prisma Access: GlobalProtect cloud vs. on-prem | PENDIENTE — Level 45 | design-choice | A |
| ARCH-A3-03 | Panorama en cloud: gestión centralizada multi-site | PENDIENTE — Level 46 | design-choice | A |

### Dominio A4: Compliance & Frameworks

| ID | Marco / Concepto | Nivel cubierto | Mechanic | Tier |
|---|---|---|---|---|
| ARCH-A4-01 | NIST CSF: mapeo de controles PAN-OS a funciones (Detect, Respond) | PENDIENTE — Level 47 | design-choice | A |
| ARCH-A4-02 | PCI DSS: segmentación de zona Cardholder Data Environment (CDE) | PENDIENTE — Level 48 | policy-config + address-objects | A |
| ARCH-A4-03 | Zero Trust NIST SP 800-207: validación continua de identidad y dispositivo | PENDIENTE — Level 49 | design-choice | A |

---

## Resumen de cobertura

| Track | Dominios | Learning Objectives | Implementados | Pendientes |
|---|---|---|---|---|
| NGFW Engineer | 6 | 35 | 13 (L1–L10) | 22 (L11–L35) |
| NetSec Architect | 4 | 14 | 0 | 14 (L36–L49) |
| **Total** | **10** | **49** | **13** | **36** |

> Los niveles L1–L10 cubren 13 learning objectives únicos porque varios niveles refuerzan el mismo
> concepto (por ejemplo, el patrón pre-NAT/post-NAT aparece en L2, L4, L8 y L10).

---

## Mecánicas de juego planificadas

| Mechanic ID | Descripción | Primer nivel |
|---|---|---|
| `policy-config` | Configurar Security + NAT rulebase | L1 (existente) |
| `policy-config + specialCheck` | Validación con lógica especial de escenario | L3 (existente) |
| `policy-config + nat` | Énfasis en configuración del NAT rulebase | L1 (existente) |
| `policy-config + address-objects` | Selección de Address Objects en src/dst | L23 |
| `policy-config + profile-group` | Configurar Security Profile Group por componente | L26 |
| `policy-config + decryption` | Configurar Decryption rulebase adicional | L30 |
| `rule-order` | Ordenar múltiples reglas y detectar shadowing | L29 |
| `log-analysis` | Leer logs de tráfico/threat y derivar política | L33 |
| `design-choice` | Elegir entre opciones de arquitectura con justificación | L36 |
