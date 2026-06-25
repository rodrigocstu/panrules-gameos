// Escenarios ("tickets") del simulador, como datos puros (sin React).
//
// Cada nivel: { id, title, desc, packet, solution, hint, specialCheck? }
//  - packet:   el tráfico entrante que el jugador observa.
//  - solution: la política correcta esperada (fuente de verdad de la validación).
//  - hint:     pista pedagógica (hoy NO se renderiza — se corrige en WP-3 / T2.7).
//  - specialCheck: validación específica del nivel (hoy solo nivel 3).
//
// NOTA: el contenido es idéntico al que vivía embebido en App.jsx. Refactor sin
// cambiar comportamiento (FASE 1). Los textos en inglés y los hints se reescriben
// en español con comportamiento PAN-OS exacto en WP-3 (T2.7 / T2.8).

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
    hint: 'Zone: Trust->Untrust. App: ssl. NAT: SNAT. Profile: Default (for AV).',
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
    hint: 'Inbound traffic needs DNAT to find the internal server IP.',
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
      return { success: false, msg: 'Configuration mismatch.' };
    },
    hint: "Use 'application-default' service to force standard ports. The packet should naturally drop.",
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
    hint: 'Requires DNAT (to find server) AND SNAT (so server replies to Firewall, not User).',
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
    hint: 'This looks suspicious. Create a DENY rule.',
  },
];
