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

export const LEVELS = [
  {
    id: 1,
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
    title: { es: 'NAT en horquilla (U-Turn)', en: 'The Hairpin (U-Turn) NAT' },
    desc: {
      es: 'Un usuario interno (Trust) intenta acceder al servidor web de la DMZ a través de su IP PÚBLICA.',
      en: 'An internal user (Trust) is trying to access the DMZ Web Server via its PUBLIC IP.',
    },
    packet: {
      srcZone: 'trust',
      dstZone: 'untrust',
      srcIp: '10.1.1.50',
      dstIp: '203.0.113.1',
      proto: 'TCP/80',
      app: 'web-browsing',
    },
    solution: {
      srcZone: 'trust',
      dstZone: 'untrust',
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
];
