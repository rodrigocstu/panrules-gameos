# Accuracy Review — panrules-gameos v2.0

Tabla de revisión SME (Subject Matter Expert) para todos los niveles.
Cada nivel debe ser verificado por un profesional certificado PCNSE o NetSec Architect antes de producción.

| ID  | Concepto                                     | Tier | Track            | SME-verified | Notas |
|-----|----------------------------------------------|------|------------------|--------------|-------|
| L1  | SNAT salida Trust→Untrust                    | F    | ngfw-engineer    | PENDIENTE    | |
| L2  | DNAT inbound publicar servidor DMZ           | F    | ngfw-engineer    | PENDIENTE    | IPs pre-NAT / zonas post-NAT |
| L3  | application-default fuerza puerto estándar   | F    | ngfw-engineer    | PENDIENTE    | specialCheck |
| L4  | U-Turn NAT (DNAT+SNAT)                       | F    | ngfw-engineer    | PENDIENTE    | Hairpin / pre-NAT IPs |
| L5  | DNS exfiltration — DENY                      | F    | ngfw-engineer    | PENDIENTE    | |
| L6  | Intra-zone RDP (sin NAT)                     | F    | ngfw-engineer    | PENDIENTE    | |
| L7  | URL Filtering Guest (strict + SNAT)          | F    | ngfw-engineer    | PENDIENTE    | |
| L8  | Publicar jump host RDP (DNAT + strict)       | F    | ngfw-engineer    | PENDIENTE    | |
| L9  | Bloquear FTP saliente (App-ID + service any) | F    | ngfw-engineer    | PENDIENTE    | |
| L10 | U-Turn para RDP jump host                    | F    | ngfw-engineer    | PENDIENTE    | |
| L11 | First-match evaluation (ssl vs web-browsing) | N    | ngfw-engineer    | PENDIENTE    | |
| L12 | Rule shadowing (any-any oculta DENY específico) | N | ngfw-engineer    | PENDIENTE    | |
| L13 | Implicit deny: FTP DMZ→Untrust               | N    | ngfw-engineer    | PENDIENTE    | |
| L14 | Intra-zone default allow: DENY lateral DMZ   | N    | ngfw-engineer    | PENDIENTE    | |
| L15 | Una zona cubre múltiples interfaces          | N    | ngfw-engineer    | PENDIENTE    | |
| L16 | Service object custom TCP/8443               | N    | ngfw-engineer    | PENDIENTE    | |
| L17 | unknown-tcp aplicación propietaria           | N    | ngfw-engineer    | PENDIENTE    | |
| L18 | Dynamic Address Group (DAG) tag-based        | N    | ngfw-engineer    | PENDIENTE    | |
| L19 | Named Address Objects (no IP literales)      | N    | ngfw-engineer    | PENDIENTE    | Best practice: objetos nombrados vs IPs directas |
| L20 | Address Group para simplificar política      | N    | ngfw-engineer    | PENDIENTE    | Static vs Dynamic (DAG) |
| L21 | AV-only vs Threat Prevention completo        | N    | ngfw-engineer    | PENDIENTE    | Requiere revisión de profileGroup con 4 componentes |
| L22 | URL Filtering por categoría (strict)         | N    | ngfw-engineer    | PENDIENTE    | Acciones: allow/block/alert/continue |
| L23 | File Blocking Profile DLP básico             | N    | ngfw-engineer    | PENDIENTE    | MIME type vs extensión |
| L24 | External Dynamic List (EDL) threat intel     | N    | ngfw-engineer    | PENDIENTE    | srcAddress = EDL; nodo Tor conocido |
| L25 | Decryption Policy SSL Forward Proxy          | N    | ngfw-engineer    | PENDIENTE    | specialCheck: strict=WARNING, none=DROPPED, default=mismatch |
| L26 | User-ID: política basada en grupo AD         | N    | ngfw-engineer    | PENDIENTE    | Agentless vs Windows-based User-ID |
| L27 | Log Forwarding Profile → SIEM                | N    | ngfw-engineer    | PENDIENTE    | PCI-DSS 10.x requiere centralización |
| L28 | Application Filter: bloqueo por categoría    | N    | ngfw-engineer    | PENDIENTE    | Application Filter vs App-ID individual |
| L29 | Zone Protection Profile SYN flood            | N    | ngfw-engineer    | PENDIENTE    | Actúa antes del security rulebase |
| L30 | Policy-Based Forwarding (PBF)                | N    | ngfw-engineer    | PENDIENTE    | PBF antes de Security, después de NAT |
| L31 | Zero Trust: micro-segmentación DMZ           | A    | netsec-architect | PENDIENTE    | Intra-zone allow by default → DENY explícito |
| L32 | Zero Trust: Never-Trust-Always-Verify        | A    | netsec-architect | PENDIENTE    | User-ID + HIP + perfil strict |
| L33 | Zero Trust: Least Privilege ruleset          | A    | netsec-architect | PENDIENTE    | Policy Optimizer de Panorama |
| L34 | Management Plane Separation (OOB)            | A    | netsec-architect | PENDIENTE    | MGT port tiene routing table propia |
| L35 | Prisma Access: SASE vs VPN tradicional       | A    | netsec-architect | PENDIENTE    | PoP / Service Connection / Mobile Users |
| L36 | HA Active-Passive vs Active-Active           | A    | netsec-architect | PENDIENTE    | Session Owner/Setup sync en AA |
| L37 | HA links: HA1 control vs HA2 datos           | A    | netsec-architect | PENDIENTE    | Split-brain si HA1 falla |
| L38 | HA failover: Floating IP + Gratuitous ARP    | A    | netsec-architect | PENDIENTE    | GARP fuerza actualización ARP/CAM inmediata |
| L39 | Multi-ISP: ECMP + PBF                        | A    | netsec-architect | PENDIENTE    | SD-WAN extiende con métricas de calidad |
| L40 | Panorama: Device Groups + Template Stacks    | A    | netsec-architect | PENDIENTE    | Herencia jerárquica Shared→Regional→Local |
| L41 | Prisma Access: Service Connection vs Remote Network | A | netsec-architect | PENDIENTE | Branch=Remote Network; DC=Service Connection |
| L42 | SD-WAN: traffic steering SaaS (Office 365)   | A    | netsec-architect | PENDIENTE    | DIA vs backhauling; App-ID office365-base |
| L43 | Compliance: NIST CSF PR.AC-4 → PAN-OS        | A    | netsec-architect | PENDIENTE    | Requiere revisión del autor — mapeo compliance |

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
