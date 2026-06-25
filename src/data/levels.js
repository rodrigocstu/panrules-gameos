// Escenarios ("tickets") del simulador, como datos puros (sin React).
//
// Cada nivel: { id, title, desc, packet, solution, hint, explanation, nat, specialCheck? }
//  - packet:      el tráfico entrante que el jugador observa.
//  - solution:    la política correcta esperada (fuente de verdad de la validación).
//  - hint:        pista corta en español claro (T2.8). Se muestra DURANTE la
//                 configuración como ayuda opcional ("Pista") en la barra lateral.
//                 2-3 frases que citan el comportamiento PAN-OS exacto, sin códigos
//                 de error.
//  - explanation: microlección del "por qué" (T2.7). 2-3 frases que explican el
//                 concepto PAN-OS detrás del escenario. Se renderiza en el resultado
//                 (acierto Y fallo) bajo el veredicto, vía ExplanationPanel. Para
//                 fallos específicos por reasonCode, ver src/lib/explanations.js.
//  - nat:         datos de la regla NAT del escenario (T2.6). Describe qué se traduce
//                 (original -> translated) para el editor NAT y la animación. El tipo
//                 correcto es `solution.nat`; aquí guardamos las IPs reales que se usan
//                 para etiquetar el paquete (ya NO hardcodeadas en el hook).
//  - specialCheck: validación específica del nivel (hoy solo nivel 3).
//
// CONTENIDO PEDAGÓGICO (WP-3 / T2.7-T2.8): `hint` y `explanation` están en español
// claro, con comportamiento PAN-OS exacto (PCNSE). Los niveles 2 (DNAT entrante) y 4
// (hairpin / U-Turn) enseñan EXPLÍCITAMENTE que la Security Policy evalúa IPs pre-NAT
// pero zonas post-NAT (CLAUDE.md §Invariante #9).
//
// --- Modelo de NAT (PAN-OS real, T2.6) ---
// El NAT Rulebase es una tabla SEPARADA de la Security Policy. Cada `nat` block:
//  - type:        'NONE'|'SNAT'|'DNAT'|'DNAT+SNAT' (debe coincidir con solution.nat).
//  - source:      { original, translated } — IP origen pre/post NAT (SNAT y U-Turn).
//  - destination: { original, translated } — IP destino pre/post NAT (DNAT y U-Turn).
//  - packetLabel: etiqueta corta del paquete YA traducido (la consume la animación).
// Cuando una dirección no se traduce, `translated === original` (regla "identidad").

export const LEVELS = [
  {
    id: 1,
    title: 'Secure Internet Access',
    desc: 'Users in Trust need to browse secure websites. Policy requires basic Antivirus protection.',
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
    // Source NAT: la IP privada del cliente se traduce a la IP pública del firewall
    // al salir a Untrust. El destino no cambia.
    nat: {
      type: 'SNAT',
      source: { original: '10.1.1.55', translated: '203.0.113.1' },
      destination: { original: '142.250.1.1', translated: '142.250.1.1' },
      packetLabel: 'SNAT: 203.0.113.1',
    },
    hint: 'Tráfico de salida Trust -> Untrust con App-ID ssl. Necesita Source NAT (SNAT) para traducir la IP privada del cliente a la IP pública del firewall, y al menos un perfil de Antivirus para inspeccionar el tráfico permitido.',
    explanation:
      'En una salida a Internet, PAN-OS aplica Source NAT (SNAT) para que la IP privada del cliente (10.1.1.55) se traduzca a la IP pública del firewall al salir por la zona Untrust; el destino no cambia. La Security Policy solo inspecciona amenazas en el tráfico que PERMITE, por eso una regla allow requiere un Security Profile (al menos Antivirus) para protegerte de malware en las webs que visitas.',
  },
  {
    id: 2,
    title: 'Publishing DMZ Web Server',
    desc: 'Public internet users need to access our Company Portal hosted in the DMZ.',
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
    // Destination NAT: el tráfico entrante llega a la IP pública del portal y se
    // traduce a la IP real del servidor en la DMZ. El origen no cambia.
    nat: {
      type: 'DNAT',
      source: { original: '203.0.113.50', translated: '203.0.113.50' },
      destination: { original: '203.0.113.1', translated: '192.168.50.10' },
      packetLabel: 'DNAT: 192.168.50.10',
    },
    hint: 'Tráfico entrante desde Untrust hacia un servidor publicado. Necesita Destination NAT (DNAT) para traducir la IP pública (203.0.113.1) a la IP real del servidor en la DMZ. Recuerda: la Security Policy se evalúa con la IP destino pre-NAT (la pública), pero ya con la zona destino post-NAT (DMZ).',
    explanation:
      'En PAN-OS la Security Policy compara las IPs originales del paquete (pre-NAT), pero la zona destino ya es la post-NAT. Por eso en un DNAT entrante la regla debe tener la zona destino interna (DMZ) aunque el paquete llegue dirigido a la IP pública: el firewall hace el route-lookup tras aplicar el DNAT para determinar la zona destino, pero la regla de seguridad sigue viendo la IP destino pública original. Resultado: src/dst IP = pre-NAT, src/dst zone = post-NAT.',
  },
  {
    id: 3,
    title: 'Block Non-Standard SSH',
    desc: 'An internal developer is trying to SSH to a server in the DMZ using a non-standard high port (2222).',
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
    // Sin NAT: tráfico intra-organización (Trust -> DMZ). Las IPs no se traducen.
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
    hint: "Usa el servicio 'application-default' para obligar a que cada App-ID solo se permita en su puerto estándar. Como ssh está intentando usar el puerto 2222 (no el 22), con application-default el paquete cae solo y aplicas la buena práctica.",
    explanation:
      "El servicio 'application-default' indica a PAN-OS que permita cada aplicación únicamente en los puertos que App-ID considera estándar para ella. App-ID identifica el tráfico como ssh, cuyo puerto estándar es el 22, pero este paquete llega al 2222: como el puerto no coincide con el application-default, la regla no hace match y el tráfico se descarta. Así fuerzas a que SSH solo viaje por su puerto legítimo sin necesidad de una regla de bloqueo explícita.",
  },
  {
    id: 4,
    title: 'The Hairpin (U-Turn) NAT',
    desc: 'An internal user (Trust) is trying to access the DMZ Web Server via its PUBLIC IP.',
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
    // U-Turn (hairpin) NAT: DNAT traduce el destino (IP pública -> servidor DMZ) y
    // SNAT traduce el origen al firewall, para que el servidor responda al firewall
    // y no directamente al usuario interno (evita el asimetría de rutas).
    nat: {
      type: 'DNAT+SNAT',
      source: { original: '10.1.1.50', translated: '203.0.113.1' },
      destination: { original: '203.0.113.1', translated: '192.168.50.10' },
      packetLabel: 'U-TURN -> 192.168.50.10',
    },
    hint: 'Hairpin (U-Turn): un usuario interno accede al servidor de la DMZ por su IP PÚBLICA. Necesita DNAT (para alcanzar el servidor real) Y SNAT (para que el servidor responda al firewall y no directo al usuario, evitando rutas asimétricas). La Security Policy se evalúa con las IPs pre-NAT pero con la zona destino post-NAT.',
    explanation:
      'En el U-Turn NAT la Security Policy compara las IPs originales del paquete (pre-NAT): el usuario sigue apuntando a la IP pública 203.0.113.1, así que esa es la IP destino que ve la regla. Pero la zona destino ya es la post-NAT: tras el DNAT el route-lookup resuelve hacia la DMZ, por lo que la regla debe ir de zona origen Trust a zona destino DMZ aunque el paquete llegue dirigido a la IP pública. Además hace falta SNAT para traducir el origen al firewall, de modo que el servidor responda al firewall y no directamente al usuario interno (lo que rompería la sesión por enrutamiento asimétrico).',
  },
  {
    id: 5,
    title: 'Data Exfiltration Attempt',
    desc: 'A compromised host in Guest is trying to tunnel data via DNS to a suspicious IP.',
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
    // Sin NAT: el tráfico se bloquea en Security, no llega a traducirse.
    nat: {
      type: 'NONE',
      source: { original: '172.16.0.99', translated: '172.16.0.99' },
      destination: { original: '1.2.3.4', translated: '1.2.3.4' },
      packetLabel: '172.16.0.99',
    },
    hint: 'Un host comprometido en Guest intenta tunelizar datos por DNS hacia una IP sospechosa. La política correcta es una regla de acción DENY (deny). Una regla deny descarta el paquete en la Security Policy: nunca llega al NAT rulebase ni se le aplican perfiles de seguridad.',
    explanation:
      'PAN-OS evalúa la Security Policy de arriba abajo y aplica la primera regla que hace match; aquí la acción correcta es deny para cortar el túnel DNS de exfiltración. Cuando una regla deny hace match, el paquete se descarta en la propia Security Policy: no continúa al NAT rulebase ni se le aplican Security Profiles, porque esos solo inspeccionan el tráfico que se PERMITE. Por eso en este escenario el tipo de NAT y el perfil son irrelevantes: lo único que importa es bloquear.',
  },
];
