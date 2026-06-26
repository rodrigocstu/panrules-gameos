// Escenarios ("tickets") del simulador, como datos puros (sin React).
//
// Cada nivel: { id, title, desc, packet, solution, hint, explanation, nat, specialCheck? }
//  - title/desc/hint/explanation: TEXTO BILINGÜE (T3.6) — objeto { es, en }. Se
//    resuelve en la UI con pickText(field, lang) (src/i18n/I18nContext.jsx).
//  - packet:      el tráfico entrante que el jugador observa (datos del motor).
//  - solution:    la política correcta esperada (fuente de verdad de la validación).
//  - hint:        pista corta (T2.8) mostrada DURANTE la configuración ("Pista").
//  - explanation: microlección del "por qué" (T2.7), mostrada en el resultado.
//  - nat:         datos de la regla NAT del escenario (T2.6): qué se traduce.
//  - specialCheck: validación específica del nivel (hoy solo nivel 3). Sus `msg`
//                  contienen las palabras clave DROPPED/WARNING que el motor usa
//                  para CLASIFICAR; el texto mostrado al usuario se traduce por
//                  reasonCode en la UI (no se lee de aquí).
//
// CONTENIDO PEDAGÓGICO (WP-3 / T2.7-T2.8): PCNSE en ES y EN. Los niveles 2 (DNAT
// entrante) y 4 (hairpin / U-Turn) enseñan EXPLÍCITAMENTE que la Security Policy
// evalúa IPs pre-NAT pero zonas post-NAT (CLAUDE.md §Invariante #9).
//
// --- Modelo de NAT (PAN-OS real, T2.6) ---
// El NAT Rulebase es una tabla SEPARADA de la Security Policy. Cada `nat` block:
//  - type / source{original,translated} / destination{original,translated} / packetLabel.
//  - Cuando una dirección no se traduce, translated === original ("identidad").

import type { Level } from '../types/domain.js';

export const LEVELS: Level[] = [
  {
    id: 1,
    tier: 'F',
    tracks: ['ngfw-engineer'],
    title: { es: 'Acceso seguro a Internet', en: 'Secure Internet Access' },
    desc: {
      es: 'Los usuarios de Trust necesitan navegar por sitios web seguros. La política exige protección Antivirus básica.',
      en: 'Users in Trust need to browse secure websites. Policy requires basic Antivirus protection.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'untrust',
      srcIp: '10.1.1.55',
      dstIp: '142.250.1.1',
      proto: 'TCP/443',
      app: 'ssl',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'untrust',
      app: 'ssl',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'SNAT',
      profile: 'default',
    },
    nat: {
      type: 'SNAT',
      source: { original: '10.1.1.55', translated: '203.0.113.1' },
      destination: { original: '142.250.1.1', translated: '142.250.1.1' },
      packetLabel: 'SNAT: 203.0.113.1',
    },
    hint: {
      es: 'Tráfico de salida Trust -> Untrust con App-ID ssl. Necesita Source NAT (SNAT) para traducir la IP privada del cliente a la IP pública del firewall, y al menos un perfil de Antivirus para inspeccionar el tráfico permitido.',
      en: 'Outbound Trust -> Untrust traffic with App-ID ssl. It needs Source NAT (SNAT) to translate the client private IP to the firewall public IP, and at least an Antivirus profile to inspect the allowed traffic.',
    },
    explanation: {
      es: 'En una salida a Internet, PAN-OS aplica Source NAT (SNAT) para que la IP privada del cliente (10.1.1.55) se traduzca a la IP pública del firewall al salir por la zona Untrust; el destino no cambia. La Security Policy solo inspecciona amenazas en el tráfico que PERMITE, por eso una regla allow requiere un Security Profile (al menos Antivirus) para protegerte de malware en las webs que visitas.',
      en: 'On an outbound flow to the Internet, PAN-OS applies Source NAT (SNAT) so the client private IP (10.1.1.55) is translated to the firewall public IP as it egresses the Untrust zone; the destination is unchanged. The Security Policy only inspects threats on the traffic it ALLOWS, which is why an allow rule requires a Security Profile (at least Antivirus) to protect you from malware on the sites you visit.',
    },
  },
  {
    id: 2,
    tier: 'F',
    tracks: ['ngfw-engineer'],
    title: { es: 'Publicar el servidor web de la DMZ', en: 'Publishing DMZ Web Server' },
    desc: {
      es: 'Usuarios de Internet necesitan acceder al Portal de la empresa alojado en la DMZ.',
      en: 'Public internet users need to access our Company Portal hosted in the DMZ.',
    },
    packet: {
      srcZone: 'untrust',
      dstZone: 'dmz',
      srcIp: '203.0.113.50',
      dstIp: '203.0.113.1',
      proto: 'TCP/80',
      app: 'web-browsing',
    },
    solution: {
      srcZone: 'untrust',
      dstZone: 'dmz',
      app: 'web-browsing',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'DNAT',
      profile: 'default',
    },
    nat: {
      type: 'DNAT',
      source: { original: '203.0.113.50', translated: '203.0.113.50' },
      destination: { original: '203.0.113.1', translated: '192.168.50.10' },
      packetLabel: 'DNAT: 192.168.50.10',
    },
    hint: {
      es: 'Tráfico entrante desde Untrust hacia un servidor publicado. Necesita Destination NAT (DNAT) para traducir la IP pública (203.0.113.1) a la IP real del servidor en la DMZ. Recuerda: la Security Policy se evalúa con la IP destino pre-NAT (la pública), pero ya con la zona destino post-NAT (DMZ).',
      en: 'Inbound traffic from Untrust to a published server. It needs Destination NAT (DNAT) to translate the public IP (203.0.113.1) to the real server IP in the DMZ. Remember: the Security Policy is evaluated with the pre-NAT destination IP (the public one), but already with the post-NAT destination zone (DMZ).',
    },
    explanation: {
      es: 'En PAN-OS la Security Policy compara las IPs originales del paquete (pre-NAT), pero la zona destino ya es la post-NAT. Por eso en un DNAT entrante la regla debe tener la zona destino interna (DMZ) aunque el paquete llegue dirigido a la IP pública: el firewall hace el route-lookup tras aplicar el DNAT para determinar la zona destino, pero la regla de seguridad sigue viendo la IP destino pública original. Resultado: src/dst IP = pre-NAT, src/dst zone = post-NAT.',
      en: 'In PAN-OS the Security Policy compares the packet original IPs (pre-NAT), but the destination zone is already the post-NAT one. That is why, for an inbound DNAT, the rule must have the internal destination zone (DMZ) even though the packet arrives addressed to the public IP: the firewall does the route lookup after applying the DNAT to determine the destination zone, but the security rule still sees the original public destination IP. Result: src/dst IP = pre-NAT, src/dst zone = post-NAT.',
    },
  },
  {
    id: 3,
    tier: 'F',
    tracks: ['ngfw-engineer'],
    title: { es: 'Bloquear SSH en puerto no estándar', en: 'Block Non-Standard SSH' },
    desc: {
      es: 'Un desarrollador interno intenta conectarse por SSH a un servidor de la DMZ usando un puerto alto no estándar (2222).',
      en: 'An internal developer is trying to SSH to a server in the DMZ using a non-standard high port (2222).',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'dmz',
      srcIp: '10.1.1.100',
      dstIp: '192.168.50.5',
      proto: 'TCP/2222',
      app: 'ssh',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'dmz',
      app: 'ssh',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'NONE',
      profile: 'none',
    },
    nat: {
      type: 'NONE',
      source: { original: '10.1.1.100', translated: '10.1.1.100' },
      destination: { original: '192.168.50.5', translated: '192.168.50.5' },
      packetLabel: '10.1.1.100',
    },
    specialCheck: (userConfig) => {
      if (userConfig.service === 'application-default')
        return {
          success: false,
          msg: "DROPPED: App-ID 'ssh' on port 2222 contradicts 'application-default' (Port 22). Good job enforcing standards!",
        };
      if (userConfig.service === 'any')
        return {
          success: true,
          msg: 'WARNING: You allowed SSH on a non-standard port. It works, but violates security best practice.',
        };
      return {
        success: false,
        msg: "Service Mismatch: para este escenario el servicio debe ser 'application-default' (fuerza el puerto estándar y DROPea el SSH en 2222) o 'any' (lo permite con aviso).",
      };
    },
    hint: {
      es: "Usa el servicio 'application-default' para obligar a que cada App-ID solo se permita en su puerto estándar. Como ssh está intentando usar el puerto 2222 (no el 22), con application-default el paquete cae solo y aplicas la buena práctica.",
      en: "Use the 'application-default' service to force each App-ID to be allowed only on its standard port. Since ssh is trying to use port 2222 (not 22), with application-default the packet drops on its own and you enforce best practice.",
    },
    explanation: {
      es: "El servicio 'application-default' indica a PAN-OS que permita cada aplicación únicamente en los puertos que App-ID considera estándar para ella. App-ID identifica el tráfico como ssh, cuyo puerto estándar es el 22, pero este paquete llega al 2222: como el puerto no coincide con el application-default, la regla no hace match y el tráfico se descarta. Así fuerzas a que SSH solo viaje por su puerto legítimo sin necesidad de una regla de bloqueo explícita.",
      en: "The 'application-default' service tells PAN-OS to allow each application only on the ports App-ID considers standard for it. App-ID identifies the traffic as ssh, whose standard port is 22, but this packet arrives on 2222: since the port does not match application-default, the rule does not match and the traffic is discarded. This forces SSH to travel only over its legitimate port without an explicit block rule.",
    },
  },
  {
    id: 4,
    tier: 'F',
    tracks: ['ngfw-engineer'],
    title: { es: 'NAT en horquilla (U-Turn)', en: 'The Hairpin (U-Turn) NAT' },
    desc: {
      es: 'Un usuario interno (Trust) intenta acceder al servidor web de la DMZ a través de su IP PÚBLICA.',
      en: 'An internal user (Trust) is trying to access the DMZ Web Server via its PUBLIC IP.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'dmz',
      srcIp: '10.1.1.50',
      dstIp: '203.0.113.1',
      proto: 'TCP/80',
      app: 'web-browsing',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'dmz',
      app: 'web-browsing',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'DNAT+SNAT',
      profile: 'default',
    },
    nat: {
      type: 'DNAT+SNAT',
      source: { original: '10.1.1.50', translated: '203.0.113.1' },
      destination: { original: '203.0.113.1', translated: '192.168.50.10' },
      packetLabel: 'U-TURN -> 192.168.50.10',
    },
    hint: {
      es: 'Hairpin (U-Turn): un usuario interno accede al servidor de la DMZ por su IP PÚBLICA. Necesita DNAT (para alcanzar el servidor real) Y SNAT (para que el servidor responda al firewall y no directo al usuario, evitando rutas asimétricas). La Security Policy se evalúa con las IPs pre-NAT pero con la zona destino post-NAT.',
      en: 'Hairpin (U-Turn): an internal user reaches the DMZ server via its PUBLIC IP. It needs DNAT (to reach the real server) AND SNAT (so the server replies to the firewall, not directly to the user, avoiding asymmetric routing). The Security Policy is evaluated with the pre-NAT IPs but with the post-NAT destination zone.',
    },
    explanation: {
      es: 'En el U-Turn NAT la Security Policy compara las IPs originales del paquete (pre-NAT): el usuario sigue apuntando a la IP pública 203.0.113.1, así que esa es la IP destino que ve la regla. Pero la zona destino ya es la post-NAT: tras el DNAT el route-lookup resuelve hacia la DMZ, por lo que la regla debe ir de zona origen Trust a zona destino DMZ aunque el paquete llegue dirigido a la IP pública. Además hace falta SNAT para traducir el origen al firewall, de modo que el servidor responda al firewall y no directamente al usuario interno (lo que rompería la sesión por enrutamiento asimétrico).',
      en: 'In U-Turn NAT the Security Policy compares the packet original IPs (pre-NAT): the user still targets the public IP 203.0.113.1, so that is the destination IP the rule sees. But the destination zone is already the post-NAT one: after the DNAT the route lookup resolves toward the DMZ, so the rule must go from source zone Trust to destination zone DMZ even though the packet arrives addressed to the public IP. SNAT is also needed to translate the source to the firewall, so the server replies to the firewall and not directly to the internal user (which would break the session due to asymmetric routing).',
    },
  },
  {
    id: 5,
    tier: 'F',
    tracks: ['ngfw-engineer'],
    title: { es: 'Intento de exfiltración de datos', en: 'Data Exfiltration Attempt' },
    desc: {
      es: 'Un host comprometido en Guest intenta tunelizar datos por DNS hacia una IP sospechosa.',
      en: 'A compromised host in Guest is trying to tunnel data via DNS to a suspicious IP.',
    },
    packet: {
      srcZone: 'guest',
      dstZone: 'untrust',
      srcIp: '172.16.0.99',
      dstIp: '1.2.3.4',
      proto: 'UDP/53',
      app: 'dns',
    },
    solution: {
      srcZone: 'guest',
      dstZone: 'untrust',
      app: 'dns',
      service: 'application-default',
      action: 'DENY',
      nat: 'NONE',
      profile: 'any',
    },
    nat: {
      type: 'NONE',
      source: { original: '172.16.0.99', translated: '172.16.0.99' },
      destination: { original: '1.2.3.4', translated: '1.2.3.4' },
      packetLabel: '172.16.0.99',
    },
    hint: {
      es: 'Un host comprometido en Guest intenta tunelizar datos por DNS hacia una IP sospechosa. La política correcta es una regla de acción DENY (deny). Una regla deny descarta el paquete en la Security Policy: nunca llega al NAT rulebase ni se le aplican perfiles de seguridad.',
      en: 'A compromised host in Guest tries to tunnel data over DNS to a suspicious IP. The correct policy is a DENY action rule. A deny rule discards the packet in the Security Policy: it never reaches the NAT rulebase, nor are security profiles applied.',
    },
    explanation: {
      es: 'PAN-OS evalúa la Security Policy de arriba abajo y aplica la primera regla que hace match; aquí la acción correcta es deny para cortar el túnel DNS de exfiltración. Cuando una regla deny hace match, el paquete se descarta en la propia Security Policy: no continúa al NAT rulebase ni se le aplican Security Profiles, porque esos solo inspeccionan el tráfico que se PERMITE. Por eso en este escenario el tipo de NAT y el perfil son irrelevantes: lo único que importa es bloquear.',
      en: 'PAN-OS evaluates the Security Policy top-down and applies the first matching rule; here the correct action is deny to cut the DNS exfiltration tunnel. When a deny rule matches, the packet is discarded in the Security Policy itself: it does not continue to the NAT rulebase, nor are Security Profiles applied, because those only inspect ALLOWED traffic. That is why in this scenario the NAT type and the profile are irrelevant: the only thing that matters is to block.',
    },
  },
  {
    id: 6,
    tier: 'F',
    tracks: ['ngfw-engineer'],
    title: { es: 'Acceso RDP intra-zona', en: 'Intra-zone RDP Access' },
    desc: {
      es: 'Un administrador en Trust necesita RDP a un servidor de gestión en la MISMA zona Trust.',
      en: 'An admin in Trust needs RDP access to a management server in the SAME Trust zone.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'trust',
      srcIp: '10.1.1.20',
      dstIp: '10.1.1.30',
      proto: 'TCP/3389',
      app: 'ms-rdp',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'trust',
      app: 'ms-rdp',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'NONE',
      profile: 'default',
    },
    nat: {
      type: 'NONE',
      source: { original: '10.1.1.20', translated: '10.1.1.20' },
      destination: { original: '10.1.1.30', translated: '10.1.1.30' },
      packetLabel: '10.1.1.20',
    },
    hint: {
      es: 'Tráfico intra-zona (Trust -> Trust): no necesita NAT, porque las IPs no cambian dentro de una misma zona. Aun así, App-ID y los perfiles SÍ aplican: declara ms-rdp con un perfil para inspeccionar movimiento lateral.',
      en: 'Intra-zone traffic (Trust -> Trust): no NAT is needed, because IPs do not change within the same zone. Still, App-ID and profiles DO apply: declare ms-rdp with a profile to inspect lateral movement.',
    },
    explanation: {
      es: 'El tráfico dentro de una misma zona (intrazona) no requiere NAT: el origen y el destino están en el mismo segmento, así que no hay traducción de direcciones. PAN-OS permite el tráfico intrazona por defecto, pero puedes (y debes) crear una regla explícita con App-ID y un Security Profile para inspeccionar el movimiento lateral; aquí RDP entre hosts internos debe permitirse pero con inspección de amenazas.',
      en: 'Traffic within the same zone (intra-zone) requires no NAT: source and destination are on the same segment, so there is no address translation. PAN-OS allows intra-zone traffic by default, but you can (and should) create an explicit rule with App-ID and a Security Profile to inspect lateral movement; here RDP between internal hosts should be allowed but with threat inspection.',
    },
  },
  {
    id: 7,
    tier: 'F',
    tracks: ['ngfw-engineer'],
    title: { es: 'Filtrado de URL para invitados', en: 'URL Filtering for Guests' },
    desc: {
      es: 'Los invitados pueden navegar la web, pero hay que bloquear categorías peligrosas (malware, phishing).',
      en: 'Guests may browse the web, but dangerous categories (malware, phishing) must be blocked.',
    },
    packet: {
      srcZone: 'guest',
      dstZone: 'untrust',
      srcIp: '172.16.0.40',
      dstIp: '93.184.216.34',
      proto: 'TCP/80',
      app: 'web-browsing',
    },
    solution: {
      srcZone: 'guest',
      dstZone: 'untrust',
      app: 'web-browsing',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'SNAT',
      profile: 'strict',
    },
    nat: {
      type: 'SNAT',
      source: { original: '172.16.0.40', translated: '203.0.113.1' },
      destination: { original: '93.184.216.34', translated: '93.184.216.34' },
      packetLabel: 'SNAT: 203.0.113.1',
    },
    hint: {
      es: 'Para bloquear categorías web no se usa una regla deny: se PERMITE web-browsing y se adjunta un perfil que incluya URL Filtering. El perfil Strict (URL + WildFire) cubre eso. Como es salida a Internet desde Guest, también necesita SNAT.',
      en: 'To block web categories you do not use a deny rule: you ALLOW web-browsing and attach a profile that includes URL Filtering. The Strict profile (URL + WildFire) covers that. Since this is Guest egress to the Internet, it also needs SNAT.',
    },
    explanation: {
      es: 'El filtrado de categorías de URL vive en un Security Profile (URL Filtering), no en la acción de la regla. Para bloquear malware o phishing mantienes la regla en allow para web-browsing y le adjuntas un perfil que incluya URL Filtering: aquí el perfil Strict aporta URL Filtering y WildFire. Además, al salir de la zona Guest a Internet se aplica Source NAT para traducir la IP privada del invitado a la IP pública del firewall.',
      en: 'URL category filtering lives in a Security Profile (URL Filtering), not in the rule action. To block malware or phishing you keep the rule as allow for web-browsing and attach a profile that includes URL Filtering: here the Strict profile provides URL Filtering and WildFire. Also, egressing the Guest zone to the Internet applies Source NAT to translate the guest private IP to the firewall public IP.',
    },
  },
  {
    id: 8,
    tier: 'F',
    tracks: ['ngfw-engineer'],
    title: { es: 'Publicar un jump host RDP', en: 'Publish an RDP Jump Host' },
    desc: {
      es: 'Un proveedor externo necesita RDP a un jump host de la DMZ a través de su IP pública.',
      en: 'An external vendor needs RDP to a DMZ jump host via its public IP.',
    },
    packet: {
      srcZone: 'untrust',
      dstZone: 'dmz',
      srcIp: '198.51.100.7',
      dstIp: '203.0.113.2',
      proto: 'TCP/3389',
      app: 'ms-rdp',
    },
    solution: {
      srcZone: 'untrust',
      dstZone: 'dmz',
      app: 'ms-rdp',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'DNAT',
      profile: 'strict',
    },
    nat: {
      type: 'DNAT',
      source: { original: '198.51.100.7', translated: '198.51.100.7' },
      destination: { original: '203.0.113.2', translated: '192.168.50.20' },
      packetLabel: 'DNAT: 192.168.50.20',
    },
    hint: {
      es: 'RDP entrante a un jump host: necesita Destination NAT (DNAT) para traducir la IP pública (203.0.113.2) al host real de la DMZ. La Security Policy se evalúa con la IP destino pre-NAT (la pública) pero con la zona destino post-NAT (DMZ). Exponer RDP a Internet exige un perfil Strict.',
      en: 'Inbound RDP to a jump host: needs Destination NAT (DNAT) to translate the public IP (203.0.113.2) to the real DMZ host. The Security Policy is evaluated with the pre-NAT destination IP (the public one) but with the post-NAT destination zone (DMZ). Exposing RDP to the Internet demands a Strict profile.',
    },
    explanation: {
      es: 'Como en cualquier servicio publicado, el DNAT traduce la IP pública a la IP interna del servidor. Recuerda el orden de PAN-OS: la Security Policy ve la IP destino original (pre-NAT, la pública) pero la zona destino ya es la post-NAT (DMZ), así que la regla debe ir de Untrust a DMZ. RDP expuesto a Internet es un objetivo frecuente de fuerza bruta y exploits, por eso se exige el perfil más estricto (Vulnerability Protection + WildFire).',
      en: 'As with any published service, DNAT translates the public IP to the server internal IP. Remember the PAN-OS order: the Security Policy sees the original destination IP (pre-NAT, the public one) but the destination zone is already post-NAT (DMZ), so the rule must go from Untrust to DMZ. RDP exposed to the Internet is a frequent target of brute force and exploits, which is why the strictest profile is required (Vulnerability Protection + WildFire).',
    },
  },
  {
    id: 9,
    tier: 'F',
    tracks: ['ngfw-engineer'],
    title: { es: 'Bloquear FTP saliente', en: 'Block Outbound FTP' },
    desc: {
      es: 'La política prohíbe FTP en claro hacia Internet por fuga de datos. App-ID lo detecta aunque use un puerto raro.',
      en: 'Policy forbids cleartext FTP to the Internet (data leakage). App-ID detects it even on an odd port.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'untrust',
      srcIp: '10.1.1.77',
      dstIp: '45.33.32.1',
      proto: 'TCP/2121',
      app: 'ftp',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'untrust',
      app: 'ftp',
      service: 'any',
      action: 'DENY',
      nat: 'NONE',
      profile: 'any',
    },
    nat: {
      type: 'NONE',
      source: { original: '10.1.1.77', translated: '10.1.1.77' },
      destination: { original: '45.33.32.1', translated: '45.33.32.1' },
      packetLabel: '10.1.1.77',
    },
    hint: {
      es: 'App-ID identifica ftp por su contenido aunque viaje en un puerto no estándar (aquí 2121). Para cortarlo en CUALQUIER puerto, crea una regla deny para la aplicación ftp con servicio "any" (no application-default, que solo cubriría el puerto 21).',
      en: 'App-ID identifies ftp by its content even on a non-standard port (here 2121). To cut it on ANY port, create a deny rule for the ftp application with service "any" (not application-default, which would only cover port 21).',
    },
    explanation: {
      es: 'La gran ventaja de App-ID es que reconoce la aplicación por su comportamiento, no por el puerto: aunque el ftp salga por el 2121, PAN-OS lo identifica como ftp. Para bloquearlo de forma robusta usas una regla deny sobre la app ftp con servicio "any", de modo que no importe el puerto. Una regla deny descarta el paquete en la Security Policy, así que el NAT y los perfiles son irrelevantes.',
      en: 'The big advantage of App-ID is that it recognizes the application by its behavior, not the port: even if ftp leaves over 2121, PAN-OS identifies it as ftp. To block it robustly you use a deny rule on the ftp app with service "any", so the port does not matter. A deny rule discards the packet in the Security Policy, so NAT and profiles are irrelevant.',
    },
  },
  {
    id: 10,
    tier: 'F',
    tracks: ['ngfw-engineer'],
    title: { es: 'U-Turn para el jump host RDP', en: 'U-Turn for the RDP Jump Host' },
    desc: {
      es: 'Un usuario interno (Trust) intenta llegar al jump host RDP de la DMZ por su IP PÚBLICA.',
      en: 'An internal user (Trust) tries to reach the DMZ RDP jump host via its PUBLIC IP.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'dmz',
      srcIp: '10.1.1.60',
      dstIp: '203.0.113.2',
      proto: 'TCP/3389',
      app: 'ms-rdp',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'dmz',
      app: 'ms-rdp',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'DNAT+SNAT',
      profile: 'strict',
    },
    nat: {
      type: 'DNAT+SNAT',
      source: { original: '10.1.1.60', translated: '203.0.113.1' },
      destination: { original: '203.0.113.2', translated: '192.168.50.20' },
      packetLabel: 'U-TURN -> 192.168.50.20',
    },
    hint: {
      es: 'Hairpin de nuevo, ahora con RDP: el usuario interno apunta a la IP pública del jump host. Necesita DNAT (para alcanzar el host real de la DMZ) Y SNAT (para que el host responda al firewall y no directo al usuario). La Security Policy usa las IPs pre-NAT pero la zona destino post-NAT.',
      en: 'Hairpin again, now with RDP: the internal user targets the jump host public IP. It needs DNAT (to reach the real DMZ host) AND SNAT (so the host replies to the firewall, not directly to the user). The Security Policy uses the pre-NAT IPs but the post-NAT destination zone.',
    },
    explanation: {
      es: 'Es el mismo patrón U-Turn del escenario del hairpin, aplicado a RDP: el DNAT traduce la IP pública del jump host a su IP interna, y el SNAT traduce el origen al firewall para evitar el enrutamiento asimétrico (que el host responda al firewall y no directo al usuario interno). La Security Policy compara las IPs originales (pre-NAT) pero la zona destino ya es la post-NAT (DMZ); y por ser RDP expuesto, se exige el perfil Strict.',
      en: 'It is the same U-Turn pattern as the hairpin scenario, applied to RDP: DNAT translates the jump host public IP to its internal IP, and SNAT translates the source to the firewall to avoid asymmetric routing (so the host replies to the firewall and not directly to the internal user). The Security Policy compares the original (pre-NAT) IPs but the destination zone is already the post-NAT one (DMZ); and because it is exposed RDP, the Strict profile is required.',
    },
  },
  // ─── NGFW Engineer Tier (N) — Niveles 11–18 ────────────────────────────────
  {
    id: 11,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'First-match: la regla que importa es la primera que aplica',
      en: 'First-match: the rule that matters is the first one that applies',
    },
    desc: {
      es: 'Un administrador tiene dos reglas: la primera deniega web-browsing (Trust→Untrust), la segunda permite SSL (Trust→Untrust). Un paquete HTTPS (SSL) sale desde Trust. ¿Qué regla aplica?',
      en: 'An administrator has two rules: the first denies web-browsing (Trust→Untrust), the second allows SSL (Trust→Untrust). An HTTPS (SSL) packet leaves from Trust. Which rule applies?',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'untrust',
      srcIp: '10.1.1.100',
      dstIp: '8.8.8.8',
      proto: 'TCP/443',
      app: 'ssl',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'untrust',
      app: 'ssl',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'SNAT',
      profile: 'default',
    },
    nat: {
      type: 'SNAT',
      source: { original: '10.1.1.100', translated: '203.0.113.1' },
      destination: { original: '8.8.8.8', translated: '8.8.8.8' },
      packetLabel: 'SNAT: 203.0.113.1',
    },
    hint: {
      es: 'En PAN-OS, la evaluación de políticas es top-down first-match: se aplica la primera regla que coincide y se ignoran las siguientes. Una regla DENY para web-browsing no afecta al tráfico SSL, aunque ambas vayan de Trust a Untrust. Cada App-ID es una entidad distinta.',
      en: 'PAN-OS security policy evaluation is top-down, first-match: the first matching rule is applied and subsequent rules are ignored. A DENY rule for web-browsing does not affect SSL traffic, even when both go from Trust to Untrust. Each App-ID is a distinct entity.',
    },
    explanation: {
      es: "La clave es que 'web-browsing' y 'ssl' son App-IDs diferentes en PAN-OS. Una regla que deniegue web-browsing no intercepta el tráfico SSL. Para bloquear HTTPS también necesitarías una regla separada para 'ssl', o usar 'any' como App-ID (lo cual no es una buena práctica de seguridad).",
      en: "The key insight is that 'web-browsing' and 'ssl' are different App-IDs in PAN-OS. A rule denying web-browsing does not intercept SSL traffic. To also block HTTPS, you would need a separate rule for 'ssl', or use 'any' as App-ID (which is not a security best practice).",
    },
  },
  {
    id: 12,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'Rule shadowing: reglas ocultas por "any"',
      en: 'Rule shadowing: rules hidden by "any"',
    },
    desc: {
      es: 'Una regla "allow any any" al principio del rulebase impide que la regla DENY para SSH llegue a aplicarse. El tráfico SSH debería bloquearse, pero la regla de permiso total lo deja pasar primero. El jugador debe configurar la política correcta para bloquear el SSH.',
      en: 'An "allow any any" rule at the top of the rulebase prevents the SSH DENY rule from ever being reached. SSH traffic should be blocked, but the allow-all rule permits it first. The player must configure the correct policy to block SSH.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'untrust',
      srcIp: '10.1.1.50',
      dstIp: '203.0.113.100',
      proto: 'TCP/22',
      app: 'ssh',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'untrust',
      app: 'ssh',
      service: 'application-default',
      action: 'DENY',
      nat: 'NONE',
      profile: 'any',
    },
    nat: {
      type: 'NONE',
      source: { original: '10.1.1.50', translated: '10.1.1.50' },
      destination: { original: '203.0.113.100', translated: '203.0.113.100' },
      packetLabel: '10.1.1.50',
    },
    hint: {
      es: "En PAN-OS, una regla 'any-any ALLOW' al principio del rulebase sombrea (shadowing) a cualquier regla más específica que venga después. El tráfico SSH nunca llega a la regla de denegación porque ya fue permitido antes. El orden de las reglas es tan importante como su contenido.",
      en: "In PAN-OS, an 'any-any ALLOW' rule at the top of the rulebase shadows any more specific rules that follow. SSH traffic never reaches the deny rule because it was already permitted. Rule order is as important as rule content.",
    },
    explanation: {
      es: 'El shadowing de reglas es un error de configuración común y peligroso: la regla correcta existe pero nunca se ejecuta. La solución es colocar las reglas más específicas (y restrictivas) antes de las reglas generales. Siempre revisa el rulebase completo, no solo la regla que estás creando.',
      en: 'Rule shadowing is a common and dangerous misconfiguration: the correct rule exists but is never executed. The solution is to place more specific (and restrictive) rules before general rules. Always review the complete rulebase, not just the rule you are creating.',
    },
  },
  {
    id: 13,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'Implicit deny: el firewall bloquea lo que no está explícitamente permitido',
      en: 'Implicit deny: the firewall blocks what is not explicitly allowed',
    },
    desc: {
      es: 'Un servidor en DMZ necesita subir archivos a Internet por FTP. No existe ninguna regla que permita este tráfico en el rulebase, por lo que el implicit deny lo bloquea. El jugador debe crear la regla correcta para permitirlo.',
      en: 'A server in the DMZ needs to upload files to the Internet via FTP. No rule in the rulebase permits this traffic, so the implicit deny blocks it. The player must create the correct rule to allow it.',
    },
    packet: {
      srcZone: 'dmz',
      dstZone: 'untrust',
      srcIp: '192.168.50.10',
      dstIp: '1.2.3.4',
      proto: 'TCP/21',
      app: 'ftp',
    },
    solution: {
      srcZone: 'dmz',
      dstZone: 'untrust',
      app: 'ftp',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'SNAT',
      profile: 'default',
    },
    nat: {
      type: 'SNAT',
      source: { original: '192.168.50.10', translated: '203.0.113.1' },
      destination: { original: '1.2.3.4', translated: '1.2.3.4' },
      packetLabel: 'SNAT: 203.0.113.1',
    },
    hint: {
      es: "En PAN-OS, todo el tráfico que no coincide con ninguna regla explícita es bloqueado por el 'Implicit Deny All' al final del rulebase. Esta regla invisible es el comportamiento por defecto y es fundamental para el principio de seguridad 'deny by default'. Siempre debes crear reglas explícitas para el tráfico que deseas permitir.",
      en: "In PAN-OS, all traffic that doesn't match any explicit rule is blocked by the 'Implicit Deny All' at the bottom of the rulebase. This invisible rule is the default behavior and is fundamental to the 'deny by default' security principle. You must always create explicit rules for traffic you want to allow.",
    },
    explanation: {
      es: 'El Implicit Deny All es lo que hace a los firewalls seguros por defecto. A diferencia de un router o switch, el firewall no pasa nada a menos que le digas explícitamente que sí. Para el FTP del servidor DMZ a Internet, necesitas una regla DMZ→Untrust con App-ID ftp, acción ALLOW y SNAT para la salida.',
      en: 'The Implicit Deny All is what makes firewalls secure by default. Unlike a router or switch, the firewall passes nothing unless you explicitly tell it to. For FTP from the DMZ server to the Internet, you need a DMZ→Untrust rule with App-ID ftp, ALLOW action, and SNAT for egress.',
    },
  },
  {
    id: 14,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'Intra-zone default allow: bloquear movimiento lateral en DMZ',
      en: 'Intra-zone default allow: blocking lateral movement in DMZ',
    },
    desc: {
      es: 'Dos servidores en la zona DMZ se comunican entre sí usando SSL. En PAN-OS el tráfico intra-zona está permitido por defecto. Un atacante que compromete un servidor DMZ puede moverse lateralmente a otros servidores de la misma zona. El jugador debe crear una regla para bloquear este movimiento lateral.',
      en: 'Two servers in the DMZ zone communicate using SSL. In PAN-OS, intra-zone traffic is allowed by default. An attacker who compromises a DMZ server can move laterally to other servers in the same zone. The player must create a rule to block this lateral movement.',
    },
    packet: {
      srcZone: 'dmz',
      dstZone: 'dmz',
      srcIp: '192.168.50.10',
      dstIp: '192.168.50.20',
      proto: 'TCP/443',
      app: 'ssl',
    },
    solution: {
      srcZone: 'dmz',
      dstZone: 'dmz',
      app: 'ssl',
      service: 'application-default',
      action: 'DENY',
      nat: 'NONE',
      profile: 'any',
    },
    nat: {
      type: 'NONE',
      source: { original: '192.168.50.10', translated: '192.168.50.10' },
      destination: { original: '192.168.50.20', translated: '192.168.50.20' },
      packetLabel: '192.168.50.10',
    },
    hint: {
      es: "En PAN-OS, el tráfico INTRA-ZONA (mismo origen y destino de zona) está PERMITIDO por defecto mediante la regla predefinida 'intrazone-default'. Para implementar micro-segmentación y bloquear el movimiento lateral entre hosts de la misma zona, debes crear una regla explícita con srcZone = dstZone = la zona objetivo y acción DENY, colocada ANTES de la 'intrazone-default'.",
      en: "In PAN-OS, INTRA-ZONE traffic (same source and destination zone) is ALLOWED by default via the predefined 'intrazone-default' rule. To implement micro-segmentation and block lateral movement between hosts in the same zone, you must create an explicit rule with srcZone = dstZone = the target zone and DENY action, placed BEFORE 'intrazone-default'.",
    },
    explanation: {
      es: 'Este es uno de los conceptos más importantes para Zero Trust: el tráfico intra-zona no está automáticamente seguro. La segmentación dentro de una zona (micro-segmentación) requiere reglas explícitas de denegación. En el examen NGFW Engineer, recuerda: inter-zona = deny by default; intra-zona = allow by default.',
      en: 'This is one of the most important concepts for Zero Trust: intra-zone traffic is not automatically safe. Segmentation within a zone (micro-segmentation) requires explicit deny rules. On the NGFW Engineer exam, remember: inter-zone = deny by default; intra-zone = allow by default.',
    },
  },
  {
    id: 15,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'Una zona cubre múltiples interfaces',
      en: 'One zone covers multiple interfaces',
    },
    desc: {
      es: 'La empresa tiene dos interfaces en la zona Trust: ethernet1/1 (LAN principal, 10.1.1.0/24) y ethernet1/2 (WiFi corporativa, 10.1.2.0/24). El tráfico desde WiFi (10.1.2.200) hacia el servidor web de DMZ debe pasar. ¿Necesitas una regla separada para WiFi?',
      en: 'The company has two interfaces in the Trust zone: ethernet1/1 (main LAN, 10.1.1.0/24) and ethernet1/2 (corporate WiFi, 10.1.2.0/24). Traffic from WiFi (10.1.2.200) to the DMZ web server must pass. Do you need a separate rule for WiFi?',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'dmz',
      srcIp: '10.1.2.200',
      dstIp: '192.168.50.10',
      proto: 'TCP/80',
      app: 'web-browsing',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'dmz',
      app: 'web-browsing',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'NONE',
      profile: 'default',
    },
    nat: {
      type: 'NONE',
      source: { original: '10.1.2.200', translated: '10.1.2.200' },
      destination: { original: '192.168.50.10', translated: '192.168.50.10' },
      packetLabel: '10.1.2.200',
    },
    hint: {
      es: 'En PAN-OS, la política de seguridad opera sobre ZONAS, no sobre interfaces individuales. Una zona puede contener múltiples interfaces físicas o lógicas. Una sola regla Trust→DMZ aplica automáticamente a todo el tráfico que viene de CUALQUIER interfaz asignada a la zona Trust, sin importar cuántas interfaces tenga esa zona.',
      en: 'In PAN-OS, security policy operates on ZONES, not individual interfaces. A zone can contain multiple physical or logical interfaces. A single Trust→DMZ rule automatically applies to all traffic coming from ANY interface assigned to the Trust zone, regardless of how many interfaces that zone has.',
    },
    explanation: {
      es: 'Esta abstracción por zonas es lo que hace escalable la administración de PAN-OS. En lugar de crear una regla por interfaz (como en ACLs de router), defines la política entre zonas. Agregar una nueva interfaz a la zona Trust no requiere cambios en el rulebase de seguridad — automáticamente hereda todas las reglas de la zona.',
      en: 'This zone-based abstraction is what makes PAN-OS administration scalable. Instead of creating a rule per interface (like router ACLs), you define policy between zones. Adding a new interface to the Trust zone requires no security rulebase changes — it automatically inherits all zone rules.',
    },
  },
  {
    id: 16,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'Service object custom: SSL en puerto TCP/8443',
      en: 'Custom service object: SSL on TCP/8443',
    },
    desc: {
      es: 'El portal de administración web interno corre en TCP/8443 (no en el 443 estándar). El tráfico Trust→DMZ en TCP/8443 no coincide con ninguna regla que use "application-default" para SSL, porque application-default solo cubre el puerto estándar.',
      en: 'The internal web administration portal runs on TCP/8443 (not the standard 443). Trust→DMZ traffic on TCP/8443 does not match any rule using "application-default" for SSL, because application-default only covers the standard port.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'dmz',
      srcIp: '10.1.1.10',
      dstIp: '192.168.50.10',
      proto: 'TCP/8443',
      app: 'ssl',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'dmz',
      app: 'ssl',
      service: 'service-custom-8443',
      action: 'ALLOW',
      nat: 'NONE',
      profile: 'default',
    },
    nat: {
      type: 'NONE',
      source: { original: '10.1.1.10', translated: '10.1.1.10' },
      destination: { original: '192.168.50.10', translated: '192.168.50.10' },
      packetLabel: '10.1.1.10',
    },
    hint: {
      es: "En PAN-OS, 'application-default' significa que la regla solo aplica cuando la aplicación usa sus puertos estándar definidos por App-ID. Si ssl corre en TCP/8443 en lugar de TCP/443, necesitas crear un objeto de servicio custom (service object) con protocolo TCP y puerto 8443, y referenciarlo en la regla en lugar de 'application-default'.",
      en: "In PAN-OS, 'application-default' means the rule only applies when the application uses its standard ports as defined by App-ID. If ssl runs on TCP/8443 instead of TCP/443, you need to create a custom service object with protocol TCP and port 8443, and reference it in the rule instead of 'application-default'.",
    },
    explanation: {
      es: "Los service objects custom permiten que App-ID funcione en puertos no estándar. Sin embargo, usar un puerto alternativo para SSL también puede ser una señal de tráfico evasivo — considera si esta excepción es realmente necesaria o si el servidor puede moverse al puerto estándar. En el examen, recuerda: service object = protocolo + puerto; application-default = lo que App-ID espera.",
      en: "Custom service objects allow App-ID to work on non-standard ports. However, using an alternate port for SSL can also be a sign of evasive traffic — consider whether this exception is truly necessary or if the server can move to the standard port. On the exam: service object = protocol + port; application-default = what App-ID expects.",
    },
  },
  {
    id: 17,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'Aplicación propietaria: permitir unknown-tcp',
      en: 'Proprietary application: allowing unknown-tcp',
    },
    desc: {
      es: 'Una aplicación propietaria de gestión de bases de datos usa un protocolo TCP propio que App-ID no reconoce. El firewall lo clasifica como "unknown-tcp". El administrador necesita permitir este tráfico entre Trust y DMZ sin que el engine de App-ID interfiera.',
      en: 'A proprietary database management application uses a custom TCP protocol that App-ID does not recognize. The firewall classifies it as "unknown-tcp". The administrator needs to allow this traffic between Trust and DMZ without App-ID engine interference.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'dmz',
      srcIp: '10.1.1.20',
      dstIp: '192.168.50.20',
      proto: 'TCP/5432',
      app: 'unknown-tcp',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'dmz',
      app: 'unknown-tcp',
      service: 'any',
      action: 'ALLOW',
      nat: 'NONE',
      profile: 'none',
    },
    nat: {
      type: 'NONE',
      source: { original: '10.1.1.20', translated: '10.1.1.20' },
      destination: { original: '192.168.50.20', translated: '192.168.50.20' },
      packetLabel: '10.1.1.20',
    },
    hint: {
      es: "En PAN-OS, cuando el tráfico de una aplicación propietaria no es reconocido por App-ID, aparece como 'unknown-tcp' o 'unknown-udp'. Puedes permitirlo con esos App-IDs, pero ten en cuenta que no habrá inspección de contenido (sin perfiles de seguridad efectivos). La alternativa es crear una Custom Application o usar Application Override para asignar una identidad consistente al tráfico.",
      en: "In PAN-OS, when proprietary application traffic is not recognized by App-ID, it appears as 'unknown-tcp' or 'unknown-udp'. You can allow it with those App-IDs, but note that there will be no content inspection (no effective security profiles). The alternative is to create a Custom Application or use Application Override to assign a consistent identity to the traffic.",
    },
    explanation: {
      es: "Permitir 'unknown-tcp' es un riesgo de seguridad: no sabes exactamente qué está pasando por el firewall. En producción, considera crear una Custom Application con la firma del protocolo propietario, o trabajar con el fabricante para obtener una App-ID signature. Minimiza el uso de 'any' en el campo service — especifica el puerto exacto siempre que sea posible.",
      en: "Allowing 'unknown-tcp' is a security risk: you don't know exactly what's passing through the firewall. In production, consider creating a Custom Application with the proprietary protocol signature, or work with the vendor to obtain an App-ID signature. Minimize using 'any' in the service field — specify the exact port whenever possible.",
    },
  },
  {
    id: 18,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'Dynamic Address Group (DAG): política basada en tags',
      en: 'Dynamic Address Group (DAG): tag-based policy',
    },
    desc: {
      es: 'Todos los servidores web en DMZ tienen el tag "web" en PAN-OS. En lugar de listar IPs individuales, la regla de seguridad usa el address group "group-dmz-servers" que incluye automáticamente todos los hosts con ese tag. Un cliente de Internet accede a 192.168.50.10 (que tiene el tag correcto).',
      en: 'All web servers in the DMZ have the "web" tag in PAN-OS. Instead of listing individual IPs, the security rule uses the address group "group-dmz-servers" that automatically includes all hosts with that tag. An Internet client accesses 192.168.50.10 (which has the correct tag).',
    },
    packet: {
      srcZone: 'untrust',
      dstZone: 'dmz',
      srcIp: '1.2.3.4',
      dstIp: '192.168.50.10',
      proto: 'TCP/80',
      app: 'web-browsing',
    },
    solution: {
      srcZone: 'untrust',
      dstZone: 'dmz',
      app: 'web-browsing',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'DNAT',
      profile: 'default',
      dstAddress: 'group-dmz-servers',
    },
    nat: {
      type: 'DNAT',
      source: { original: '1.2.3.4', translated: '1.2.3.4' },
      destination: { original: '192.168.50.10', translated: '192.168.50.10' },
      packetLabel: 'DNAT: 192.168.50.10',
    },
    hint: {
      es: "En PAN-OS, los Dynamic Address Groups (DAG) son grupos de direcciones que se populan automáticamente basándose en tags asignados a hosts. En lugar de referenciar IPs individuales en una política de seguridad, referencias el DAG — cuando se añade o elimina un host del grupo de tags, la política se actualiza automáticamente sin modificar el rulebase.",
      en: 'In PAN-OS, Dynamic Address Groups (DAGs) are address groups that automatically populate based on tags assigned to hosts. Instead of referencing individual IPs in a security policy, you reference the DAG — when a host is added or removed from the tag group, the policy updates automatically without modifying the rulebase.',
    },
    explanation: {
      es: 'Los DAGs son esenciales en entornos virtualizados (VMware, cloud) donde las IPs cambian frecuentemente. El agente User-ID de PAN-OS, o la API XML, pueden registrar/desregistrar IPs con tags dinámicamente. Esto elimina la necesidad de actualizar manualmente las políticas al escalar o migrar cargas de trabajo. Es un concepto clave tanto para el examen NGFW Engineer como para NetSec Architect.',
      en: 'DAGs are essential in virtualized environments (VMware, cloud) where IPs change frequently. The PAN-OS User-ID agent, or the XML API, can dynamically register/unregister IPs with tags. This eliminates the need to manually update policies when scaling or migrating workloads. It is a key concept for both the NGFW Engineer and NetSec Architect exams.',
    },
  },

  // ─── NGFW Engineer — Objects & Profiles (Niveles 19–24) ──────────────────────
  {
    id: 19,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'Named Address Objects: política por nombre, no por IP',
      en: 'Named Address Objects: policy by name, not by IP',
    },
    desc: {
      es: 'Un usuario de Trust accede al servidor web de la DMZ. La política correcta no referencia la IP directamente sino el Named Address Object "addr-web-server". Cuando la IP del servidor cambie, solo actualizas el objeto — no cada regla.',
      en: 'A Trust user accesses the DMZ web server. The correct policy references the Named Address Object "addr-web-server" instead of the IP directly. When the server IP changes, only the object needs updating — not every rule.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'dmz',
      srcIp: '10.1.1.10',
      dstIp: '192.168.50.10',
      proto: 'TCP/443',
      app: 'ssl',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'dmz',
      app: 'ssl',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'NONE',
      profile: 'default',
      dstAddress: 'addr-web-server',
    },
    nat: {
      type: 'NONE',
      source: { original: '10.1.1.10', translated: '10.1.1.10' },
      destination: { original: '192.168.50.10', translated: '192.168.50.10' },
      packetLabel: '10.1.1.10',
    },
    hint: {
      es: 'En PAN-OS, la mejor práctica es usar Named Address Objects en las políticas de seguridad en lugar de IPs literales. Los address objects tienen nombre descriptivo, tipo (ip-netmask, fqdn, ip-range) y pueden tener tags. Si la IP del servidor cambia, solo actualizas el objeto — todas las reglas que lo referencian se actualizan automáticamente. Panorama gestiona estos objetos de forma centralizada.',
      en: 'In PAN-OS, the best practice is to use Named Address Objects in security policies instead of literal IPs. Address objects have a descriptive name, type (ip-netmask, fqdn, ip-range) and can have tags. If the server IP changes, only update the object — all rules referencing it update automatically. Panorama manages these objects centrally.',
    },
    explanation: {
      es: 'Usar IPs literales en políticas es un antipatrón: cuando renumeras tu red, debes editar cada regla individualmente. Con Named Address Objects (o Address Groups), mantienes la agilidad de la infraestructura sin sacrificar la seguridad. Esto es especialmente importante en entornos multi-firewall gestionados por Panorama.',
      en: 'Using literal IPs in policies is an anti-pattern: when you renumber your network, you must edit every rule individually. With Named Address Objects (or Address Groups), you maintain infrastructure agility without sacrificing security. This is especially important in multi-firewall environments managed by Panorama.',
    },
  },
  {
    id: 20,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'Address Group: simplificar política con grupos de objetos',
      en: 'Address Group: simplify policy with object groups',
    },
    desc: {
      es: 'Un usuario de Trust accede a 192.168.50.20, uno de los servidores de la DMZ. En lugar de crear una regla por servidor, la política referencia el Address Group "group-dmz-servers" que agrupa todos los servidores DMZ. Al añadir un servidor nuevo al grupo, la política se aplica automáticamente.',
      en: 'A Trust user accesses 192.168.50.20, one of the DMZ servers. Instead of a rule per server, the policy references Address Group "group-dmz-servers" that groups all DMZ servers. Adding a new server to the group automatically applies the policy.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'dmz',
      srcIp: '10.1.1.10',
      dstIp: '192.168.50.20',
      proto: 'TCP/443',
      app: 'ssl',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'dmz',
      app: 'ssl',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'NONE',
      profile: 'default',
      dstAddress: 'group-dmz-servers',
    },
    nat: {
      type: 'NONE',
      source: { original: '10.1.1.10', translated: '10.1.1.10' },
      destination: { original: '192.168.50.20', translated: '192.168.50.20' },
      packetLabel: '10.1.1.10',
    },
    hint: {
      es: 'Los Address Groups en PAN-OS agrupan múltiples address objects en un único objeto referenciable en políticas. Pueden ser estáticos (lista fija de miembros) o dinámicos (basados en tags — DAG). Una regla que referencia "group-dmz-servers" automáticamente aplica a todos los servidores del grupo, sin necesidad de crear una regla por cada servidor.',
      en: 'Address Groups in PAN-OS group multiple address objects into a single referenceable object in policies. They can be static (fixed member list) or dynamic (tag-based — DAG). A rule referencing "group-dmz-servers" automatically applies to all group servers, without needing a rule per server.',
    },
    explanation: {
      es: 'Comparado con crear una regla por cada servidor, el Address Group reduce el rulebase a una sola regla y es la base de políticas escalables. Al añadir un servidor al grupo, hereda automáticamente todas las políticas que referencian el grupo. Panorama puede gestionar estos grupos de forma centralizada para múltiples firewalls.',
      en: 'Compared to creating a rule per server, the Address Group reduces the rulebase to a single rule and is the basis for scalable policies. Adding a server to the group automatically inherits all policies referencing the group. Panorama can centrally manage these groups across multiple firewalls.',
    },
  },
  {
    id: 21,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'AV-only vs Threat Prevention completo: granularidad de perfiles',
      en: 'AV-only vs full Threat Prevention: profile granularity',
    },
    desc: {
      es: 'Tráfico web-browsing entrante desde Internet hacia un servidor en DMZ. El perfil "av-only" solo detecta malware conocido por firma. Para un servidor expuesto a Internet que recibe tráfico no confiable, necesitas el perfil "strict" que combina Antivirus + Vulnerability Protection + Anti-Spyware + WildFire.',
      en: 'Inbound web-browsing traffic from the Internet to a DMZ server. The "av-only" profile only detects known malware by signature. For a server exposed to the Internet receiving untrusted traffic, you need the "strict" profile combining Antivirus + Vulnerability Protection + Anti-Spyware + WildFire.',
    },
    packet: {
      srcZone: 'untrust',
      dstZone: 'dmz',
      srcIp: '1.2.3.4',
      dstIp: '192.168.50.10',
      proto: 'TCP/80',
      app: 'web-browsing',
    },
    solution: {
      srcZone: 'untrust',
      dstZone: 'dmz',
      app: 'web-browsing',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'DNAT',
      profile: 'strict',
      profileGroup: {
        antivirus: 'av-only',
        vulnerability: 'vuln-only',
        antispyware: 'antispyware-only',
        wildfire: 'wildfire-only',
      },
    },
    nat: {
      type: 'DNAT',
      source: { original: '1.2.3.4', translated: '1.2.3.4' },
      destination: { original: '192.168.50.10', translated: '192.168.50.10' },
      packetLabel: 'DNAT: 192.168.50.10',
    },
    hint: {
      es: 'Los Security Profiles de PAN-OS son independientes y se combinan en un Security Profile Group que se adjunta a la regla. El perfil Antivirus solo detecta malware conocido por firma. Vulnerability Protection bloquea exploits de vulnerabilidades. Anti-Spyware detecta C2 y exfiltración. WildFire analiza archivos desconocidos en sandbox. Para tráfico que entra desde Internet, necesitas todos para cobertura completa.',
      en: 'PAN-OS Security Profiles are independent and combined into a Security Profile Group attached to the rule. The Antivirus profile only detects known malware by signature. Vulnerability Protection blocks vulnerability exploits. Anti-Spyware detects C2 and exfiltration. WildFire analyzes unknown files in sandbox. For inbound Internet traffic, you need all of them for complete coverage.',
    },
    explanation: {
      es: 'Un perfil "av-only" protege contra malware conocido pero no detecta exploits de zero-day (Vulnerability Protection), no bloquea comunicaciones C2 (Anti-Spyware), y no analiza archivos desconocidos (WildFire). Para un servidor DMZ expuesto a Internet, "strict" o "threat-prevention-full" es el estándar mínimo recomendado por Palo Alto.',
      en: 'An "av-only" profile protects against known malware but does not detect zero-day exploits (Vulnerability Protection), does not block C2 communications (Anti-Spyware), and does not analyze unknown files (WildFire). For a DMZ server exposed to the Internet, "strict" or "threat-prevention-full" is the minimum standard recommended by Palo Alto.',
    },
  },
  {
    id: 22,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'URL Filtering: control granular por categoría',
      en: 'URL Filtering: granular control by category',
    },
    desc: {
      es: 'Los usuarios de la red Guest navegan por Internet. La política debe permitir la navegación web pero bloquear categorías peligrosas (malware, phishing, gambling). El URL Filtering Profile define acciones por categoría: allow, block, alert, continue. El tráfico Guest también necesita SNAT.',
      en: 'Guest network users browse the Internet. Policy must allow web browsing but block dangerous categories (malware, phishing, gambling). The URL Filtering Profile defines actions per category: allow, block, alert, continue. Guest traffic also needs SNAT.',
    },
    packet: {
      srcZone: 'guest',
      dstZone: 'untrust',
      srcIp: '172.16.0.100',
      dstIp: '8.8.8.8',
      proto: 'TCP/80',
      app: 'web-browsing',
    },
    solution: {
      srcZone: 'guest',
      dstZone: 'untrust',
      app: 'web-browsing',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'SNAT',
      profile: 'strict',
    },
    nat: {
      type: 'SNAT',
      source: { original: '172.16.0.100', translated: '203.0.113.1' },
      destination: { original: '8.8.8.8', translated: '8.8.8.8' },
      packetLabel: 'SNAT: 203.0.113.1',
    },
    hint: {
      es: 'El URL Filtering Profile de PAN-OS permite control granular por categoría de URL. La acción "block" muestra una página de bloqueo al usuario. "alert" permite el acceso pero genera un log. "continue" muestra una advertencia que el usuario puede omitir. El perfil "strict" en este simulador activa el filtrado de URL — en PAN-OS real, deberías revisar qué categorías bloquea tu perfil específico.',
      en: 'The PAN-OS URL Filtering Profile allows granular control by URL category. The "block" action shows a block page to the user. "alert" allows access but generates a log. "continue" shows a warning the user can bypass. The "strict" profile in this simulator activates URL filtering — in real PAN-OS, review which categories your specific profile blocks.',
    },
    explanation: {
      es: 'Para una red de invitados (Guest), el filtrado de URL es esencial: los usuarios no son empleados de confianza y pueden acceder a contenido malicioso o inapropiado. El perfil "strict" incluye URL Filtering que bloquea categorías de alto riesgo. En producción, personaliza las categorías según la política de uso aceptable de tu organización.',
      en: 'For a Guest network, URL filtering is essential: users are not trusted employees and may access malicious or inappropriate content. The "strict" profile includes URL Filtering that blocks high-risk categories. In production, customize categories according to your organization\'s acceptable use policy.',
    },
  },
  {
    id: 23,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'File Blocking Profile: DLP básico para transferencias FTP',
      en: 'File Blocking Profile: basic DLP for FTP transfers',
    },
    desc: {
      es: 'Un usuario de Trust usa FTP para transferir archivos hacia Internet. La política debe permitir FTP pero con un File Blocking Profile para bloquear tipos de archivos peligrosos (ejecutables, scripts) y alertar sobre documentos potencialmente sensibles. Este es el nivel básico de DLP en PAN-OS.',
      en: 'A Trust user uses FTP to transfer files to the Internet. Policy must allow FTP but with a File Blocking Profile to block dangerous file types (executables, scripts) and alert on potentially sensitive documents. This is the basic DLP level in PAN-OS.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'untrust',
      srcIp: '10.1.1.100',
      dstIp: '1.2.3.4',
      proto: 'TCP/21',
      app: 'ftp',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'untrust',
      app: 'ftp',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'SNAT',
      profile: 'strict',
    },
    nat: {
      type: 'SNAT',
      source: { original: '10.1.1.100', translated: '203.0.113.1' },
      destination: { original: '1.2.3.4', translated: '1.2.3.4' },
      packetLabel: 'SNAT: 203.0.113.1',
    },
    hint: {
      es: 'El File Blocking Profile de PAN-OS inspecciona las transferencias de archivos y puede bloquear o alertar tipos de archivos específicos (por extensión o tipo MIME real, independientemente de la extensión). Es fundamental para prevenir la descarga de malware (.exe, .dll, .vbs) y la exfiltración de datos sensibles. Se configura en Objects → Security Profiles → File Blocking y se adjunta a la regla de seguridad.',
      en: 'The PAN-OS File Blocking Profile inspects file transfers and can block or alert on specific file types (by extension or actual MIME type, regardless of extension). It is fundamental for preventing malware downloads (.exe, .dll, .vbs) and sensitive data exfiltration. Configure it in Objects → Security Profiles → File Blocking and attach it to the security rule.',
    },
    explanation: {
      es: 'Para tráfico FTP saliente, el File Blocking Profile puede bloquear la transferencia de ejecutables que podrían ser herramientas de ataque, o documentos que podrían contener información confidencial. El perfil "strict" de este simulador incluye file blocking. En PAN-OS real, crea perfiles específicos: uno para bloquear ejecutables peligrosos en entrada y otro para alertar sobre documentos en salida.',
      en: 'For outbound FTP traffic, the File Blocking Profile can block transfer of executables that could be attack tools, or documents that could contain confidential information. The "strict" profile in this simulator includes file blocking. In real PAN-OS, create specific profiles: one to block dangerous executables on ingress and another to alert on documents on egress.',
    },
  },
  {
    id: 24,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'External Dynamic List (EDL): bloqueo de IPs maliciosas',
      en: 'External Dynamic List (EDL): blocking malicious IPs',
    },
    desc: {
      es: 'Un nodo de salida Tor conocido (185.220.100.1) intenta conectarse desde Internet hacia la red Trust. Las External Dynamic Lists (EDL) contienen feeds de threat intelligence actualizados automáticamente. La política debe bloquear el origen que coincide con la EDL "edl-known-bad-ips".',
      en: 'A known Tor exit node (185.220.100.1) is attempting to connect from the Internet to the Trust network. External Dynamic Lists (EDLs) contain automatically updated threat intelligence feeds. Policy must block the source matching the EDL "edl-known-bad-ips".',
    },
    packet: {
      srcZone: 'untrust',
      dstZone: 'trust',
      srcIp: '185.220.100.1',
      dstIp: '10.1.1.100',
      proto: 'TCP/80',
      app: 'web-browsing',
    },
    solution: {
      srcZone: 'untrust',
      dstZone: 'trust',
      app: 'web-browsing',
      service: 'application-default',
      action: 'DENY',
      nat: 'NONE',
      profile: 'any',
      srcAddress: 'edl-known-bad-ips',
    },
    nat: {
      type: 'NONE',
      source: { original: '185.220.100.1', translated: '185.220.100.1' },
      destination: { original: '10.1.1.100', translated: '10.1.1.100' },
      packetLabel: '185.220.100.1',
    },
    hint: {
      es: 'Las External Dynamic Lists (EDL) en PAN-OS son objetos de dirección que se actualizan automáticamente descargando una lista desde una URL externa (cada hora, día o semana). PAN-OS incluye EDLs predefinidas de Palo Alto Networks. Puedes crear EDLs custom apuntando a feeds de threat intelligence de SANS, Emerging Threats, o fuentes internas. La lista actualizada se aplica automáticamente a todas las reglas que la referencian.',
      en: 'External Dynamic Lists (EDLs) in PAN-OS are address objects that automatically update by downloading a list from an external URL (hourly, daily, or weekly). PAN-OS includes predefined EDLs from Palo Alto Networks. You can create custom EDLs pointing to threat intelligence feeds from SANS, Emerging Threats, or internal sources. The updated list automatically applies to all rules referencing it.',
    },
    explanation: {
      es: 'Bloquear IPs desde una EDL es mucho más eficiente que actualizar manualmente reglas con nuevas IPs maliciosas. Los feeds de threat intelligence se actualizan constantemente con nuevas amenazas. La combinación PAN-OS + EDL + WildFire crea un ciclo de inteligencia automática: WildFire descubre nuevas amenazas, actualiza la EDL, y PAN-OS aplica el bloqueo automáticamente en todos los firewalls que consumen el feed.',
      en: 'Blocking IPs from an EDL is far more efficient than manually updating rules with new malicious IPs. Threat intelligence feeds are constantly updated with new threats. The PAN-OS + EDL + WildFire combination creates an automatic intelligence cycle: WildFire discovers new threats, updates the EDL, and PAN-OS automatically applies blocking on all firewalls consuming the feed.',
    },
  },

  // ─── NGFW Engineer — Advanced (Niveles 25–30) ────────────────────────────────
  {
    id: 25,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'Decryption Policy: SSL Forward Proxy para inspección HTTPS',
      en: 'Decryption Policy: SSL Forward Proxy for HTTPS inspection',
    },
    desc: {
      es: 'Usuarios de Trust navegan por HTTPS hacia Internet. Sin Decryption Policy, App-ID solo ve "ssl" — no puede identificar si es YouTube, Gmail o malware dentro del SSL. El SSL Forward Proxy descifra, inspecciona y re-cifra. Para que la inspección sea efectiva se requiere el perfil "strict".',
      en: 'Trust users browse HTTPS to the Internet. Without a Decryption Policy, App-ID only sees "ssl" — it cannot identify if it\'s YouTube, Gmail or malware inside SSL. SSL Forward Proxy decrypts, inspects and re-encrypts. For effective inspection, the "strict" profile is required.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'untrust',
      srcIp: '10.1.1.100',
      dstIp: '142.250.80.100',
      proto: 'TCP/443',
      app: 'ssl',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'untrust',
      app: 'ssl',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'SNAT',
      profile: 'strict',
    },
    nat: {
      type: 'SNAT',
      source: { original: '10.1.1.100', translated: '203.0.113.1' },
      destination: { original: '142.250.80.100', translated: '142.250.80.100' },
      packetLabel: 'SNAT: 203.0.113.1',
    },
    specialCheck: (config) => {
      if (config.profile === 'none') {
        return {
          success: false,
          msg: 'DROPPED: Sin perfil de seguridad, el tráfico SSL saliente no tiene inspección. Para inspección efectiva de HTTPS, se requiere el perfil "strict" con URL Filtering y WildFire.',
        };
      }
      if (config.profile === 'default') {
        return {
          success: false,
          msg: 'Service Mismatch: El perfil "default" no incluye URL Filtering ni WildFire. Para tráfico HTTPS saliente, el perfil "strict" es el mínimo recomendado — incluye URL Filtering, WildFire y Anti-Spyware.',
        };
      }
      if (config.profile === 'strict') {
        return {
          success: true,
          msg: 'WARNING: Perfil strict aplicado. En PAN-OS real, también necesitas una Decryption Policy separada (SSL Forward Proxy) para que la inspección de contenido sea efectiva dentro del tráfico HTTPS cifrado.',
        };
      }
      return {
        success: false,
        msg: 'Service Mismatch: Para tráfico HTTPS saliente desde Trust, el perfil recomendado es "strict" (URL Filtering + WildFire + Anti-Spyware).',
      };
    },
    hint: {
      es: 'El Decryption rulebase de PAN-OS es una tercera tabla de reglas (además de Security y NAT) que controla qué tráfico SSL/TLS se descifra para inspección. Sin decryption, App-ID solo puede identificar "ssl" — no puede ver si dentro hay YouTube, malware, o exfiltración de datos. El SSL Forward Proxy requiere que el firewall actúe como CA intermedia y que los clientes confíen en su certificado.',
      en: 'The PAN-OS Decryption rulebase is a third rules table (in addition to Security and NAT) that controls which SSL/TLS traffic is decrypted for inspection. Without decryption, App-ID can only identify "ssl" — it cannot see if inside is YouTube, malware, or data exfiltration. SSL Forward Proxy requires the firewall to act as intermediate CA and clients to trust its certificate.',
    },
    explanation: {
      es: 'Para tráfico HTTPS saliente, el perfil "strict" con URL Filtering y WildFire es el mínimo recomendado, pero sin Decryption Policy, esa inspección es limitada — App-ID ve "ssl" pero no el contenido. En producción, implementa SSL Forward Proxy para toda la navegación web saliente y SSL Inbound Inspection para los servidores publicados en DMZ. Es un componente fundamental del examen NGFW Engineer.',
      en: 'For outbound HTTPS traffic, the "strict" profile with URL Filtering and WildFire is the minimum recommended, but without a Decryption Policy, that inspection is limited — App-ID sees "ssl" but not the content. In production, implement SSL Forward Proxy for all outbound web browsing and SSL Inbound Inspection for DMZ published servers. It is a fundamental component of the NGFW Engineer exam.',
    },
  },
  {
    id: 26,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'User-ID: política basada en grupo de Active Directory',
      en: 'User-ID: policy based on Active Directory group',
    },
    desc: {
      es: 'Solo el grupo de AD "IT-Admins" puede hacer SSH a los servidores de la DMZ. Un miembro de IT-Admins (10.1.1.50) accede al servidor web DMZ. Con User-ID, la política referencia el grupo de directorio en lugar de rangos IP — así la regla aplica al usuario, no a la subred.',
      en: 'Only the "IT-Admins" AD group can SSH to DMZ servers. An IT-Admins member (10.1.1.50) accesses the DMZ web server. With User-ID, policy references the directory group instead of IP ranges — so the rule applies to the user, not the subnet.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'dmz',
      srcIp: '10.1.1.50',
      dstIp: '192.168.50.10',
      proto: 'TCP/22',
      app: 'ssh',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'dmz',
      app: 'ssh',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'NONE',
      profile: 'default',
    },
    nat: {
      type: 'NONE',
      source: { original: '10.1.1.50', translated: '10.1.1.50' },
      destination: { original: '192.168.50.10', translated: '192.168.50.10' },
      packetLabel: '10.1.1.50',
    },
    hint: {
      es: 'User-ID en PAN-OS mapea dinámicamente direcciones IP a identidades de usuario y grupos de directorio (AD, LDAP, Azure AD). Las políticas de seguridad pueden incluir criterios de usuario/grupo como condición adicional. Cuando un usuario de "domain\\IT-Admins" inicia sesión y su IP se registra con User-ID, esa identidad persiste hasta que se desconecta o expira el timeout.',
      en: 'User-ID in PAN-OS dynamically maps IP addresses to user identities and directory groups (AD, LDAP, Azure AD). Security policies can include user/group criteria as additional conditions. When a "domain\\IT-Admins" user logs in and their IP is registered with User-ID, that identity persists until they disconnect or the timeout expires.',
    },
    explanation: {
      es: 'La identificación por usuario es superior a la identificación por IP porque las IPs son compartidas (DHCP, VDI) o falsificables. Con User-ID, "solo IT-Admins puede SSH" significa exactamente eso, independientemente de qué IP usen. Este es un pilar fundamental de la arquitectura Zero Trust: identificar al usuario, no solo la red. Requiere el agente User-ID (Windows-based o agentless) o integración con autenticación.',
      en: 'User identification is superior to IP identification because IPs are shared (DHCP, VDI) or spoofable. With User-ID, "only IT-Admins can SSH" means exactly that, regardless of which IP they use. This is a fundamental pillar of Zero Trust architecture: identify the user, not just the network. Requires the User-ID agent (Windows-based or agentless) or authentication integration.',
    },
  },
  {
    id: 27,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'Log Forwarding Profile: envío de logs al SIEM',
      en: 'Log Forwarding Profile: sending logs to SIEM',
    },
    desc: {
      es: 'Tráfico web-browsing entrante desde Internet hacia un servidor DMZ publicado. Para cumplimiento (PCI-DSS, SOX) y respuesta a incidentes, los logs de esta regla de alto riesgo deben enviarse al SIEM corporativo mediante un Log Forwarding Profile. Sin log forwarding, los logs solo existen en el firewall local.',
      en: 'Inbound web-browsing traffic from the Internet to a published DMZ server. For compliance (PCI-DSS, SOX) and incident response, logs from this high-risk rule must be sent to the corporate SIEM via a Log Forwarding Profile. Without log forwarding, logs only exist on the local firewall.',
    },
    packet: {
      srcZone: 'untrust',
      dstZone: 'dmz',
      srcIp: '1.2.3.4',
      dstIp: '192.168.50.10',
      proto: 'TCP/80',
      app: 'web-browsing',
    },
    solution: {
      srcZone: 'untrust',
      dstZone: 'dmz',
      app: 'web-browsing',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'DNAT',
      profile: 'strict',
    },
    nat: {
      type: 'DNAT',
      source: { original: '1.2.3.4', translated: '1.2.3.4' },
      destination: { original: '192.168.50.10', translated: '192.168.50.10' },
      packetLabel: 'DNAT: 192.168.50.10',
    },
    hint: {
      es: 'Los Log Forwarding Profiles de PAN-OS permiten enviar logs de seguridad a múltiples destinos simultáneamente: Panorama (gestión centralizada), Syslog (SIEM), HTTP (webhooks, APIs), Email (alertas críticas). Se configuran en Objects → Log Forwarding y se adjuntan a cada regla de seguridad. Las reglas que permiten tráfico desde Untrust son candidatas prioritarias para log forwarding hacia el SIEM.',
      en: 'PAN-OS Log Forwarding Profiles allow sending security logs to multiple destinations simultaneously: Panorama (centralized management), Syslog (SIEM), HTTP (webhooks, APIs), Email (critical alerts). Configure them in Objects → Log Forwarding and attach to each security rule. Rules allowing traffic from Untrust are priority candidates for SIEM log forwarding.',
    },
    explanation: {
      es: 'Sin Log Forwarding hacia un SIEM, los logs de seguridad viven solo en el firewall local y no están disponibles para correlación, detección de anomalías, ni auditoría centralizada. Para cumplimiento regulatorio (PCI-DSS 10.x requiere logs centralizados por 12 meses), el Log Forwarding Profile no es opcional — es obligatorio. El perfil "strict" de acceso desde Untrust debe tener log forwarding al SIEM configurado.',
      en: 'Without Log Forwarding to a SIEM, security logs only exist on the local firewall and are unavailable for correlation, anomaly detection, or centralized auditing. For regulatory compliance (PCI-DSS 10.x requires centralized logs for 12 months), the Log Forwarding Profile is not optional — it is mandatory. The "strict" profile for Untrust access must have SIEM log forwarding configured.',
    },
  },
  {
    id: 28,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'Application Filter: bloqueo de redes sociales por categoría',
      en: 'Application Filter: blocking social media by category',
    },
    desc: {
      es: 'Un empleado intenta acceder a una red social (Facebook, 31.13.66.35) por HTTPS; el firewall observa el tráfico como App-ID "ssl" y la política corporativa debe bloquearlo. En producción, en lugar de listar facebook, instagram, twitter o tiktok una por una (y actualizar cuando surja una nueva), se usa un Application Filter de categoría "social-networking" que se actualiza automáticamente cuando PAN-OS publica nuevas App-IDs.',
      en: 'An employee tries to reach a social network (Facebook, 31.13.66.35) over HTTPS; the firewall observes the traffic as App-ID "ssl" and corporate policy must block it. In production, instead of listing facebook, instagram, twitter or tiktok one by one (and updating when a new one emerges), an Application Filter for the "social-networking" category is used that automatically updates when PAN-OS publishes new App-IDs.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'untrust',
      srcIp: '10.1.1.100',
      dstIp: '31.13.66.35',
      proto: 'TCP/443',
      app: 'ssl',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'untrust',
      app: 'ssl',
      service: 'application-default',
      action: 'DENY',
      nat: 'NONE',
      profile: 'any',
    },
    nat: {
      type: 'NONE',
      source: { original: '10.1.1.100', translated: '10.1.1.100' },
      destination: { original: '31.13.66.35', translated: '31.13.66.35' },
      packetLabel: '10.1.1.100',
    },
    hint: {
      es: 'Los Application Filters en PAN-OS son agrupaciones dinámicas de aplicaciones basadas en atributos como categoría, riesgo o características. A diferencia de una lista estática, un Application Filter se actualiza automáticamente cuando Palo Alto publica nuevas App-IDs que coincidan con los atributos. Esto es crucial para el bloqueo de redes sociales: nuevas plataformas son incluidas automáticamente sin cambiar la regla.',
      en: 'Application Filters in PAN-OS are dynamic groupings of applications based on attributes such as category, risk, or characteristics. Unlike a static list, an Application Filter automatically updates when Palo Alto publishes new App-IDs matching the attributes. This is crucial for social media blocking: new platforms are automatically included without changing the rule.',
    },
    explanation: {
      es: 'Comparado con listar apps individualmente (facebook, instagram, twitter, tiktok, snapchat...), el Application Filter es mantenible a largo plazo. Cuando surge una nueva red social, PAN-OS actualiza el App-ID, la categoría "social-networking" la incluye, y tu regla automáticamente la bloquea. Este patrón se aplica también para bloquear apps de alto riesgo (risk level 4-5) o apps evasivas.',
      en: 'Compared to listing apps individually (facebook, instagram, twitter, tiktok, snapchat...), the Application Filter is maintainable long-term. When a new social network emerges, PAN-OS updates the App-ID, the "social-networking" category includes it, and your rule automatically blocks it. This pattern also applies to blocking high-risk apps (risk level 4-5) or evasive apps.',
    },
  },
  {
    id: 29,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'Zone Protection Profile: defensa contra SYN flood en Untrust',
      en: 'Zone Protection Profile: SYN flood defense on Untrust',
    },
    desc: {
      es: 'Tráfico web-browsing entrante desde Internet hacia un servidor DMZ. Los Zone Protection Profiles en PAN-OS protegen zonas contra ataques volumétricos (SYN flood, UDP flood, ICMP flood) ANTES de que el tráfico entre al security rulebase. Para la zona Untrust, un Zone Protection Profile es obligatorio para protección básica contra DDoS.',
      en: 'Inbound web-browsing traffic from the Internet to a DMZ server. Zone Protection Profiles in PAN-OS protect zones against volumetric attacks (SYN flood, UDP flood, ICMP flood) BEFORE traffic enters the security rulebase. For the Untrust zone, a Zone Protection Profile is mandatory for basic DDoS protection.',
    },
    packet: {
      srcZone: 'untrust',
      dstZone: 'dmz',
      srcIp: '10.0.0.1',
      dstIp: '192.168.50.10',
      proto: 'TCP/80',
      app: 'web-browsing',
    },
    solution: {
      srcZone: 'untrust',
      dstZone: 'dmz',
      app: 'web-browsing',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'DNAT',
      profile: 'strict',
    },
    nat: {
      type: 'DNAT',
      source: { original: '10.0.0.1', translated: '10.0.0.1' },
      destination: { original: '192.168.50.10', translated: '192.168.50.10' },
      packetLabel: 'DNAT: 192.168.50.10',
    },
    hint: {
      es: 'Los Zone Protection Profiles de PAN-OS operan en la capa de zona (antes del security rulebase) y protegen contra ataques volumétricos: SYN flood (con SYN cookies), UDP flood, ICMP flood, y reconocimiento (port scans). Se configuran en Network → Zone Protection y se adjuntan a cada zona. Para la zona Untrust expuesta a Internet, un Zone Protection Profile con umbrales de SYN flood es el mínimo recomendado.',
      en: 'PAN-OS Zone Protection Profiles operate at the zone layer (before the security rulebase) and protect against volumetric attacks: SYN flood (with SYN cookies), UDP flood, ICMP flood, and reconnaissance (port scans). Configure them in Network → Zone Protection and attach to each zone. For the Untrust zone exposed to the Internet, a Zone Protection Profile with SYN flood thresholds is the minimum recommended.',
    },
    explanation: {
      es: 'El Zone Protection Profile complementa las reglas de seguridad: las reglas controlan QUÉ tráfico es permitido, mientras que el Zone Protection controla el VOLUMEN de tráfico. Sin Zone Protection en la zona Untrust, un ataque SYN flood puede saturar la tabla de sesiones del firewall y causar una denegación de servicio efectiva aunque todas las reglas sean correctas. Es un elemento imprescindible en cualquier arquitectura NGFW.',
      en: 'The Zone Protection Profile complements security rules: rules control WHAT traffic is allowed, while Zone Protection controls the VOLUME of traffic. Without Zone Protection on the Untrust zone, a SYN flood attack can saturate the firewall session table and cause effective denial of service even when all rules are correct. It is an essential element in any NGFW architecture.',
    },
  },
  {
    id: 30,
    tier: 'N',
    tracks: ['ngfw-engineer'],
    title: {
      es: 'Policy-Based Forwarding (PBF): desvío de tráfico DNS',
      en: 'Policy-Based Forwarding (PBF): DNS traffic steering',
    },
    desc: {
      es: 'El tráfico DNS desde Trust hacia Internet debe usar siempre una interfaz específica (menor latencia), ignorando la tabla de routing habitual. PBF (Policy-Based Forwarding) en PAN-OS permite desviar tráfico por criterios de política (zona, App-ID, usuario) a un next-hop específico, independientemente del routing table.',
      en: 'DNS traffic from Trust to the Internet must always use a specific interface (lower latency), ignoring the usual routing table. PBF (Policy-Based Forwarding) in PAN-OS allows steering traffic by policy criteria (zone, App-ID, user) to a specific next-hop, regardless of the routing table.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'untrust',
      srcIp: '10.1.1.1',
      dstIp: '8.8.8.8',
      proto: 'UDP/53',
      app: 'dns',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'untrust',
      app: 'dns',
      service: 'service-dns',
      action: 'ALLOW',
      nat: 'SNAT',
      profile: 'default',
    },
    nat: {
      type: 'SNAT',
      source: { original: '10.1.1.1', translated: '203.0.113.1' },
      destination: { original: '8.8.8.8', translated: '8.8.8.8' },
      packetLabel: 'SNAT: 203.0.113.1',
    },
    hint: {
      es: 'Policy-Based Forwarding (PBF) en PAN-OS sobrescribe la tabla de routing para tráfico específico. Las reglas PBF se configuran en Policies → Policy Based Forwarding y definen condiciones (zona, usuario, aplicación) y la acción de forwarding (interfaz egress, next-hop, VRF). El caso de uso más común: enviar el tráfico de gestión siempre por la interfaz OOB, o el tráfico crítico por el ISP de menor latencia en un escenario multi-ISP.',
      en: 'Policy-Based Forwarding (PBF) in PAN-OS overrides the routing table for specific traffic. PBF rules are configured in Policies → Policy Based Forwarding and define conditions (zone, user, application) and the forwarding action (egress interface, next-hop, VRF). The most common use case: always send management traffic through the OOB interface, or critical traffic through the lowest-latency ISP in a multi-ISP scenario.',
    },
    explanation: {
      es: 'PBF es diferente del routing estático o dinámico: aplica por flujo de tráfico individual según la política, no globalmente. Permite decisiones de routing granulares que ningún protocolo de routing puede hacer. En el examen NGFW Engineer, recuerda: PBF se evalúa ANTES del security rulebase pero DESPUÉS de la NAT rulebase. Si un paquete matchea una regla PBF, el forwarding decision está tomada — el security rulebase aún se aplica sobre ese tráfico.',
      en: 'PBF differs from static or dynamic routing: it applies per individual traffic flow based on policy, not globally. It allows granular routing decisions that no routing protocol can make. In the NGFW Engineer exam, remember: PBF is evaluated BEFORE the security rulebase but AFTER the NAT rulebase. If a packet matches a PBF rule, the forwarding decision is made — the security rulebase still applies to that traffic.',
    },
  },

  // ─── NetSec Architect (Niveles 31–43) ─────────────────────────────────────────
  {
    id: 31,
    tier: 'A',
    tracks: ['netsec-architect'],
    title: {
      es: 'Zero Trust: micro-segmentación con zonas por función',
      en: 'Zero Trust: micro-segmentation with function-specific zones',
    },
    desc: {
      es: 'Diseño de arquitectura: Un servidor web (192.168.50.10) comprometido intenta conectarse al servidor de base de datos (192.168.50.20) — ambos en la misma zona DMZ. En PAN-OS, el tráfico intra-zona está permitido por defecto. La solución Zero Trust: crear zonas separadas por función (DMZ-Web, DMZ-DB) o, en este simulador, bloquear explícitamente el tráfico intra-DMZ no autorizado.',
      en: 'Architecture design: A compromised web server (192.168.50.10) tries to connect to the database server (192.168.50.20) — both in the same DMZ zone. In PAN-OS, intra-zone traffic is allowed by default. The Zero Trust solution: create separate zones by function (DMZ-Web, DMZ-DB) or, in this simulator, explicitly block unauthorized intra-DMZ traffic.',
    },
    packet: {
      srcZone: 'dmz',
      dstZone: 'dmz',
      srcIp: '192.168.50.10',
      dstIp: '192.168.50.20',
      proto: 'TCP/443',
      app: 'ssl',
    },
    solution: {
      srcZone: 'dmz',
      dstZone: 'dmz',
      app: 'ssl',
      service: 'application-default',
      action: 'DENY',
      nat: 'NONE',
      profile: 'any',
    },
    nat: {
      type: 'NONE',
      source: { original: '192.168.50.10', translated: '192.168.50.10' },
      destination: { original: '192.168.50.20', translated: '192.168.50.20' },
      packetLabel: '192.168.50.10',
    },
    hint: {
      es: 'Zero Trust requiere que el acceso entre componentes sea explícito y verificado, incluso dentro de la misma zona de red. En PAN-OS, la micro-segmentación se logra creando zonas separadas por función (DMZ-Web, DMZ-DB, DMZ-Auth) y definiendo políticas explícitas entre ellas. Mientras más granulares sean las zonas, más granular es el control de políticas — y menor el radio de impacto si un host es comprometido.',
      en: 'Zero Trust requires that access between components be explicit and verified, even within the same network zone. In PAN-OS, micro-segmentation is achieved by creating separate zones by function (DMZ-Web, DMZ-DB, DMZ-Auth) and defining explicit policies between them. The more granular the zones, the more granular the policy control — and the smaller the impact radius if a host is compromised.',
    },
    explanation: {
      es: 'El modelo de "zona plana DMZ" es un antipatrón desde la perspectiva Zero Trust: un solo host comprometido tiene acceso intra-zona ilimitado a todos los demás. La micro-segmentación por función (separar web, DB, autenticación en zonas distintas) crea un "blast radius" limitado. En el examen NetSec Architect, este concepto de diseño de zonas granulares es fundamental.',
      en: 'The "flat DMZ zone" model is an anti-pattern from the Zero Trust perspective: a single compromised host has unlimited intra-zone access to all others. Function-based micro-segmentation (separating web, DB, authentication into distinct zones) creates a limited "blast radius." In the NetSec Architect exam, this concept of granular zone design is fundamental.',
    },
  },
  {
    id: 32,
    tier: 'A',
    tracks: ['netsec-architect'],
    title: {
      es: 'Zero Trust: Never-Trust-Always-Verify en acceso a DMZ',
      en: 'Zero Trust: Never-Trust-Always-Verify for DMZ access',
    },
    desc: {
      es: 'Un usuario de la red Trust accede a una aplicación crítica en la DMZ. ¿Es suficiente confiar en el usuario solo porque está en la red Trust? El principio Zero Trust "Never Trust, Always Verify" exige capas adicionales: identidad verificada (User-ID), inspección de contenido (perfil strict), y postura del dispositivo. La regla debe PERMITIR pero con el perfil más estricto.',
      en: 'A Trust network user accesses a critical application in the DMZ. Is trusting the user just because they are on the Trust network sufficient? The Zero Trust principle "Never Trust, Always Verify" demands additional layers: verified identity (User-ID), content inspection (strict profile), and device posture. The rule must ALLOW but with the strictest profile.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'dmz',
      srcIp: '10.1.1.100',
      dstIp: '192.168.50.20',
      proto: 'TCP/443',
      app: 'ssl',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'dmz',
      app: 'ssl',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'NONE',
      profile: 'strict',
    },
    nat: {
      type: 'NONE',
      source: { original: '10.1.1.100', translated: '10.1.1.100' },
      destination: { original: '192.168.50.20', translated: '192.168.50.20' },
      packetLabel: '10.1.1.100',
    },
    hint: {
      es: 'El principio Zero Trust "Never Trust, Always Verify" significa que estar en la red Trust no es suficiente para acceder a recursos críticos. PAN-OS implementa ZT con capas: zona (dónde está), User-ID (quién es), autenticación multifactor (¿es realmente él?), y postura del dispositivo (¿el endpoint está saludable?). El perfil "strict" con URL Filtering y WildFire añade inspección de contenido al tráfico verificado.',
      en: 'The Zero Trust principle "Never Trust, Always Verify" means that being on the Trust network is insufficient for accessing critical resources. PAN-OS implements ZT with layers: zone (where they are), User-ID (who they are), multi-factor authentication (are they really who they claim?), and device posture (is the endpoint healthy?). The "strict" profile with URL Filtering and WildFire adds content inspection to verified traffic.',
    },
    explanation: {
      es: 'En arquitectura Zero Trust, la red es solo una capa más del modelo de confianza, no la única. Un atacante que compromete una estación de trabajo en Trust hereda la confianza de red de esa máquina. Para mitigar esto: User-ID (no confiar en IPs, confiar en identidades), GlobalProtect con HIP (Host Information Profile) para verificar postura del dispositivo, y perfiles de seguridad estrictos para inspección de contenido.',
      en: 'In Zero Trust architecture, the network is just one layer of the trust model, not the only one. An attacker who compromises a Trust workstation inherits that machine\'s network trust. To mitigate this: User-ID (trust identities, not IPs), GlobalProtect with HIP (Host Information Profile) to verify device posture, and strict security profiles for content inspection.',
    },
  },
  {
    id: 33,
    tier: 'A',
    tracks: ['netsec-architect'],
    title: {
      es: 'Zero Trust: Least Privilege — solo lo necesario, nada más',
      en: 'Zero Trust: Least Privilege — only what is needed, nothing more',
    },
    desc: {
      es: 'Un servidor de aplicaciones en DMZ necesita recibir tráfico HTTPS de usuarios Trust. El principio de Least Privilege exige que la regla sea tan específica como sea posible: zona exacta, App-ID exacto, servicio exacto, sin "any" innecesarios. ¿Cuál es la configuración mínima necesaria y suficiente?',
      en: 'An application server in the DMZ needs to receive HTTPS traffic from Trust users. The Least Privilege principle requires the rule to be as specific as possible: exact zone, exact App-ID, exact service, no unnecessary "any" entries. What is the minimum necessary and sufficient configuration?',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'dmz',
      srcIp: '10.1.1.100',
      dstIp: '192.168.50.10',
      proto: 'TCP/443',
      app: 'ssl',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'dmz',
      app: 'ssl',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'NONE',
      profile: 'default',
    },
    nat: {
      type: 'NONE',
      source: { original: '10.1.1.100', translated: '10.1.1.100' },
      destination: { original: '192.168.50.10', translated: '192.168.50.10' },
      packetLabel: '10.1.1.100',
    },
    hint: {
      es: 'El principio de least privilege (mínimo privilegio) aplicado a políticas de firewall significa: solo permitir exactamente lo que el flujo de trabajo legítimo requiere, nada más. Cada regla debe tener un propósito específico y documentado. Las reglas "allow any any" o "allow any" en App-ID son violaciones del least-privilege. En Zero Trust, el rulebase debe ser auditado regularmente para eliminar reglas no utilizadas o demasiado permisivas.',
      en: 'The least privilege principle applied to firewall policies means: allow only exactly what the legitimate workflow requires, nothing more. Each rule must have a specific documented purpose. Rules with "allow any any" or "allow any" in App-ID are least-privilege violations. In Zero Trust, the rulebase must be regularly audited to eliminate unused or overly permissive rules.',
    },
    explanation: {
      es: 'Un rulebase de least-privilege tiene reglas específicas: src exacta, dst exacta, App-ID exacto, servicio exacto. Cada regla debe tener un caso de negocio documentado. Las herramientas de Policy Optimizer de Panorama ayudan a identificar reglas no utilizadas o con App-ID "any" que deberían ser más específicas. En el examen NetSec Architect, saber CUÁNDO y POR QUÉ justificar cada regla es fundamental.',
      en: 'A least-privilege rulebase has specific rules: exact src, exact dst, exact App-ID, exact service. Each rule must have a documented business case. Panorama\'s Policy Optimizer tools help identify unused rules or rules with App-ID "any" that should be more specific. In the NetSec Architect exam, knowing WHEN and WHY to justify each rule is fundamental.',
    },
  },
  {
    id: 34,
    tier: 'A',
    tracks: ['netsec-architect'],
    title: {
      es: 'Management Plane Separation: administración OOB obligatoria',
      en: 'Management Plane Separation: mandatory OOB administration',
    },
    desc: {
      es: 'Un administrador intenta hacer SSH al firewall (192.168.1.5) desde la red Trust (in-band). Esto es una violación del principio de separación de planos: el acceso de administración debe ocurrir EXCLUSIVAMENTE por la interfaz de Management dedicada (OOB), nunca por la red de datos. La regla correcta es DENY.',
      en: 'An administrator tries to SSH to the firewall (192.168.1.5) from the Trust network (in-band). This violates the plane separation principle: administration access must occur EXCLUSIVELY through the dedicated Management interface (OOB), never through the data network. The correct rule is DENY.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'management',
      srcIp: '10.1.1.10',
      dstIp: '192.168.1.5',
      proto: 'TCP/22',
      app: 'ssh',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'management',
      app: 'ssh',
      service: 'application-default',
      action: 'DENY',
      nat: 'NONE',
      profile: 'any',
    },
    nat: {
      type: 'NONE',
      source: { original: '10.1.1.10', translated: '10.1.1.10' },
      destination: { original: '192.168.1.5', translated: '192.168.1.5' },
      packetLabel: '10.1.1.10',
    },
    hint: {
      es: 'La separación del management plane del data plane es un principio fundamental de seguridad en redes: el acceso de administración al firewall (SSH, HTTPS, SNMP) debe ocurrir exclusivamente por una interfaz dedicada (el puerto MGT) conectada a una red de gestión aislada (OOB - Out-of-Band). Permitir administración in-band expone el control del firewall al mismo tráfico que está inspeccionando.',
      en: 'Separating the management plane from the data plane is a fundamental network security principle: firewall administration access (SSH, HTTPS, SNMP) must occur exclusively through a dedicated interface (the MGT port) connected to an isolated management network (OOB - Out-of-Band). Allowing in-band administration exposes firewall control to the same traffic it is inspecting.',
    },
    explanation: {
      es: 'Si un atacante compromete la red Trust (data plane) y la administración del firewall es accesible in-band, puede intentar ataques de credential stuffing contra la consola de gestión. El OOB management elimina esta superficie de ataque: un atacante que controla el data plane no puede alcanzar el management plane porque están en redes físicamente separadas. En PAN-OS, el puerto MGT tiene su propia tabla de routing y no comparte interfaces con el data plane.',
      en: 'If an attacker compromises the Trust network (data plane) and firewall administration is accessible in-band, they can attempt credential stuffing attacks against the management console. OOB management eliminates this attack surface: an attacker controlling the data plane cannot reach the management plane because they are on physically separate networks. In PAN-OS, the MGT port has its own routing table and does not share interfaces with the data plane.',
    },
  },
  {
    id: 35,
    tier: 'A',
    tracks: ['netsec-architect'],
    title: {
      es: 'Prisma Access: SASE vs VPN tradicional',
      en: 'Prisma Access: SASE vs traditional VPN',
    },
    desc: {
      es: 'Usuarios remotos necesitan acceso seguro tanto a aplicaciones on-premises como a SaaS (Office365, Salesforce). En la arquitectura Prisma Access (SASE), el tráfico SaaS va directo al PoP más cercano (sin backhaul al datacenter). El acceso a apps on-prem usa un Service Connection. Configura la regla de seguridad correcta para tráfico SSL saliente.',
      en: 'Remote users need secure access to both on-premises applications and SaaS (Office365, Salesforce). In Prisma Access (SASE) architecture, SaaS traffic goes directly to the nearest PoP (no backhaul to datacenter). Access to on-prem apps uses a Service Connection. Configure the correct security rule for outbound SSL traffic.',
    },
    packet: {
      srcZone: 'untrust',
      dstZone: 'trust',
      srcIp: '1.2.3.4',
      dstIp: '10.1.1.100',
      proto: 'TCP/443',
      app: 'ssl',
    },
    solution: {
      srcZone: 'untrust',
      dstZone: 'trust',
      app: 'ssl',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'DNAT',
      profile: 'strict',
    },
    nat: {
      type: 'DNAT',
      source: { original: '1.2.3.4', translated: '1.2.3.4' },
      destination: { original: '10.1.1.100', translated: '10.1.1.100' },
      packetLabel: 'DNAT: 10.1.1.100',
    },
    hint: {
      es: 'Prisma Access es la plataforma SASE de Palo Alto Networks que entrega seguridad NGFW desde la nube (SSE - Security Service Edge). A diferencia de una VPN tradicional que backhaula todo el tráfico al datacenter (añadiendo latencia para aplicaciones SaaS), Prisma Access aplica las políticas de seguridad en el punto de presencia (PoP) más cercano al usuario. GlobalProtect conecta al usuario al PoP más próximo.',
      en: 'Prisma Access is Palo Alto Networks\' SASE platform that delivers NGFW security from the cloud (SSE - Security Service Edge). Unlike traditional VPN that backhauls all traffic to the datacenter (adding latency for SaaS applications), Prisma Access applies security policies at the nearest point of presence (PoP) to the user. GlobalProtect connects the user to the nearest PoP.',
    },
    explanation: {
      es: 'VPN tradicional hub-and-spoke: usuario remoto → datacenter → Internet (para SaaS). Con 500 usuarios accediendo a Office365, todo ese tráfico pasa por el firewall on-premises innecesariamente, añadiendo latencia y saturando el ancho de banda del datacenter. Prisma Access: usuario → PoP Palo Alto más cercano → SaaS (directo) o → Service Connection → Datacenter. Reduce latencia para SaaS y descarga el firewall corporativo.',
      en: 'Traditional hub-and-spoke VPN: remote user → datacenter → Internet (for SaaS). With 500 users accessing Office365, all that traffic passes through the on-premises firewall unnecessarily, adding latency and saturating datacenter bandwidth. Prisma Access: user → nearest Palo Alto PoP → SaaS (direct) or → Service Connection → Datacenter. Reduces SaaS latency and offloads the corporate firewall.',
    },
  },
  {
    id: 36,
    tier: 'A',
    tracks: ['netsec-architect'],
    title: {
      es: 'HA: Active-Passive vs Active-Active con NAT masivo',
      en: 'HA: Active-Passive vs Active-Active with massive NAT',
    },
    desc: {
      es: 'Necesitas HA para un firewall que hace Source NAT masivo (10,000 sesiones simultáneas). Active-Active con NAT requiere sincronización de sesiones entre peers y puede causar asimetría de tráfico. Active-Passive es más predecible para entornos NAT-intensivos. Configura la regla correcta para tráfico SNAT Trust→Untrust.',
      en: 'You need HA for a firewall doing massive Source NAT (10,000 simultaneous sessions). Active-Active with NAT requires session synchronization between peers and can cause traffic asymmetry. Active-Passive is more predictable for NAT-intensive environments. Configure the correct rule for SNAT Trust→Untrust traffic.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'untrust',
      srcIp: '10.1.1.100',
      dstIp: '8.8.8.8',
      proto: 'TCP/443',
      app: 'ssl',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'untrust',
      app: 'ssl',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'SNAT',
      profile: 'default',
    },
    nat: {
      type: 'SNAT',
      source: { original: '10.1.1.100', translated: '203.0.113.1' },
      destination: { original: '8.8.8.8', translated: '8.8.8.8' },
      packetLabel: 'SNAT: 203.0.113.1',
    },
    hint: {
      es: 'En PAN-OS HA, Active-Passive tiene un firewall activo y uno pasivo en standby sincronizado. Active-Active distribuye el tráfico entre ambos firewalls mediante ECMP o routing asimétrico. Con NAT masivo, Active-Active requiere Session Owner/Setup synchronization entre peers — el firewall que "posee" la sesión NAT puede ser diferente al que la "configura", añadiendo latencia y complejidad. Active-Passive es más predecible para entornos con NAT intensivo.',
      en: 'In PAN-OS HA, Active-Passive has one active firewall and one passive in synchronized standby. Active-Active distributes traffic between both firewalls via ECMP or asymmetric routing. With massive NAT, Active-Active requires Session Owner/Setup synchronization between peers — the firewall that "owns" the NAT session may differ from the one that "sets it up," adding latency and complexity. Active-Passive is more predictable for NAT-intensive environments.',
    },
    explanation: {
      es: 'Active-Active ofrece mayor throughput pero mayor complejidad operativa: troubleshooting de sesiones asimétricas, sincronización de NAT entre peers, y posibles inconsistencias en estadísticas de tráfico. Active-Passive es más simple: un firewall activo, uno en standby frío, failover en segundos. La elección depende del caso de uso: si necesitas escalar throughput horizontalmente, Active-Active; si necesitas simplicidad y NAT predecible, Active-Passive.',
      en: 'Active-Active offers higher throughput but greater operational complexity: troubleshooting asymmetric sessions, NAT synchronization between peers, and potential traffic statistics inconsistencies. Active-Passive is simpler: one active firewall, one cold standby, failover in seconds. The choice depends on the use case: if you need horizontal throughput scaling, Active-Active; if you need simplicity and predictable NAT, Active-Passive.',
    },
  },
  {
    id: 37,
    tier: 'A',
    tracks: ['netsec-architect'],
    title: {
      es: 'HA links: HA1 (control) vs HA2 (datos) — qué pasa si HA1 falla',
      en: 'HA links: HA1 (control) vs HA2 (data) — what happens if HA1 fails',
    },
    desc: {
      es: 'Arquitectura HA de PAN-OS: HA1 es el control link (heartbeats, estado del peer). HA2 es el data link (sincronización de sesiones). Si HA1 falla, el peer pasivo no puede verificar el estado del activo y puede declararse activo (split-brain). La regla de tráfico normal debe seguir funcionando, pero el diseño HA debe contemplar redundancia en HA1.',
      en: 'PAN-OS HA architecture: HA1 is the control link (heartbeats, peer state). HA2 is the data link (session synchronization). If HA1 fails, the passive peer cannot verify the active peer\'s state and may declare itself active (split-brain). Normal traffic rules must keep working, but the HA design must include HA1 redundancy.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'untrust',
      srcIp: '10.1.1.100',
      dstIp: '8.8.8.8',
      proto: 'TCP/443',
      app: 'ssl',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'untrust',
      app: 'ssl',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'SNAT',
      profile: 'default',
    },
    nat: {
      type: 'SNAT',
      source: { original: '10.1.1.100', translated: '203.0.113.1' },
      destination: { original: '8.8.8.8', translated: '8.8.8.8' },
      packetLabel: 'SNAT: 203.0.113.1',
    },
    hint: {
      es: 'PAN-OS HA usa dos links: HA1 (control link — heartbeats, hello messages, estado del peer) y HA2 (data link — sincronización de sesiones, tablas de forwarding). Si HA1 falla, los peers pierden visibilidad del estado del otro — el peer pasivo puede declararse activo (split-brain). Para evitarlo: usa HA1 backup (segunda ruta de control) o un link dedicado físicamente redundante para HA1.',
      en: 'PAN-OS HA uses two links: HA1 (control link — heartbeats, hello messages, peer state) and HA2 (data link — session synchronization, forwarding tables). If HA1 fails, peers lose visibility of each other\'s state — the passive peer may declare itself active (split-brain). To prevent this: use HA1 backup (second control path) or a physically redundant dedicated link for HA1.',
    },
    explanation: {
      es: 'El split-brain en HA es peligroso: ambos firewalls activos pueden aceptar y procesar tráfico con IPs flotantes conflictivas, causando intermitencia y potencial pérdida de sesiones. En diseño de producción, HA1 debe tener una ruta primaria y una de backup (puede ser in-band o out-of-band). HA2 puede tolerar pérdida temporal (solo afecta sincronización de sesiones, no el failover en sí). Diseña siempre con redundancia en ambos links.',
      en: 'Split-brain in HA is dangerous: both active firewalls can accept and process traffic with conflicting floating IPs, causing intermittency and potential session loss. In production design, HA1 must have a primary and backup path (can be in-band or out-of-band). HA2 can tolerate temporary loss (only affects session synchronization, not failover itself). Always design with redundancy on both links.',
    },
  },
  {
    id: 38,
    tier: 'A',
    tracks: ['netsec-architect'],
    title: {
      es: 'HA failover: Floating IP y Gratuitous ARP',
      en: 'HA failover: Floating IP and Gratuitous ARP',
    },
    desc: {
      es: 'En HA Active-Passive, cuando el firewall activo falla y el pasivo toma el control, los dispositivos de red necesitan saber que la IP flotante ahora está en otro puerto. El mecanismo: el nuevo firewall activo envía un Gratuitous ARP (GARP) forzando a switches y routers a actualizar sus tablas ARP y CAM inmediatamente.',
      en: 'In Active-Passive HA, when the active firewall fails and the passive takes over, network devices need to know the floating IP is now on another port. The mechanism: the new active firewall sends a Gratuitous ARP (GARP) forcing switches and routers to immediately update their ARP and CAM tables.',
    },
    packet: {
      srcZone: 'untrust',
      dstZone: 'trust',
      srcIp: '1.2.3.4',
      dstIp: '10.1.1.100',
      proto: 'TCP/80',
      app: 'web-browsing',
    },
    solution: {
      srcZone: 'untrust',
      dstZone: 'trust',
      app: 'web-browsing',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'DNAT',
      profile: 'default',
    },
    nat: {
      type: 'DNAT',
      source: { original: '1.2.3.4', translated: '1.2.3.4' },
      destination: { original: '10.1.1.100', translated: '10.1.1.100' },
      packetLabel: 'DNAT: 10.1.1.100',
    },
    hint: {
      es: 'En PAN-OS HA, las Floating IPs son IPs asignadas al firewall activo que se mueven al pasivo en caso de failover. Al hacerse activo, el nuevo firewall envía Gratuitous ARP (GARP) para anunciar que esas IPs ahora están en su MAC. Los dispositivos de red actualizan su ARP cache y las tablas CAM de los switches. Para entornos Layer 3 con routing, se usa route injection en lugar de GARP.',
      en: 'In PAN-OS HA, Floating IPs are IPs assigned to the active firewall that move to the passive on failover. Upon becoming active, the new firewall sends Gratuitous ARP (GARP) to announce those IPs are now on its MAC. Network devices update their ARP cache and switch CAM tables. For Layer 3 environments with routing, route injection is used instead of GARP.',
    },
    explanation: {
      es: 'El tiempo de failover en HA Active-Passive incluye: detección del fallo (timeout de heartbeats, ~1-3 segundos), switchover del peer, y convergencia de red (ARP cache update en dispositivos downstream, ~milisegundos con GARP). Sin GARP, los dispositivos seguirían enviando tráfico a la MAC del firewall caído hasta que expirase su ARP cache (típicamente 20 minutos). El GARP fuerza la actualización inmediata.',
      en: 'Failover time in Active-Passive HA includes: failure detection (heartbeat timeout, ~1-3 seconds), peer switchover, and network convergence (ARP cache update on downstream devices, ~milliseconds with GARP). Without GARP, devices would keep sending traffic to the failed firewall\'s MAC until their ARP cache expired (typically 20 minutes). GARP forces immediate update.',
    },
  },
  {
    id: 39,
    tier: 'A',
    tracks: ['netsec-architect'],
    title: {
      es: 'Multi-ISP: ECMP + PBF para balanceo y QoS',
      en: 'Multi-ISP: ECMP + PBF for load balancing and QoS',
    },
    desc: {
      es: 'La empresa tiene dos ISPs. El tráfico general usa ECMP (balanceo entre ambos ISPs). El tráfico DNS crítico debe usar siempre el ISP de menor latencia mediante PBF. ECMP vive en el Virtual Router; PBF en Policies → Policy Based Forwarding. Ambos son independientes del security rulebase.',
      en: 'The company has two ISPs. General traffic uses ECMP (load balancing between both ISPs). Critical DNS traffic must always use the lowest-latency ISP via PBF. ECMP lives in the Virtual Router; PBF in Policies → Policy Based Forwarding. Both are independent of the security rulebase.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'untrust',
      srcIp: '10.1.1.100',
      dstIp: '8.8.8.8',
      proto: 'UDP/53',
      app: 'dns',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'untrust',
      app: 'dns',
      service: 'service-dns',
      action: 'ALLOW',
      nat: 'SNAT',
      profile: 'default',
    },
    nat: {
      type: 'SNAT',
      source: { original: '10.1.1.100', translated: '203.0.113.1' },
      destination: { original: '8.8.8.8', translated: '8.8.8.8' },
      packetLabel: 'SNAT: 203.0.113.1',
    },
    hint: {
      es: 'En PAN-OS multi-ISP, ECMP (Equal Cost Multi-Path) en Virtual Router distribuye el tráfico entre múltiples next-hops de igual costo — balanceo por flujo (hash src/dst IP) o por sesión. PBF (Policy-Based Forwarding) permite excepciones: el tráfico DNS puede tener una regla PBF que lo fuerza siempre por el ISP de menor latencia, ignorando el ECMP del routing table.',
      en: 'In PAN-OS multi-ISP, ECMP (Equal Cost Multi-Path) in Virtual Router distributes traffic across multiple equal-cost next-hops — per-flow load balancing (src/dst IP hash) or per-session. PBF (Policy-Based Forwarding) allows exceptions: DNS traffic can have a PBF rule that always forces it through the lowest-latency ISP, ignoring the routing table ECMP.',
    },
    explanation: {
      es: 'La combinación ECMP + PBF es la arquitectura estándar para multi-ISP en PAN-OS: ECMP para balanceo general, PBF para tráfico crítico con requerimientos específicos. El SD-WAN de PAN-OS extiende este modelo añadiendo métricas de calidad de enlace (latencia, jitter, pérdida de paquetes) para steering dinámico — cuando la latencia del ISP primario supera un umbral, el tráfico DNS se desvía automáticamente al ISP secundario.',
      en: 'The ECMP + PBF combination is the standard multi-ISP architecture in PAN-OS: ECMP for general load balancing, PBF for critical traffic with specific requirements. PAN-OS SD-WAN extends this model adding link quality metrics (latency, jitter, packet loss) for dynamic steering — when primary ISP latency exceeds a threshold, DNS traffic automatically shifts to the secondary ISP.',
    },
  },
  {
    id: 40,
    tier: 'A',
    tracks: ['netsec-architect'],
    title: {
      es: 'Panorama: jerarquía Device Groups + Template Stacks',
      en: 'Panorama: Device Groups + Template Stacks hierarchy',
    },
    desc: {
      es: '50 firewalls en 10 países necesitan: (1) política de seguridad común global (bloqueo de malware), (2) políticas locales por país. Panorama gestiona esto con Device Group hierarchy (Shared → Regional → Local) para políticas, y Template Stacks para configuración de red/dispositivo por ubicación.',
      en: '50 firewalls in 10 countries need: (1) global common security policy (malware blocking), (2) local policies per country. Panorama manages this with Device Group hierarchy (Shared → Regional → Local) for policies, and Template Stacks for network/device configuration per location.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'untrust',
      srcIp: '10.1.1.100',
      dstIp: '8.8.8.8',
      proto: 'TCP/443',
      app: 'ssl',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'untrust',
      app: 'ssl',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'SNAT',
      profile: 'strict',
    },
    nat: {
      type: 'SNAT',
      source: { original: '10.1.1.100', translated: '203.0.113.1' },
      destination: { original: '8.8.8.8', translated: '8.8.8.8' },
      packetLabel: 'SNAT: 203.0.113.1',
    },
    hint: {
      es: 'Panorama organiza la gestión a escala con dos jerarquías distintas: Device Groups (para políticas de seguridad — pre-rules, post-rules, objetos) y Templates/Template Stacks (para configuración de dispositivo — interfaces, zonas, routing, HA). Un firewall puede pertenecer a un Device Group y a un Template Stack independientemente. La jerarquía de Device Groups permite políticas compartidas en niveles superiores con excepciones locales en grupos hijos.',
      en: 'Panorama organizes management at scale with two distinct hierarchies: Device Groups (for security policies — pre-rules, post-rules, objects) and Templates/Template Stacks (for device configuration — interfaces, zones, routing, HA). A firewall can belong to a Device Group and a Template Stack independently. The Device Group hierarchy allows shared policies at upper levels with local exceptions in child groups.',
    },
    explanation: {
      es: 'En una organización global, el Shared Device Group contiene reglas que aplican a TODOS los firewalls (bloqueo de malware, compliance). El Device Group regional añade reglas de la región (p.ej. GDPR para EU). El Device Group local añade reglas específicas del país. Esta herencia jerárquica elimina duplicación: cambiar una regla de compliance en el Shared group la propaga automáticamente a los 50 firewalls. Las Template Stacks permiten empujar configuraciones de interfaz/routing adaptadas por ubicación.',
      en: 'In a global organization, the Shared Device Group contains rules that apply to ALL firewalls (malware blocking, compliance). The regional Device Group adds region-specific rules (e.g., GDPR for EU). The local Device Group adds country-specific rules. This hierarchical inheritance eliminates duplication: changing a compliance rule in the Shared group automatically propagates it to all 50 firewalls. Template Stacks allow pushing interface/routing configurations adapted per location.',
    },
  },
  {
    id: 41,
    tier: 'A',
    tracks: ['netsec-architect'],
    title: {
      es: 'Prisma Access: Service Connection vs Remote Network',
      en: 'Prisma Access: Service Connection vs Remote Network',
    },
    desc: {
      es: 'Oficinas branch necesitan acceso seguro a aplicaciones en el datacenter via Prisma Access. ¿Service Connection o Remote Network? Remote Network conecta la oficina branch al PoP de Prisma Access (IPSec desde el router del branch). Service Connection conecta el datacenter a la infraestructura Prisma Access (accesible por usuarios y branches).',
      en: 'Branch offices need secure access to datacenter applications via Prisma Access. Service Connection or Remote Network? Remote Network connects the branch office to the Prisma Access PoP (IPSec from branch router). Service Connection connects the datacenter to the Prisma Access infrastructure (accessible by users and branches).',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'untrust',
      srcIp: '10.1.1.100',
      dstIp: '8.8.8.8',
      proto: 'TCP/443',
      app: 'ssl',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'untrust',
      app: 'ssl',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'SNAT',
      profile: 'strict',
    },
    nat: {
      type: 'SNAT',
      source: { original: '10.1.1.100', translated: '203.0.113.1' },
      destination: { original: '8.8.8.8', translated: '8.8.8.8' },
      packetLabel: 'SNAT: 203.0.113.1',
    },
    hint: {
      es: 'Prisma Access tiene dos tipos de conectividad: Remote Networks (para oficinas branch — terminan un túnel IPSec desde el router del branch al PoP de Prisma Access más cercano) y Service Connections (para conectar el datacenter o cloud corporativo a la infraestructura de Prisma Access — permite que usuarios móviles y branches accedan a recursos on-prem a través de Prisma Access). Mobile Users usan GlobalProtect al PoP.',
      en: 'Prisma Access has two connectivity types: Remote Networks (for branch offices — terminate an IPSec tunnel from the branch router to the nearest Prisma Access PoP) and Service Connections (to connect the datacenter or corporate cloud to the Prisma Access infrastructure — allows mobile users and branches to access on-prem resources through Prisma Access). Mobile Users use GlobalProtect to the PoP.',
    },
    explanation: {
      es: 'La arquitectura Prisma Access: Mobile Users → GlobalProtect → PoP → (Internet seguro) o → Service Connection → Datacenter. Branches → Remote Network → PoP → (Internet seguro) o → Service Connection → Datacenter. El PoP actúa como el punto central de seguridad en la nube. El datacenter se conecta UNA VEZ via Service Connection y todos los usuarios/branches pueden acceder a través de la red Prisma Access. Elimina el hub-and-spoke VPN tradicional.',
      en: 'Prisma Access architecture: Mobile Users → GlobalProtect → PoP → (secure Internet) or → Service Connection → Datacenter. Branches → Remote Network → PoP → (secure Internet) or → Service Connection → Datacenter. The PoP acts as the central cloud security point. The datacenter connects ONCE via Service Connection and all users/branches can access through the Prisma Access network. Eliminates traditional hub-and-spoke VPN.',
    },
  },
  {
    id: 42,
    tier: 'A',
    tracks: ['netsec-architect'],
    title: {
      es: 'SD-WAN: traffic steering para SaaS (Office 365)',
      en: 'SD-WAN: traffic steering for SaaS (Office 365)',
    },
    desc: {
      es: 'La empresa usa Office 365 (SaaS crítico). Con SD-WAN de PAN-OS, el tráfico office365-base debe ir directamente a Internet por el enlace de menor latencia (DIA - Direct Internet Access), sin backhauling al datacenter. App-ID identifica el tráfico de Microsoft independientemente de las IPs de destino (que cambian frecuentemente).',
      en: 'The company uses Office 365 (critical SaaS). With PAN-OS SD-WAN, office365-base traffic must go directly to the Internet via the lowest-latency link (DIA - Direct Internet Access), without backhauling to the datacenter. App-ID identifies Microsoft traffic regardless of destination IPs (which change frequently).',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'untrust',
      srcIp: '10.1.1.100',
      dstIp: '52.96.0.1',
      proto: 'TCP/443',
      app: 'office365-base',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'untrust',
      app: 'office365-base',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'SNAT',
      profile: 'strict',
    },
    nat: {
      type: 'SNAT',
      source: { original: '10.1.1.100', translated: '203.0.113.1' },
      destination: { original: '52.96.0.1', translated: '52.96.0.1' },
      packetLabel: 'SNAT: 203.0.113.1',
    },
    hint: {
      es: 'SD-WAN de PAN-OS permite traffic steering basado en métricas de calidad de enlace (latencia, jitter, pérdida de paquetes) y App-ID. Para Office 365, el steering puede configurarse para usar directamente el enlace a Internet con menor latencia (DIA - Direct Internet Access) en lugar de hacer backhauling al datacenter. El App-ID "office365-base" permite identificar el tráfico de Microsoft sin depender de IPs (que cambian frecuentemente).',
      en: 'PAN-OS SD-WAN allows traffic steering based on link quality metrics (latency, jitter, packet loss) and App-ID. For Office 365, steering can be configured to directly use the lowest-latency Internet link (DIA - Direct Internet Access) instead of backhauling to the datacenter. The "office365-base" App-ID identifies Microsoft traffic without relying on IPs (which change frequently).',
    },
    explanation: {
      es: 'El backhauling de tráfico SaaS al datacenter añade 50-150ms de latencia innecesaria. Con SD-WAN + App-ID, el tráfico de office365-base se desvía directamente al Internet por el enlace más óptimo según las métricas en tiempo real. Si el enlace primario degrada su calidad (latencia > 50ms), SD-WAN automáticamente mueve el tráfico al enlace secundario. Esto mejora la experiencia de usuario de aplicaciones SaaS sin comprometer visibilidad de seguridad.',
      en: 'Backhauling SaaS traffic to the datacenter adds 50-150ms of unnecessary latency. With SD-WAN + App-ID, office365-base traffic is directed straight to the Internet via the optimal link based on real-time metrics. If the primary link degrades in quality (latency > 50ms), SD-WAN automatically moves traffic to the secondary link. This improves SaaS application user experience without compromising security visibility.',
    },
  },
  {
    id: 43,
    tier: 'A',
    tracks: ['netsec-architect'],
    title: {
      es: 'Compliance: mapeo NIST CSF PR.AC-4 → PAN-OS',
      en: 'Compliance: NIST CSF PR.AC-4 → PAN-OS mapping',
    },
    desc: {
      es: 'Un auditor pide evidencia del control NIST CSF PR.AC-4 (gestión de privilegios de acceso — least privilege). ¿Qué funcionalidad de PAN-OS evidencia este control? La Security Policy con App-ID específico (ssh) + User-ID (grupo AD) + zona exacta (Trust→DMZ) es evidencia directa de acceso controlado por identidad, no por IP. Configura la regla correcta.',
      en: 'An auditor requests evidence of NIST CSF control PR.AC-4 (access privilege management — least privilege). What PAN-OS functionality evidences this control? Security Policy with specific App-ID (ssh) + User-ID (AD group) + exact zone (Trust→DMZ) is direct evidence of identity-controlled access, not IP-controlled. Configure the correct rule.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'dmz',
      srcIp: '10.1.1.50',
      dstIp: '192.168.50.10',
      proto: 'TCP/22',
      app: 'ssh',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'dmz',
      app: 'ssh',
      service: 'application-default',
      action: 'ALLOW',
      nat: 'NONE',
      profile: 'default',
    },
    nat: {
      type: 'NONE',
      source: { original: '10.1.1.50', translated: '10.1.1.50' },
      destination: { original: '192.168.50.10', translated: '192.168.50.10' },
      packetLabel: '10.1.1.50',
    },
    hint: {
      es: 'El NIST CSF PR.AC-4 requiere gestión de privilegios de acceso incorporando el principio de least privilege. PAN-OS lo implementa mediante: (1) Políticas de seguridad con User-ID que restringen acceso por grupo de AD, (2) Role-Based Access Control (RBAC) para administradores de Panorama/PAN-OS, (3) Privileged Access Management integrado con GlobalProtect. La combinación zona + User-ID + App-ID es evidencia directa de control de acceso granular.',
      en: 'NIST CSF PR.AC-4 requires access privilege management incorporating the least privilege principle. PAN-OS implements this through: (1) Security Policies with User-ID restricting access by AD group, (2) Role-Based Access Control (RBAC) for Panorama/PAN-OS administrators, (3) Privileged Access Management integrated with GlobalProtect. The zone + User-ID + App-ID combination is direct evidence of granular access control.',
    },
    explanation: {
      es: 'Mapear controles de compliance a funcionalidades del producto es una competencia clave del NetSec Architect. NIST CSF Protect → PAN-OS: PR.AC (acceso) = Security Policy + User-ID + RBAC; PR.DS (seguridad de datos) = Decryption + File Blocking + DLP; PR.IP (procesos de protección) = Vulnerability Protection + WildFire. NIST CSF Detect → DE.CM (monitoreo continuo) = Cortex XDR + Log Forwarding + SIEM. Estos mappings son evaluados directamente en el examen NetSec Architect.',
      en: 'Mapping compliance controls to product functionality is a key NetSec Architect competency. NIST CSF Protect → PAN-OS: PR.AC (access) = Security Policy + User-ID + RBAC; PR.DS (data security) = Decryption + File Blocking + DLP; PR.IP (protection processes) = Vulnerability Protection + WildFire. NIST CSF Detect → DE.CM (continuous monitoring) = Cortex XDR + Log Forwarding + SIEM. These mappings are directly assessed in the NetSec Architect exam.',
    },
  },
];
